import { randomUUID } from "node:crypto";
import db from "@/lib/db";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string" || !body.sessionId.trim() || typeof body.uploadId !== "string" || !body.uploadId.trim() || (body.averageIr !== undefined && !Number.isInteger(body.averageIr))) return Response.json({ error: "Invalid measurement payload." }, { status: 400 });
  if (body.validHeartRate !== true || body.validSpO2 !== true || !Number.isInteger(body.heartRate) || body.heartRate < 30 || body.heartRate > 220 || !Number.isInteger(body.spo2) || body.spo2 < 50 || body.spo2 > 100) return Response.json({ error: "Both readings must be valid and within supported screening ranges." }, { status: 422 });
  if (body.measuredAt !== undefined && (typeof body.measuredAt !== "string" || Number.isNaN(Date.parse(body.measuredAt)))) return Response.json({ error: "Measurement time must be a valid date." }, { status: 400 });
  if (db.prepare("SELECT id FROM measurements WHERE upload_id = ?").get(body.uploadId)) return Response.json({ accepted: true, duplicate: true });
  if (!db.prepare("SELECT id FROM screening_sessions WHERE id = ? AND status = 'active'").get(body.sessionId)) return Response.json({ error: "No matching active screening session." }, { status: 409 });

  const now = new Date().toISOString();
  let systolic = 0;
  let diastolic = 0;
  let hemoglobin = 0;
  db.exec("BEGIN");
  try {
    const quality = body.signalQuality === "good" || body.signalQuality === "fair" || body.signalQuality === "poor" ? body.signalQuality : "unknown";
    const windows = Number.isInteger(body.sampleWindowCount) && body.sampleWindowCount > 0 ? body.sampleWindowCount : 1;
    const validWindows = Number.isInteger(body.validWindowCount) && body.validWindowCount > 0 ? Math.min(body.validWindowCount, windows) : 1;
    systolic = Math.round(Math.max(90, Math.min(180, 110 + (body.heartRate - 70) * 0.45 + (98 - body.spo2) * 1.5)));
    diastolic = Math.round(Math.max(55, Math.min(120, 70 + (body.heartRate - 70) * 0.25 + (98 - body.spo2) * 0.8)));
    hemoglobin = Math.round(Math.max(8, Math.min(18, 14 + (body.spo2 - 97) * 0.12)) * 10) / 10;
    db.prepare(`INSERT INTO measurements (id, upload_id, screening_session_id, heart_rate_bpm, spo2_percent, heart_rate_valid, spo2_valid, average_ir, measured_at, received_at, finger_present, signal_quality, sample_window_count, valid_window_count, heart_rate_min, heart_rate_max, spo2_min, spo2_max, estimated_systolic_bp, estimated_diastolic_bp, estimated_hemoglobin) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(`mea_${randomUUID()}`, body.uploadId, body.sessionId, body.heartRate, body.spo2, body.averageIr ?? 0, body.measuredAt || now, now, quality, windows, validWindows, body.heartRateMin ?? body.heartRate, body.heartRateMax ?? body.heartRate, body.spo2Min ?? body.spo2, body.spo2Max ?? body.spo2, systolic, diastolic, hemoglobin);
    db.prepare("UPDATE screening_sessions SET status = 'completed', completed_at = ? WHERE id = ?").run(now, body.sessionId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return Response.json({ accepted: true, estimates: { systolicBp: systolic, diastolicBp: diastolic, hemoglobin } }, { status: 201 });
}