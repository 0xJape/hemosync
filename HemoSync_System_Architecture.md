# HemoSync System Architecture

## 1. Document Purpose

This document describes the technical architecture of **HemoSync**, an AI-assisted health screening station designed for deployment in clinics, barangay health centers, school clinics, workplace health stations, medical missions, and similar testing environments.

It explains how the embedded device, web application, backend services, database, Groq-powered AI component, Cloudflare Tunnel, and Make.com automation workflows communicate with one another.

HemoSync is intended to support health screening workflows. It does not diagnose hypertension, anemia, or other medical conditions.

---

## 2. Architecture Overview

HemoSync uses a modular architecture composed of the following major layers:

1. **Patient Screening Layer**
2. **Embedded Device Layer**
3. **Local Network and Tunnel Layer**
4. **Backend Application Layer**
5. **Database Layer**
6. **AI Analysis Layer**
7. **Automation and Notification Layer**
8. **Web Interface Layer**

Each layer has a specific responsibility so that the system remains maintainable, scalable, and easier to secure.

---

## 3. High-Level Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                    HEMOSYNC TESTING STATION                 │
│                                                             │
│  Patient                                                    │
│     │                                                       │
│     ▼                                                       │
│  MAX30102 Sensor                                            │
│     │                                                       │
│     ▼                                                       │
│  ESP32 Controller                                           │
│  - Collects red and infrared signals                        │
│  - Calculates heart rate and SpO₂                           │
│  - Validates sensor readings                                │
│  - Sends measurement data                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              LOCAL SERVER OR APPLICATION HOST              │
│                                                             │
│  Web Application + Backend API                              │
│  - Patient registration                                     │
│  - Measurement processing                                   │
│  - Record management                                        │
│  - Report generation                                        │
│  - AI request orchestration                                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE TUNNEL                        │
│                                                             │
│  - Provides secure public access                            │
│  - Avoids direct port forwarding                            │
│  - Routes traffic to the local application                  │
│  - Supports HTTPS and access policies                       │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
                ▼                     ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│       DATABASE           │   │        GROQ API              │
│                          │   │                              │
│ - Patient profiles       │   │ - Generates summaries       │
│ - Measurements           │   │ - Explains trends           │
│ - AI outputs             │   │ - Produces patient-friendly │
│ - Notification logs      │   │   educational insights      │
│ - Audit records          │   │ - Does not diagnose         │
└──────────────┬───────────┘   └──────────────┬───────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       MAKE.COM                              │
│                                                             │
│ - Receives approved screening payload                       │
│ - Sends email result                                        │
│ - Sends SMS notification                                    │
│ - Records delivery status                                   │
│ - Retries failed automation steps                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                    Patient Email and SMS
```

---

## 4. Core Architectural Principles

### 4.1 Separation of Responsibilities

Each system component should perform only the task it is designed for.

- The ESP32 handles sensor collection and device control.
- The backend validates, processes, and stores measurements.
- The database stores patient and screening records.
- Groq generates educational summaries from structured data.
- Make.com handles email and SMS workflows.
- Cloudflare Tunnel exposes the local application securely.
- The dashboard supports healthcare workers and station operators.

### 4.2 Human-in-the-Loop Screening

AI-generated results must remain supportive rather than authoritative.

A healthcare worker should be able to:

- Review the measurement
- Check measurement quality
- Repeat an invalid or unusual test
- Approve or reject the generated summary
- Correct patient information
- Decide whether professional referral is necessary

### 4.3 Privacy by Design

Only the minimum necessary patient information should be collected and transmitted.

Sensitive data should not be exposed in:

- ESP32 serial logs
- Public URLs
- AI prompts beyond what is required
- Make.com debug histories
- Unprotected browser storage
- Unencrypted API requests

### 4.4 Graceful Failure

The system should continue operating safely when one external service is unavailable.

Examples:

- If Groq is unavailable, the measurement should still be saved.
- If Make.com fails, the report should remain accessible on the dashboard.
- If SMS fails, email may still be sent.
- If the internet is unavailable, the system may queue records for later synchronization.
- If the sensor reading is invalid, the system should request a repeat measurement.

---

## 5. System Components

## 5.1 MAX30102 Sensor

The MAX30102 is responsible for collecting red and infrared light readings from the patient's finger.

### Main Responsibilities

- Detect finger placement
- Capture red-light data
- Capture infrared-light data
- Provide raw samples to the ESP32
- Support heart-rate and SpO₂ calculations

### Limitations

The MAX30102 does not directly measure:

- Blood pressure
- Hemoglobin concentration
- Hypertension
- Anemia
- Blood glucose
- Body temperature

Therefore, HemoSync should describe its results as preliminary physiological screening data.

---

## 5.2 ESP32 Controller

The ESP32 acts as the embedded controller of the HemoSync station.

### Main Responsibilities

- Initialize the MAX30102 sensor
- Read red and infrared samples
- Detect whether a finger is present
- Calculate heart rate and SpO₂
- Validate measurement results
- Control the OLED display
- Control indicator LEDs
- Handle Start, Stop, and Menu buttons
- Send completed readings to the backend API
- Display local status messages

### Suggested Device States

```text
IDLE
WAITING_FOR_PATIENT
PLACE_FINGER
COLLECTING_SAMPLES
VALIDATING_READING
UPLOADING
COMPLETED
UPLOAD_FAILED
SENSOR_ERROR
```

Using explicit states makes the firmware easier to maintain than relying on multiple unrelated Boolean variables.

---

## 5.3 OLED User Interface

The OLED provides immediate feedback at the testing station.

### Suggested Information

- HemoSync branding
- Device status
- Finger placement instruction
- Measurement progress
- Heart rate
- SpO₂
- Completion status
- Upload success or failure
- Sensor connection errors

The OLED should not display lengthy AI explanations. Detailed output belongs on the web dashboard and patient report.

---

## 5.4 Local Web Application

The local web application serves as the main interface for healthcare workers or screening-station operators.

### Main Responsibilities

- Register patients
- Search existing patients
- Start or prepare a screening session
- Associate incoming measurements with the correct patient
- Review measurement quality
- Display AI-generated summaries
- View screening history
- Trigger email or SMS delivery
- Download reports
- Review device status

### Recommended Two-Page Structure

#### Page 1 — Screening Dashboard

Contains:

- Current patient
- Device status
- Latest heart rate and SpO₂
- Measurement quality
- AI screening insight
- Send report controls
- Recent activity
- Active alerts

#### Page 2 — Patient Records

Contains:

- Patient search
- Patient profile
- Screening history
- Trend charts
- AI pattern summary
- Email and SMS delivery history
- Downloadable reports

Modals and side panels can handle secondary actions without requiring additional pages.

---

## 5.5 Backend API

The backend API is the central coordination layer.

### Main Responsibilities

- Authenticate devices and users
- Receive measurement data
- Validate payload structure
- Prevent duplicate submissions
- Associate measurements with patients
- Save records to the database
- Call the Groq API
- Build patient reports
- Trigger Make.com workflows
- Return upload status to the device
- Maintain audit logs

### Suggested API Endpoints

```text
POST   /api/auth/login
POST   /api/patients
GET    /api/patients
GET    /api/patients/{patientId}
PUT    /api/patients/{patientId}

POST   /api/screening-sessions
GET    /api/screening-sessions/{sessionId}
POST   /api/measurements
GET    /api/patients/{patientId}/measurements

POST   /api/ai/analyze/{measurementId}
POST   /api/reports/{measurementId}/send
GET    /api/reports/{measurementId}

GET    /api/devices
POST   /api/devices/heartbeat
GET    /api/notifications/{patientId}
```

---

## 6. Measurement Data Flow

## 6.1 Patient Registration

1. The operator opens the HemoSync dashboard.
2. The operator searches for an existing patient or creates a new patient profile.
3. The backend validates the patient details.
4. The database returns a patient identifier.
5. A new screening session is created.
6. The session identifier is linked to the testing station.

## 6.2 Sensor Measurement

1. The operator starts the screening session.
2. The patient places a finger on the sensor.
3. The ESP32 collects the required sample buffer.
4. The firmware checks average infrared intensity.
5. The algorithm calculates heart rate and SpO₂.
6. Validity flags are evaluated.
7. The device displays the result locally.

## 6.3 Measurement Upload

1. The ESP32 creates a JSON payload.
2. The payload is sent through HTTPS.
3. The backend verifies the device key or token.
4. The backend validates the patient session.
5. The backend checks for duplicate measurements.
6. The measurement is stored in the database.
7. The backend responds with a success or failure message.

### Example Measurement Payload

```json
{
  "deviceId": "HEMOSYNC-STATION-001",
  "sessionId": "scr_20260731_0001",
  "patientId": "pat_000145",
  "heartRate": 78,
  "spo2": 97,
  "validHeartRate": true,
  "validSpO2": true,
  "averageIr": 78210,
  "signalQuality": "high",
  "measurementContext": "resting",
  "measuredAt": "2026-07-31T00:02:00+08:00"
}
```

---

## 7. AI Architecture Using Groq

Groq should be used as a language-based analysis and communication layer rather than as the source of the numerical medical calculation.

The firmware and backend should calculate and validate the sensor readings before Groq receives them.

### Groq Responsibilities

- Explain the latest readings in clear language
- Summarize changes across previous screenings
- Identify repeated patterns in stored records
- Generate a patient-friendly screening summary
- Generate a healthcare-worker summary
- Provide educational recommendations
- Explain when a repeat measurement may be appropriate

### Groq Should Not

- Diagnose hypertension
- Diagnose anemia
- Confirm a medical emergency
- Replace a healthcare professional
- Invent measurements
- Estimate blood pressure from unsupported inputs
- Estimate hemoglobin concentration without validated hardware or methods
- Provide medication instructions

### Suggested AI Input Structure

The backend should send structured information instead of an unrestricted prompt.

```json
{
  "patientContext": {
    "ageGroup": "adult",
    "sex": "female"
  },
  "latestMeasurement": {
    "heartRate": 78,
    "spo2": 97,
    "heartRateValid": true,
    "spo2Valid": true,
    "signalQuality": "high",
    "context": "resting"
  },
  "recentMeasurements": [
    {
      "heartRate": 81,
      "spo2": 96,
      "measuredAt": "2026-07-28T09:30:00+08:00"
    },
    {
      "heartRate": 79,
      "spo2": 97,
      "measuredAt": "2026-07-25T10:10:00+08:00"
    }
  ],
  "requestedOutput": {
    "type": "screening_summary",
    "language": "English",
    "maximumWords": 120
  }
}
```

### Suggested AI Output Structure

Groq should return structured JSON whenever possible.

```json
{
  "summary": "The latest heart rate and oxygen saturation readings are consistent with the patient's recent screenings.",
  "trend": "Stable",
  "attentionLevel": "informational",
  "repeatMeasurementRecommended": false,
  "reasons": [
    "Both measurements were marked valid.",
    "The signal quality was high.",
    "No major change was observed compared with recent records."
  ],
  "disclaimer": "This summary supports screening only and is not a diagnosis."
}
```

Structured output reduces the risk of unpredictable text and makes the interface easier to control.

---

## 8. Screening Logic and AI Boundaries

The system should separate three types of decision-making.

### 8.1 Deterministic Calculations

Handled by firmware or backend code:

- Heart-rate calculation
- SpO₂ calculation
- Average values
- Minimum and maximum values
- Trend percentages
- Measurement count
- Signal quality checks
- Threshold comparisons
- Duplicate detection

### 8.2 Rule-Based Screening

Handled by explicitly defined rules:

- Invalid measurement
- Missing finger
- Low signal quality
- Repeat measurement required
- Value outside a configured screening range
- Multiple unusual results within a selected period
- Missing patient contact information

### 8.3 AI-Assisted Communication

Handled by Groq:

- Natural-language explanation
- Patient-friendly summary
- Healthcare-worker summary
- Historical pattern description
- Educational guidance
- Report wording

This separation prevents the AI model from controlling critical numerical decisions.

---

## 9. Cloudflare Tunnel Architecture

Cloudflare Tunnel allows the HemoSync web application to be accessed remotely without directly exposing the local server to the public internet.

### Basic Flow

```text
Remote Browser
      │
      ▼
Cloudflare Edge
      │
      ▼
Cloudflare Tunnel
      │
      ▼
Local HemoSync Application
```

### Benefits

- No direct router port forwarding
- HTTPS support
- Hidden local IP address
- Centralized DNS routing
- Optional access-control policies
- Easier remote demonstration
- Protection from direct inbound connections

### Recommended Configuration

```text
Public hostname:
hemosync.example.com

Tunnel destination:
http://localhost:3000
```

### Recommended Security Controls

- Cloudflare Access for operator login
- HTTPS-only access
- Rate limiting
- Bot protection where appropriate
- Separate public and private routes
- Restricted API endpoints
- Device-specific authentication
- Logging of failed requests

Cloudflare Tunnel secures the route to the application, but it does not replace application-level authentication.

---

## 10. Make.com Automation Architecture

Make.com receives a webhook from the HemoSync backend after a report has been generated and approved for sending.

### Recommended Workflow

```text
HemoSync Backend
      │
      ▼
Make.com Webhook
      │
      ▼
Validate Payload
      │
      ├──► Send Email
      │
      ├──► Send SMS
      │
      └──► Return Delivery Result
```

### Suggested Make.com Scenario

1. **Custom Webhook**
   - Receives patient contact details and report information.

2. **Payload Validation**
   - Checks whether email and mobile number are present.
   - Rejects incomplete or malformed requests.

3. **Email Module**
   - Sends a formatted screening report.
   - May include a secure report link or PDF attachment.

4. **SMS Module**
   - Sends a short notification.
   - Avoids including excessive sensitive information.

5. **Delivery Logging**
   - Sends status information back to the backend.
   - Records success, failure, and retry details.

### Suggested Webhook Payload

```json
{
  "notificationId": "notif_000892",
  "patientId": "pat_000145",
  "email": "patient@example.com",
  "mobileNumber": "+639171234567",
  "emailSubject": "Your HemoSync Screening Result",
  "smsMessage": "Your HemoSync screening is complete. A detailed report has been sent to your registered email.",
  "reportUrl": "https://hemosync.example.com/reports/secure-token",
  "expiresAt": "2026-08-07T00:02:00+08:00"
}
```

### Privacy Recommendation

Do not place full medical details in the SMS message. SMS may be displayed on a locked phone screen.

---

## 11. Database Architecture

A relational database is recommended because HemoSync contains structured relationships between patients, devices, sessions, measurements, reports, and notifications.

### Suggested Tables

#### users

```text
id
name
email
password_hash
role
created_at
updated_at
```

#### patients

```text
id
patient_code
full_name
birth_date
sex
email
mobile_number
emergency_contact
consent_status
created_at
updated_at
```

#### devices

```text
id
device_code
station_name
api_key_hash
status
firmware_version
last_seen_at
created_at
updated_at
```

#### screening_sessions

```text
id
patient_id
device_id
operator_id
status
measurement_context
started_at
completed_at
created_at
```

#### measurements

```text
id
session_id
heart_rate
spo2
valid_heart_rate
valid_spo2
average_ir
signal_quality
measured_at
created_at
```

#### ai_analyses

```text
id
measurement_id
model_name
prompt_version
summary
trend
attention_level
repeat_recommended
raw_response
generated_at
```

#### reports

```text
id
measurement_id
report_number
file_path
secure_token_hash
expires_at
generated_at
```

#### notification_logs

```text
id
report_id
channel
recipient_masked
status
provider_reference
sent_at
error_message
created_at
```

#### audit_logs

```text
id
user_id
action
resource_type
resource_id
ip_address
created_at
```

---

## 12. Authentication and Authorization

HemoSync should support role-based access control.

### Suggested Roles

#### Administrator

- Manage users
- Manage devices
- Configure integrations
- Review logs
- Manage system settings

#### Healthcare Worker

- Register patients
- Conduct screenings
- Review measurements
- Generate and send reports
- View patient histories

#### Station Operator

- Select patients
- Start screenings
- Review immediate results
- Repeat invalid measurements

#### Viewer or Auditor

- View approved reports
- Review audit logs
- Cannot edit patient records

### Device Authentication

Each ESP32 should have:

- A unique device identifier
- A securely generated API token
- A registered station assignment
- Token revocation support

API keys should not be stored in public source-code repositories.

---

## 13. Security Architecture

Because HemoSync handles personal and health-related information, security should be treated as a core system requirement.

### Required Controls

- HTTPS for all network traffic
- Password hashing
- Role-based authorization
- Device authentication
- Input validation
- Parameterized database queries
- Protection against cross-site scripting
- Protection against cross-site request forgery
- Rate limiting
- Secure session cookies
- Audit logging
- Backup and recovery procedures
- Restricted access to AI and automation keys
- Encryption of sensitive stored data where appropriate

### Secret Management

The following should be stored in environment variables or a secrets manager:

```text
DATABASE_URL
SESSION_SECRET
GROQ_API_KEY
MAKE_WEBHOOK_URL
CLOUDFLARE_TUNNEL_TOKEN
EMAIL_PROVIDER_KEY
SMS_PROVIDER_KEY
```

Never place these values inside frontend JavaScript or public repositories.

---

## 14. Data Privacy and Consent

Before collecting screening data, the system should clearly inform the patient about:

- What data will be collected
- Why it is being collected
- How long it will be retained
- Who may access it
- Whether AI will process the data
- Whether results will be sent through email or SMS
- How the patient may request correction or deletion

The system should record the patient's consent status.

### Data Minimization

Groq should receive only the information required to generate the requested summary.

Instead of sending the patient's full identity, the backend can send:

- Age group
- Sex, only when relevant
- Measurement values
- Measurement context
- Recent trends
- Data-quality indicators

---

## 15. Error Handling

### Sensor Errors

Examples:

- Sensor not found
- Finger not detected
- Low signal
- Invalid heart-rate result
- Invalid SpO₂ result

Response:

- Display a clear instruction
- Do not upload an invalid record as a completed screening
- Allow the operator to retry

### Network Errors

Examples:

- Wi-Fi disconnected
- Tunnel unavailable
- Backend unavailable

Response:

- Save the pending measurement locally when possible
- Mark it as unsynchronized
- Retry after reconnection
- Avoid duplicate records through a unique request ID

### AI Errors

Examples:

- Groq timeout
- Invalid JSON output
- Rate limit reached

Response:

- Save the measurement normally
- Display a rule-based summary
- Allow AI analysis to be regenerated later
- Never block the report solely because AI is unavailable

### Notification Errors

Examples:

- Invalid email
- Invalid phone number
- SMS provider failure
- Make.com scenario error

Response:

- Record the failure
- Allow manual retry
- Show delivery status to the operator
- Avoid repeating successful notifications

---

## 16. Offline and Synchronization Strategy

Testing stations may experience unreliable internet connectivity.

A resilient implementation can use an offline queue.

### Offline Flow

```text
Measurement Completed
        │
        ▼
Save Locally with Request ID
        │
        ▼
Attempt Upload
   │             │
Success        Failure
   │             │
Mark Synced    Keep Pending
                 │
                 ▼
             Retry Later
```

Each measurement should include a unique request identifier so repeated uploads do not create duplicate records.

---

## 17. Futuristic User Interface Direction

The visual design should feel advanced without sacrificing medical clarity.

### Theme

- Primary red
- White background
- Deep charcoal text
- Soft gray surfaces
- Controlled red gradients
- Subtle glow around active AI components

### Suggested Palette

```text
Primary Red:       #C1121F
Deep Red:          #780000
Soft Red:          #E63946
White:             #FFFFFF
Off-White:         #F8F9FA
Light Gray:        #E9ECEF
Charcoal:          #1F2937
Muted Text:        #6B7280
```

### Interface Characteristics

- Large numerical readings
- Rounded cards
- Thin borders
- Subtle shadows
- Animated status indicators
- Scanning-line animation during measurement
- Streaming AI text
- Minimal navigation
- High contrast
- Clear warning hierarchy

### AI Visual Elements

- Pulsing AI status orb
- Streaming analysis text
- “Analyzing patterns” animation
- Confidence based on data quality
- Evidence list explaining the summary
- Clear AI disclaimer

The interface should avoid excessive neon effects because the platform is intended for health screening.

---

## 18. Recommended Deployment Topology

### Prototype Deployment

```text
ESP32 Device
   │
   ▼
Local Wi-Fi Network
   │
   ▼
Developer Computer or Mini PC
   │
   ├── HemoSync Web Application
   ├── Backend API
   └── Database
          │
          ▼
   Cloudflare Tunnel
          │
          ├── Groq API
          └── Make.com
```

### More Reliable Production Deployment

```text
ESP32 Device
   │
   ▼
Internet
   │
   ▼
Cloud-Hosted Backend
   │
   ├── Managed Database
   ├── Object Storage
   ├── Groq API
   └── Make.com
```

Cloudflare Tunnel is appropriate for demonstrations and controlled station deployments. A cloud-hosted backend may be more reliable for wider production use.

---

## 19. Suggested Technology Stack

### Embedded Device

- ESP32
- MAX30102
- SH1106 OLED
- Arduino framework
- Wi-Fi
- HTTPS client

### Frontend

- Next.js or React
- Tailwind CSS
- Framer Motion
- Lucide icons
- Recharts or Chart.js

### Backend

- Next.js API routes, Node.js, Express, or NestJS
- REST API
- Zod or another validation library
- JWT or secure session authentication

### Database

- PostgreSQL
- Prisma ORM

### External Services

- Groq API
- Make.com
- Cloudflare Tunnel
- Email provider
- SMS provider

---

## 20. Recommended Implementation Sequence

### Phase 1 — Device Integration

- Stabilize heart-rate and SpO₂ readings
- Add Wi-Fi connectivity
- Create device authentication
- Upload test JSON payloads

### Phase 2 — Backend and Database

- Create patient records
- Create screening sessions
- Store measurements
- Validate duplicates
- Build device-status endpoints

### Phase 3 — Two-Page Dashboard

- Build the screening dashboard
- Build patient records
- Add charts
- Add delivery status indicators

### Phase 4 — AI Integration

- Build structured Groq prompts
- Require structured output
- Save AI summaries
- Add fallback rule-based summaries

### Phase 5 — Automation

- Create Make.com webhook
- Configure email
- Configure SMS
- Save delivery results

### Phase 6 — Deployment and Security

- Configure Cloudflare Tunnel
- Enable HTTPS
- Apply access controls
- Protect secrets
- Test backups
- Review audit logs

---

## 21. System Boundary and Medical Disclaimer

HemoSync is an AI-assisted health screening and record-management platform.

The current device measures:

- Heart rate
- Blood oxygen saturation

These values may help healthcare workers identify readings that deserve further review. However, the system cannot independently diagnose hypertension, anemia, cardiovascular disease, respiratory disease, or any other medical condition.

Hypertension screening requires a validated blood-pressure measurement device. Anemia assessment normally requires appropriate clinical evaluation and laboratory testing, such as hemoglobin measurement.

All AI outputs must be presented as educational screening support and must not replace professional medical judgment.
