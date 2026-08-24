#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include <U8g2lib.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define WIFI_SSID "PUT_WIFI_NAME_HERE"
#define WIFI_PASSWORD "PUT_WIFI_PASSWORD_HERE"
#define API_BASE_URL "http://192.168.1.61:3000"
#define DEVICE_ID "hemosync-esp32-01"
#define FIRMWARE_VERSION "1.1.0"
#define AGGREGATE_WINDOWS 3

// -------------------- DEVICES --------------------

MAX30105 particleSensor;

U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(
  U8G2_R0,
  U8X8_PIN_NONE
);

// -------------------- PINS --------------------

#define BTN_START 19
#define BTN_STOP 18
#define BTN_MENU 5

#define LED_GREEN 26
#define LED_YELLOW 25

// -------------------- SENSOR BUFFER --------------------

#define BUFFER_SIZE 100

uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];

// Current calculated readings
int32_t spo2 = 0;
int32_t heartRate = 0;

int8_t validSPO2 = 0;
int8_t validHeartRate = 0;

// Last valid readings
int32_t lastHeartRate = 0;
int32_t lastSpO2 = 0;

bool hasLastHeartRate = false;
bool hasLastSpO2 = false;

// Measurement state
bool measuring = false;
String activeSessionId;
String pendingUploadId;
uint32_t lastAverageIR = 0;
int32_t heartRateWindows[AGGREGATE_WINDOWS];
int32_t spo2Windows[AGGREGATE_WINDOWS];
uint8_t validWindowCount = 0;
unsigned long lastStatusAt = 0;
unsigned long lastCommandPollAt = 0;

void drawStatsScreen(const char* status, bool useLastValues = false);

// -------------------- NETWORK --------------------

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  static bool connectionStarted = false;
  static unsigned long lastAttemptAt = 0;
  if (!connectionStarted || millis() - lastAttemptAt >= 15000) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    connectionStarted = true;
    lastAttemptAt = millis();
    Serial.printf("Connecting to Wi-Fi: %s\n", WIFI_SSID);
  }

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 5000) {
    delay(250);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected. IP: ");
    Serial.println(WiFi.localIP());
  }
  return WiFi.status() == WL_CONNECTED;
}

bool fetchActiveSession() {
  if (!connectWiFi()) return false;

  HTTPClient http;
  http.setTimeout(5000);
  http.begin(String(API_BASE_URL) + "/api/screening-sessions/active");
  int status = http.GET();

  if (status != HTTP_CODE_OK) {
    http.end();
    return false;
  }

  JsonDocument response;
  DeserializationError error = deserializeJson(response, http.getString());
  http.end();

  if (error || response["session"].isNull()) return false;
  activeSessionId = response["session"]["id"].as<String>();
  return !activeSessionId.isEmpty();
}

void postDeviceStatus(const char* state, bool fingerPresent, const char* quality, const char* errorCode = "") {
  if (!connectWiFi()) return;
  JsonDocument payload;
  payload["deviceId"] = DEVICE_ID;
  payload["firmwareVersion"] = FIRMWARE_VERSION;
  payload["state"] = state;
  payload["fingerPresent"] = fingerPresent;
  payload["averageIr"] = lastAverageIR;
  bool publishLiveReadings = strcmp(state, "measuring") == 0 || strcmp(state, "processing") == 0 || strcmp(state, "uploading") == 0;
  if (publishLiveReadings && validHeartRate) payload["heartRate"] = heartRate;
  if (publishLiveReadings && validSPO2) payload["spo2"] = spo2;
  payload["signalQuality"] = quality;
  payload["sessionId"] = activeSessionId;
  if (strlen(errorCode)) payload["errorCode"] = errorCode;
  String body;
  serializeJson(payload, body);
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(String(API_BASE_URL) + "/api/device-status");
  http.addHeader("Content-Type", "application/json");
  int status = http.POST(body);
  Serial.printf("Device status POST: %d\n", status);
  http.end();
  lastStatusAt = millis();
}

void pollDeviceCommand() {
  if (!connectWiFi()) return;
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(String(API_BASE_URL) + "/api/device-commands?deviceId=" + DEVICE_ID);
  int status = http.GET();
  if (status == HTTP_CODE_OK) {
    JsonDocument response;
    if (!deserializeJson(response, http.getString()) && !response["command"].isNull()) {
      String command = response["command"]["command"].as<String>();
      if (command == "start") {
        activeSessionId = response["command"]["sessionId"].as<String>();
        pendingUploadId = "";
        validWindowCount = 0;
        hasLastHeartRate = false;
        hasLastSpO2 = false;
        measuring = !activeSessionId.isEmpty();
        postDeviceStatus(measuring ? "measuring" : "ready", false, "unknown");
      } else if (command == "stop") {
        measuring = false;
        postDeviceStatus("stopped", false, "unknown");
        drawStatsScreen("STOPPED", true);
      }
    }
  }
  http.end();
  lastCommandPollAt = millis();
}

bool uploadMeasurement() {
  if (!connectWiFi() || activeSessionId.isEmpty()) return false;

  JsonDocument payload;
  payload["sessionId"] = activeSessionId;
  payload["uploadId"] = pendingUploadId;
  payload["heartRate"] = heartRate;
  payload["spo2"] = spo2;
  payload["validHeartRate"] = validHeartRate == 1;
  payload["validSpO2"] = validSPO2 == 1;
  payload["averageIr"] = lastAverageIR;
  payload["signalQuality"] = "good";
  payload["sampleWindowCount"] = AGGREGATE_WINDOWS;
  payload["validWindowCount"] = validWindowCount;
  int32_t heartRateMin = heartRateWindows[0], heartRateMax = heartRateWindows[0];
  int32_t spo2Min = spo2Windows[0], spo2Max = spo2Windows[0];
  for (int i = 1; i < validWindowCount; i++) {
    heartRateMin = min(heartRateMin, heartRateWindows[i]);
    heartRateMax = max(heartRateMax, heartRateWindows[i]);
    spo2Min = min(spo2Min, spo2Windows[i]);
    spo2Max = max(spo2Max, spo2Windows[i]);
  }
  payload["heartRateMin"] = heartRateMin;
  payload["heartRateMax"] = heartRateMax;
  payload["spo2Min"] = spo2Min;
  payload["spo2Max"] = spo2Max;

  String body;
  serializeJson(payload, body);

  HTTPClient http;
  http.setTimeout(5000);
  http.begin(String(API_BASE_URL) + "/api/measurements");
  http.addHeader("Content-Type", "application/json");
  int status = http.POST(body);
  Serial.printf("Measurement POST: %d\n", status);
  http.end();

  return status == HTTP_CODE_OK || status == HTTP_CODE_CREATED;
}

// -------------------- OLED LAYOUT --------------------

// OLED resolution: 128 × 64
#define HDR_DIV_Y 13
#define STATUS_DIV_Y 26
#define COL_DIV_X 64
#define ROW_BASE_Y 49
#define UNIT_Y 38
#define CAPTION_Y 60

// -------------------- OLED COMPONENTS --------------------

void drawOuterFrame() {
  u8g2.drawFrame(0, 0, 125, 64);
}

void drawHeaderRow() {
  u8g2.setFont(u8g2_font_7x13B_tr);

  int width = u8g2.getStrWidth("HEMOSYNC");
  int x = (128 - width) / 2;

  u8g2.drawStr(x, 12, "HEMOSYNC");
  u8g2.drawHLine(0, HDR_DIV_Y, 125);
}

void drawStatusRow(const char* text) {
  u8g2.setFont(u8g2_font_5x7_tr);

  int width = u8g2.getStrWidth(text);
  int x = (128 - width) / 2;

  u8g2.drawStr(x, 22, text);
  u8g2.drawHLine(0, STATUS_DIV_Y, 125);
}

void drawStatColumn(
  int xStart,
  int xEnd,
  const char* bigText,
  bool valid,
  const char* unit,
  const char* caption
) {
  // Large reading
  u8g2.setFont(u8g2_font_logisoso18_tr);

  if (valid) {
    u8g2.drawStr(xStart + 7, ROW_BASE_Y, bigText);
  } else {
    u8g2.drawStr(xStart + 7, ROW_BASE_Y, "--");
  }

  // Unit label
  u8g2.setFont(u8g2_font_5x7_tr);
  u8g2.drawStr(xEnd - 20, UNIT_Y, unit);

  // Bottom caption
  int captionWidth = u8g2.getStrWidth(caption);

  int captionX =
    xStart + ((xEnd - xStart) - captionWidth) / 2;

  u8g2.drawStr(captionX, CAPTION_Y, caption);
}

// -------------------- STATISTICS SCREEN --------------------

void drawStatsScreen(
  const char* status,
  bool useLastValues
) {
  u8g2.clearBuffer();

  drawOuterFrame();
  drawHeaderRow();
  drawStatusRow(status);

  // Middle vertical divider
  u8g2.drawVLine(
    COL_DIV_X,
    STATUS_DIV_Y,
    64 - STATUS_DIV_Y
  );

  int32_t displayHeartRate;
  int32_t displaySpO2;

  bool heartRateIsValid;
  bool spo2IsValid;

  if (useLastValues) {
    displayHeartRate = lastHeartRate;
    displaySpO2 = lastSpO2;

    heartRateIsValid = hasLastHeartRate;
    spo2IsValid = hasLastSpO2;
  } else {
    displayHeartRate = heartRate;
    displaySpO2 = spo2;

    heartRateIsValid = validHeartRate;
    spo2IsValid = validSPO2;
  }

  char bpmText[8];
  char spo2Text[8];

  snprintf(
    bpmText,
    sizeof(bpmText),
    "%ld",
    (long)displayHeartRate
  );

  snprintf(
    spo2Text,
    sizeof(spo2Text),
    "%ld",
    (long)displaySpO2
  );

  drawStatColumn(
    1,
    COL_DIV_X,
    bpmText,
    heartRateIsValid,
    "BPM",
    "HEART RATE"
  );

  drawStatColumn(
    COL_DIV_X,
    127,
    spo2Text,
    spo2IsValid,
    "%",
    "SPO2"
  );

  u8g2.sendBuffer();
}

// -------------------- OLED SCREENS --------------------

void introScreen() {
  u8g2.setFont(u8g2_font_crox4tb_tf);

  for (int lineWidth = 0; lineWidth <= 115; lineWidth += 8) {
    u8g2.clearBuffer();

    u8g2.drawFrame(0, 0, 125, 64);
    u8g2.drawStr(8, 35, "HEMOSYNC");
    u8g2.drawHLine(5, 45, lineWidth);

    u8g2.sendBuffer();
    delay(35);
  }

  delay(900);
}

void idleScreen() {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);

  u8g2.clearBuffer();
  drawOuterFrame();

  u8g2.setFont(u8g2_font_7x13B_tr);

  int titleWidth = u8g2.getStrWidth("HEMOSYNC");

  u8g2.drawStr(
    (128 - titleWidth) / 2,
    26,
    "HEMOSYNC"
  );

  u8g2.setFont(u8g2_font_6x10_tr);

  int instructionWidth =
    u8g2.getStrWidth("PRESS START");

  u8g2.drawStr(
    (128 - instructionWidth) / 2,
    42,
    "PRESS START"
  );

  u8g2.sendBuffer();
}

void placeFingerScreen() {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH);

  u8g2.clearBuffer();

  u8g2.drawFrame(10, 10, 108, 44);

  u8g2.setFont(u8g2_font_6x12_tr);

  int textWidth =
    u8g2.getStrWidth("PLACE FINGER");

  u8g2.drawStr(
    (128 - textWidth) / 2,
    26,
    "PLACE FINGER"
  );

  // Simple finger icon
  u8g2.drawBox(60, 32, 8, 8);
  u8g2.drawBox(54, 40, 20, 10);

  u8g2.sendBuffer();
}

void drawDashboard() {
  drawStatsScreen("MEASURING...");
}

void completedScreen() {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);

  drawStatsScreen("COMPLETED", true);
}

// -------------------- BUTTON HANDLING --------------------

void handleButtons() {
  // Start button
  if (digitalRead(BTN_START) == LOW) {
    delay(150);

    activeSessionId = "";
    pendingUploadId = "";
    validWindowCount = 0;
    hasLastHeartRate = false;
    hasLastSpO2 = false;
    measuring = fetchActiveSession();

    postDeviceStatus(measuring ? "measuring" : "ready", false, "unknown");

    if (!measuring) {
      drawStatsScreen("NO ACTIVE SESSION");
    }

    // Wait until the button is released
    while (digitalRead(BTN_START) == LOW) {
      delay(10);
    }
  }

  // Stop button
  if (digitalRead(BTN_STOP) == LOW) {
    delay(150);

    measuring = false;
    postDeviceStatus("stopped", false, "unknown");
    drawStatsScreen("STOPPED", true);

    while (digitalRead(BTN_STOP) == LOW) {
      delay(10);
    }
  }

  // Menu button
  if (digitalRead(BTN_MENU) == LOW) {
    delay(150);

    measuring = false;
    postDeviceStatus("idle", false, "unknown");

    introScreen();
    idleScreen();

    while (digitalRead(BTN_MENU) == LOW) {
      delay(10);
    }
  }
}

// -------------------- MEASUREMENT --------------------

void measure() {
  // Collect 100 red and infrared samples
  for (int i = 0; i < BUFFER_SIZE; i++) {
    while (!particleSensor.available()) {
      particleSensor.check();

      // Allow the stop button to interrupt measurement
      if (digitalRead(BTN_STOP) == LOW) {
        measuring = false;
        completedScreen();
        return;
      }
    }

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();

    particleSensor.nextSample();
  }

  // Calculate average infrared value for finger detection
  uint64_t totalIR = 0;

  for (int i = 0; i < BUFFER_SIZE; i++) {
    totalIR += irBuffer[i];
  }

  uint32_t averageIR = totalIR / BUFFER_SIZE;
  lastAverageIR = averageIR;

  // No finger detected
  if (averageIR < 50000) {
    validHeartRate = 0;
    validSPO2 = 0;

    placeFingerScreen();
    postDeviceStatus("waiting_for_finger", false, "poor");
    return;
  }

  // Finger detected
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_SIZE,
    redBuffer,
    &spo2,
    &validSPO2,
    &heartRate,
    &validHeartRate
  );

  // Save the heart rate independently when valid
  if (validHeartRate) {
    lastHeartRate = heartRate;
    hasLastHeartRate = true;
  }

  // Save the SpO2 independently when valid
  if (validSPO2) {
    lastSpO2 = spo2;
    hasLastSpO2 = true;
  }

  // Serial monitor output
  Serial.print("Heart Rate: ");

  if (validHeartRate) {
    Serial.print(heartRate);
    Serial.print(" BPM");
  } else {
    Serial.print("Invalid");
  }

  Serial.print(" | SpO2: ");

  if (validSPO2) {
    Serial.print(spo2);
    Serial.print("%");
  } else {
    Serial.print("Invalid");
  }

  Serial.print(" | Average IR: ");
  Serial.println(averageIR);

  drawDashboard();

  postDeviceStatus("measuring", true, validHeartRate && validSPO2 ? "good" : "fair");

  if (validHeartRate && validSPO2 && validWindowCount < AGGREGATE_WINDOWS) {
    heartRateWindows[validWindowCount] = heartRate;
    spo2Windows[validWindowCount] = spo2;
    validWindowCount++;
  }

  if (validWindowCount < AGGREGATE_WINDOWS) return;

  postDeviceStatus("processing", true, "good");

  int32_t heartRateTotal = 0, spo2Total = 0;
  for (int i = 0; i < validWindowCount; i++) {
    heartRateTotal += heartRateWindows[i];
    spo2Total += spo2Windows[i];
  }
  heartRate = heartRateTotal / validWindowCount;
  spo2 = spo2Total / validWindowCount;

  if (validHeartRate && validSPO2 && pendingUploadId.isEmpty()) {
    pendingUploadId = "esp32-" + String((uint32_t)esp_random(), HEX);
  }

  // Keep processing state visible before result is saved.
  delay(10000);
  postDeviceStatus("uploading", true, "good");
  if (validHeartRate && validSPO2 && uploadMeasurement()) {
    measuring = false;
    postDeviceStatus("completed", true, "good");
    completedScreen();
    Serial.println("Measurement uploaded successfully.");
    activeSessionId = "";
    pendingUploadId = "";
    validWindowCount = 0;
    validHeartRate = 0;
    validSPO2 = 0;
    lastAverageIR = 0;
    postDeviceStatus("idle", false, "unknown");
    idleScreen();
  }
}

// -------------------- SETUP --------------------

void setup() {
  Serial.begin(115200);
  connectWiFi();
  postDeviceStatus("idle", false, "unknown");

  // Button pins
  pinMode(BTN_START, INPUT_PULLUP);
  pinMode(BTN_STOP, INPUT_PULLUP);
  pinMode(BTN_MENU, INPUT_PULLUP);

  // LED pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);

  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);

  // Initialize I2C
  Wire.begin();

  // Initialize OLED
  u8g2.begin();
  introScreen();

  // Initialize MAX30102/MAX30105
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    u8g2.clearBuffer();
    u8g2.drawFrame(0, 0, 125, 64);

    u8g2.setFont(u8g2_font_6x10_tr);
    u8g2.drawStr(17, 28, "SENSOR ERROR");
    u8g2.drawStr(13, 43, "CHECK WIRING");

    u8g2.sendBuffer();

    Serial.println("MAX30102/MAX30105 sensor not found.");

    while (true) {
      digitalWrite(LED_YELLOW, HIGH);
      delay(300);

      digitalWrite(LED_YELLOW, LOW);
      delay(300);
    }
  }

  // Configure sensor
  particleSensor.setup();

  particleSensor.setPulseAmplitudeRed(0x1F);
  particleSensor.setPulseAmplitudeIR(0x1F);
  particleSensor.setPulseAmplitudeGreen(0);

  Serial.println("HemoSync initialized successfully.");

  idleScreen();
}

// -------------------- MAIN LOOP --------------------

void loop() {
  handleButtons();

  if (millis() - lastCommandPollAt > 2000) pollDeviceCommand();

  if (measuring) {
    measure();
  } else if (millis() - lastStatusAt > 10000) {
    postDeviceStatus("idle", false, "unknown");
  }
}