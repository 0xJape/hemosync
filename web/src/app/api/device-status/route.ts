import db from "@/lib/db";

export const runtime = "nodejs";

const states = new Set(["idle", "ready", "waiting_for_finger", "measuring", "processing", "uploading", "completed", "stopped", "sensor_error", "upload_failed"]);

export async function GET() {
  const status = db.prepare(`SELECT device_id AS deviceId, state, finger_present AS fingerPresent, average_ir AS averageIr, heart_rate_bpm AS heartRate, spo2_percent AS spo2, signal_quality AS signalQuality, active_session_id AS activeSessionId, firmware_version AS firmwareVersion, last_seen_at AS lastSeenAt, error_code AS errorCode FROM device_status ORDER BY last_seen_at DESC LIMIT 1`).get() as Record<string, unknown> | undefined;
  if (!status) return Response.json({ device: null });
  const age = Date.now() - Date.parse(status.lastSeenAt as string);
  return Response.json({ device: { ...status, fingerPresent: status.fingerPresent === 1, connected: age < 15000 } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.deviceId !== "string" || !body.deviceId.trim() || !states.has(body.state) || typeof body.fingerPresent !== "boolean") return Response.json({ error: "Invalid device status payload." }, { status: 400 });
  const quality = ["unknown", "poor", "fair", "good"].includes(body.signalQuality) ? body.signalQuality : "unknown";
  db.prepare(`INSERT INTO device_status (device_id, state, finger_present, average_ir, heart_rate_bpm, spo2_percent, signal_quality, active_session_id, firmware_version, last_seen_at, error_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(device_id) DO UPDATE SET state=excluded.state, finger_present=excluded.finger_present, average_ir=excluded.average_ir, heart_rate_bpm=excluded.heart_rate_bpm, spo2_percent=excluded.spo2_percent, signal_quality=excluded.signal_quality, active_session_id=excluded.active_session_id, firmware_version=excluded.firmware_version, last_seen_at=excluded.last_seen_at, error_code=excluded.error_code`).run(body.deviceId.trim(), body.state, body.fingerPresent ? 1 : 0, Number.isInteger(body.averageIr) ? body.averageIr : null, Number.isInteger(body.heartRate) ? body.heartRate : null, Number.isInteger(body.spo2) ? body.spo2 : null, quality, typeof body.sessionId === "string" ? body.sessionId : null, typeof body.firmwareVersion === "string" ? body.firmwareVersion : null, new Date().toISOString(), typeof body.errorCode === "string" ? body.errorCode : null);
  return Response.json({ accepted: true });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.deviceId !== "string" || !["start", "stop"].includes(body.command)) return Response.json({ error: "Invalid device command." }, { status: 400 });
  if (body.command === "start" && (typeof body.sessionId !== "string" || !body.sessionId.trim())) return Response.json({ error: "Start command requires a session." }, { status: 400 });
  db.prepare("INSERT INTO device_commands (device_id, command, session_id, created_at) VALUES (?, ?, ?, ?)").run(body.deviceId, body.command, body.sessionId ?? null, new Date().toISOString());
  return Response.json({ queued: true }, { status: 202 });
}
