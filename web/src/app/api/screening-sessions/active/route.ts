import db from "@/lib/db";
export const runtime = "nodejs";
export function GET() {
  const session = db.prepare(`SELECT s.id, s.patient_id AS patientId, p.full_name AS patientName, s.status, s.started_at AS startedAt FROM screening_sessions s JOIN patients p ON p.id = s.patient_id WHERE s.status = 'active' LIMIT 1`).get();
  return Response.json({ session: session ?? null });
}