# HemoSync API and Integrations

## REST Endpoints
POST /api/measurements
POST /api/ai/analyze
POST /api/reports/send
GET /api/patients
GET /api/devices

## ESP32 Payload
- deviceId
- patientId
- heartRate
- spo2
- validity flags
- measuredAt

## Integrations
### Groq
Generate structured screening summaries.

### Make.com
Send email and SMS.

### Cloudflare Tunnel
Expose backend securely over HTTPS.
