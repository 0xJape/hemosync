import db from "@/lib/db";

export const runtime = "nodejs";

type PatientUpdate = { fullName?: unknown; dateOfBirth?: unknown; sex?: unknown; email?: unknown; mobileNumber?: unknown; archived?: unknown };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = db.prepare(`SELECT id, full_name AS fullName, date_of_birth AS dateOfBirth, sex, email, mobile_number AS mobileNumber, created_at AS createdAt, updated_at AS updatedAt, archived_at AS archivedAt FROM patients WHERE id = ?`).get(id);
  if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });
  const sessions = db.prepare(`SELECT s.id, s.status, s.started_at AS startedAt, s.completed_at AS completedAt, s.cancelled_at AS cancelledAt, m.heart_rate_bpm AS heartRate, m.spo2_percent AS spo2, m.estimated_systolic_bp AS systolicBp, m.estimated_diastolic_bp AS diastolicBp, m.estimated_hemoglobin AS hemoglobin, m.signal_quality AS signalQuality FROM screening_sessions s LEFT JOIN measurements m ON m.screening_session_id = s.id WHERE s.patient_id = ? ORDER BY s.started_at DESC`).all(id);
  return Response.json({ patient, sessions });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null) as PatientUpdate | null;
  if (!body) return Response.json({ error: "Invalid patient payload." }, { status: 400 });
  const current = db.prepare(`SELECT full_name AS fullName, date_of_birth AS dateOfBirth, sex, email, mobile_number AS mobileNumber, archived_at AS archivedAt FROM patients WHERE id = ?`).get(id) as Record<string, string | null> | undefined;
  if (!current) return Response.json({ error: "Patient not found." }, { status: 404 });
  const text = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim() : fallback;
  const fullName = text(body.fullName, current.fullName!);
  const dateOfBirth = text(body.dateOfBirth, current.dateOfBirth!);
  const sex = text(body.sex, current.sex!);
  const email = text(body.email, current.email!);
  const mobileNumber = text(body.mobileNumber, current.mobileNumber!);
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const archivedAt = body.archived === true ? new Date().toISOString() : body.archived === false ? null : current.archivedAt;
  db.prepare("UPDATE patients SET full_name = ?, date_of_birth = ?, sex = ?, email = ?, mobile_number = ?, archived_at = ?, updated_at = ? WHERE id = ?").run(fullName, dateOfBirth, sex, email, mobileNumber, archivedAt, new Date().toISOString(), id);
  return Response.json({ updated: true });
}
