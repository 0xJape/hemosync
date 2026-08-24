# HemoSync Web

Local Next.js screening application using Node 24 native SQLite.

## Run

1. Install Node.js 24 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000` on laptop.

Server binds to `0.0.0.0:3000` so ESP32 can reach `http://jaypee.local:3000` on same network. Allow private-network TCP port 3000 through Windows Firewall when prompted.

## ESP32

1. Copy `HEMOSYNCTRY2/secrets.example.h` to `HEMOSYNCTRY2/secrets.h`.
2. Set Wi-Fi SSID and password in local `secrets.h`; file is gitignored.
3. Install ESP32 board support plus SparkFun MAX3010x, U8g2, and ArduinoJson libraries.
4. Flash `HEMOSYNCTRY2.ino`.

Patient form creates sole active screening session. ESP32 fetches session, uploads valid heart-rate/SpO₂ result, and backend completes session.

## Local Data

SQLite database is created at `web/data/hemosync.db`. Back up this directory securely. It contains patient health and contact data and is gitignored.
