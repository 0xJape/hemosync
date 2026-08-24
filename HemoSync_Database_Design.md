# HemoSync Database Design

## Purpose

Store validated ESP32 MAX30102 screening data, patient context, generated summaries, reports, deliveries, and audit events. Raw red/IR sample buffers are not stored in normal workflow; firmware sends calculated readings plus average IR signal level.

## Core Tables

- patients
- devices
- screening_sessions
- measurements
- ai_analyses
- reports
- notification_logs
- audit_logs

## Relationships

```text
Patient -> Screening session -> Measurement -> AI analysis -> Report -> Notification log
Device  -> Screening session -> Measurement
```

## Required Fields

### patients

- id
- full_name
- date_of_birth
- sex
- email
- mobile_number
- consent_given_at
- created_at
- updated_at

### devices

- id — ESP32 `deviceId`, for example `HEMOSYNC-STATION-001`
- display_name
- station_identifier
- device_key_hash
- firmware_version
- last_seen_at
- status
- created_at

### screening_sessions

- id
- patient_id
- device_id
- status — `preparing`, `measuring`, `completed`, `cancelled`, `failed`
- started_at
- completed_at

### measurements

Fields directly supported by current firmware or its upload payload:

- id
- screening_session_id
- patient_id
- device_id
- heart_rate_bpm — calculated `heartRate`; nullable when invalid
- spo2_percent — calculated `spo2`; nullable when invalid
- heart_rate_valid — calculated `validHeartRate`
- spo2_valid — calculated `validSPO2`
- average_ir — average infrared sample level; finger-placement and signal indicator
- signal_quality — backend-derived from validity flags and `average_ir`
- measured_at — device measurement timestamp
- received_at — backend receipt timestamp
- measurement_context — optional, for example `resting`
- upload_id — unique device-generated idempotency value

Constraints:

- `heart_rate_bpm` is null when `heart_rate_valid` is false.
- `spo2_percent` is null when `spo2_valid` is false.
- `upload_id` is unique per device to prevent duplicate uploads after retries.
- Heart rate and SpO₂ are stored only after backend range and session validation.

### ai_analyses

- id
- measurement_id
- model_name
- summary_json
- confidence_level — based on data quality, not diagnosis certainty
- generated_at
- status
- failure_reason

### reports

- id
- measurement_id
- storage_path
- generated_at
- status

### notification_logs

- id
- report_id
- channel — `email` or `sms`
- destination_masked
- status — `pending`, `sending`, `sent`, `delivered`, `failed`
- provider_message_id
- attempted_at
- failure_reason

### audit_logs

- id
- action
- entity_type
- entity_id
- occurred_at
- metadata_json

## ESP32 Measurement Input

Current firmware calculates data from 100 MAX30102 red and infrared samples:

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
	"measuredAt": "2026-07-31T00:02:00+08:00"
}
```

`redBuffer` and `irBuffer` are working firmware buffers. Do not add blob storage for them unless calibration, troubleshooting, or research needs raw waveform analysis.

## Storage Choice

- Development prototype: SQLite.
- Shared or production station: PostgreSQL with encrypted backups and restricted database access.

## Indexes

- `patients(full_name)`
- `patients(email)`
- `patients(mobile_number)`
- `measurements(patient_id, measured_at DESC)`
- `measurements(screening_session_id)`
- `measurements(device_id, upload_id)` unique
- `notification_logs(report_id, attempted_at DESC)`

## Data Safety

- Encrypt database connections and backups.
- Store device keys only as hashes.
- Keep AI and Make.com payloads to minimum necessary patient data.
- Audit record access, edits, report generation, and notification delivery.
- Do not treat invalid values, zero, or missing values as valid physiological measurements.
