import { randomUUID } from "node:crypto";
import db from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const required = ["fullName", "dateOfBirth", "sex", "email", "mobileNumber", "municipality", "province"];
  if (!body || required.some((key) => typeof body[key] !== "string" || !body[key].trim()) || body.consent !== "true") return Response.json({ error: "Complete all patient details and confirm consent." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(body.email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  if (db.prepare("SELECT id FROM screening_sessions WHERE status = 'active'").get()) return Response.json({ error: "Complete current screening before starting another." }, { status: 409 });

  const patientId = `pat_${randomUUID()}`;
  const sessionId = `scr_${randomUUID()}`;
  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO patients (id, full_name, date_of_birth, sex, email, mobile_number, municipality, province, consent_given_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(patientId, body.fullName.trim(), body.dateOfBirth, body.sex, body.email.trim(), body.mobileNumber.trim(), body.municipality.trim(), body.province.trim(), now, now, now);
    db.prepare("INSERT INTO screening_sessions (id, patient_id, status, started_at) VALUES (?, ?, 'active', ?)").run(sessionId, patientId, now);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return Response.json({ session: { id: sessionId, patientId, patientName: body.fullName.trim(), status: "active", startedAt: now } }, { status: 201 });
}