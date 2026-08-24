# HemoSync

HemoSync is an AI-assisted health screening platform that combines an ESP32 measurement station, a Next.js web application, SQLite storage, and automated patient reporting. It supports routine heart-rate and blood-oxygen screening while keeping healthcare workers in control of review and follow-up.

> **Important:** HemoSync provides screening support, not medical diagnosis. Measurements and AI-generated summaries must be reviewed by qualified healthcare personnel.

## Project Overview

HemoSync digitizes the workflow from patient registration to screening-result delivery:

1. Healthcare worker registers or selects a patient.
2. ESP32 and MAX30102 sensor collect heart-rate and SpO₂ data.
3. The device sends validated measurements to the web API.
4. The application stores patient, session, and measurement records.
5. Groq generates a cautious, patient-facing screening summary.
6. Results can be delivered through email and SMS automation.
7. Healthcare workers review records, sessions, measurements, and device status from the dashboard.

The project is intended for clinics, rural health units, barangay health centers, school clinics, workplace wellness stations, community outreach, and mobile screening programs.

## Main Features

### Patient and screening workflow

- Create and manage patient profiles.
- Start and track screening sessions.
- Associate measurements with the correct patient and session.
- Display active, completed, and historical screening sessions.
- View individual patient records and screening details.
- Support repeat measurements when signal quality is poor or data is incomplete.

### Physiological measurements

- Heart rate in beats per minute.
- Blood oxygen saturation (SpO₂) percentage.
- Signal-quality and valid-window tracking.
- Measurement timestamps and session associations.
- Device-status and command API endpoints for the connected station.

### AI-assisted assessment

- Generate structured screening summaries through the Groq OpenAI-compatible API.
- Use configurable Groq model through `GROQ_MODEL`.
- Current configured model: `openai/gpt-oss-120b`.
- Return one summary and three practical suggestions.
- Store generated assessment with the model name and timestamp.
- Generate optional spoken assessment audio through Groq text-to-speech.
- Include screening disclaimers and avoid diagnostic claims.

### Records and reporting

- Browse patient records.
- Open patient-specific screening history.
- Review completed session results.
- View AI assessment output alongside raw measurements.
- Send patient details through configured automation workflows.

### Mapping and regional data

- Map view for supported screening and geographic data.
- Region 12 boundary and municipality GeoJSON assets.
- API route for map data and geographic visualization.

### Integration and operations

- Make.com webhook integration for email and SMS workflows.
- Cloudflare Tunnel-compatible deployment for secure external access to a local station.
- SQLite database for the initial deployment.
- ESP32 device integration over the local network.
- Environment-based configuration for secrets and external services.

## Technology Stack

### Web application

- **Next.js 16** — React framework, routing, server-side API routes, and application runtime.
- **React 19** — User interface components.
- **TypeScript 5** — Static typing and application development.
- **Tailwind CSS 4** — Utility-first styling.
- **GSAP** — Motion and interface animation.
- **Leaflet** — Map rendering and geographic interaction.
- **MapLibre GL** — Map visualization support.
- **ESLint 9** with Next.js configuration — Code-quality checks.

### Backend and data

- **Next.js Route Handlers** — REST-style API endpoints.
- **Node.js 24 or newer** — Application runtime.
- **Node native SQLite** — Local relational data storage.
- **SQLite** — Patient, session, measurement, assessment, and workflow data.

### AI and communication

- **Groq API** — AI assessment generation and speech synthesis.
- **OpenAI-compatible Chat Completions API** — Structured JSON assessment requests.
- **Make.com** — Email, SMS, webhook, and workflow automation.
- **Cloudflare Tunnel** — Secure public routing to a locally hosted application.

### Embedded hardware

- **ESP32** — Wi-Fi-enabled screening-station controller.
- **MAX30102** — Optical heart-rate and SpO₂ sensor.
- **Arduino framework** — Embedded firmware development.
- **SparkFun MAX3010x library** — Sensor access and processing.
- **U8g2** — Embedded display support.
- **ArduinoJson** — Device JSON communication.

## Repository Structure

```text
HEMOSYNC/
├── HEMOSYNCTRY2/
│   ├── HEMOSYNCTRY2.ino       # ESP32 firmware
│   ├── secrets.example.h       # Firmware configuration template
│   └── secrets.h               # Local device secrets; not committed
├── region12-boundaries-export/ # Geographic boundary data and integration guide
├── web/                        # Next.js application
│   ├── src/app/                # Pages and API route handlers
│   ├── src/components/         # Shared React components
│   ├── src/lib/                # Database and server utilities
│   ├── public/                 # Static assets
│   ├── data/                   # Local SQLite data; ignored by Git
│   ├── package.json            # Web dependencies and scripts
│   └── .env.local              # Local secrets; ignored by Git
├── HemoSync_*.md               # Architecture, API, AI, database, deployment, and UI documentation
├── OVERVIEW.md                 # Product and workflow overview
└── README.md                   # This document
```

## Requirements

- Node.js 24 or newer.
- npm.
- Arduino IDE or compatible ESP32 build environment for firmware work.
- ESP32 board support package.
- MAX30102 sensor hardware for device testing.
- Groq API key for AI assessment and speech features.
- Optional Make.com webhook for email and SMS delivery.

## Run the Web Application

From `web/`:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The development server binds to `0.0.0.0:3000`, allowing an ESP32 on the same network to reach the application through the host machine's local address. Windows Firewall may need a private-network rule for port `3000`.

### Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment Configuration

Create `web/.env.local` locally. Never commit this file or paste real secrets into documentation.

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
MAKE_WEBHOOK_URL=your_make_webhook_url
UNISMS_SENDER_ID=your_sender_id
```

`GROQ_MODEL` is optional in code because the application falls back to `openai/gpt-oss-120b`. Set it to another Groq-supported model when model switching is needed, then restart the Next.js server.

Example:

```dotenv
GROQ_MODEL=another-supported-model
```

## Local Database

The application creates its SQLite database at:

```text
web/data/hemosync.db
```

This directory is ignored by Git. It contains sensitive patient and contact information. Back it up securely and do not upload it to public repositories.

## ESP32 Setup

1. Copy `HEMOSYNCTRY2/secrets.example.h` to `HEMOSYNCTRY2/secrets.h`.
2. Set Wi-Fi credentials and local application URL in `secrets.h`.
3. Install ESP32 board support in Arduino IDE.
4. Install the SparkFun MAX3010x, U8g2, and ArduinoJson libraries.
5. Connect the MAX30102 sensor and display hardware.
6. Flash `HEMOSYNCTRY2.ino`.
7. Start the web application before running a screening session.

`secrets.h` is ignored by Git. Keep device credentials private.

## API Areas

The web application exposes route handlers for:

- `/api/patients`
- `/api/patients/[id]`
- `/api/patients/[id]/send-details`
- `/api/screening-sessions`
- `/api/screening-sessions/[id]`
- `/api/screening-sessions/[id]/assessment`
- `/api/screening-sessions/[id]/assessment/speech`
- `/api/screening-sessions/active`
- `/api/measurements`
- `/api/ppg-windows`
- `/api/device-status`
- `/api/device-commands`
- `/api/map`

See `HemoSync_API_and_Integrations.md` for request formats, integration behavior, and workflow details.

## Deployment Notes

The initial deployment model keeps the backend on a Node-compatible host and the frontend on a web deployment platform such as Vercel. The current application uses SQLite and read-focused analytics for the initial release.

For future multi-user production deployments, migrate mutable records to PostgreSQL. Recommended future PostgreSQL data includes accounts, administrator edits, facilities, inquiries, audit logs, announcements, saved data, and other records requiring concurrent writes.

Before deployment:

- Set all secrets through the host's environment-variable settings.
- Do not deploy `.env.local`, `web/data/`, `secrets.h`, or database backups.
- Restrict API access and validate device requests.
- Configure HTTPS and trusted origins.
- Protect patient records with appropriate access controls.
- Review data-retention and consent requirements for the deployment location.
- Test Groq and Make.com failure paths.
- Back up the database securely.

See `HemoSync_Deployment_Guide.md` for deployment-specific instructions.

## Safety and Privacy

HemoSync is not a diagnostic system. A screening result can be affected by sensor placement, motion, poor perfusion, device limitations, environment, age, exercise, and clinical conditions.

Use these safeguards:

- Treat AI output as educational screening guidance.
- Repeat questionable measurements.
- Require qualified human review.
- Avoid exposing patient data in URLs, logs, screenshots, or public issue trackers.
- Rotate credentials if they are exposed.
- Use least-privilege access for integrations.
- Follow applicable privacy, consent, retention, and medical-device requirements.

## Documentation

- `OVERVIEW.md` — Product purpose, workflow, scope, and deployment context.
- `HemoSync_System_Architecture.md` — Component architecture and communication paths.
- `HemoSync_AI_Functionality.md` — AI behavior and safety requirements.
- `HemoSync_API_and_Integrations.md` — API and external integration details.
- `HemoSync_Database_Design.md` — Database entities and relationships.
- `HemoSync_Website_Features_and_UI_UX.md` — Interface and experience requirements.
- `HemoSync_Deployment_Guide.md` — Deployment and operations guidance.
- `web/README.md` — Web application setup notes.

## License

No license is currently specified. Treat repository contents as all rights reserved until project owners add a license.
