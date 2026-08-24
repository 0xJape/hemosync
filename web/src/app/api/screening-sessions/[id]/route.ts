import db from "@/lib/db";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = db.prepare(`SELECT s.id, s.patient_id AS patientId, p.full_name AS patientName, s.status, s.started_at AS startedAt, s.completed_at AS completedAt, s.cancelled_at AS cancelledAt FROM screening_sessions s JOIN patients p ON p.id = s.patient_id WHERE s.id = ?`).get(id);
  if (!session) return Response.json({ error: "Session not found." }, { status: 404 });
  const measurement = db.prepare(`SELECT heart_rate_bpm AS heartRate, spo2_percent AS spo2, measured_at AS measuredAt, average_ir AS averageIr, signal_quality AS signalQuality, sample_window_count AS sampleWindowCount, valid_window_count AS validWindowCount, heart_rate_min AS heartRateMin, heart_rate_max AS heartRateMax, spo2_min AS spo2Min, spo2_max AS spo2Max FROM measurements WHERE screening_session_id = ?`).get(id);
  const assessment = db.prepare("SELECT summary, suggestions, spoken_text AS spokenText, model, created_at AS createdAt FROM ai_assessments WHERE screening_session_id = ?").get(id) as { summary: string; suggestions: string; spokenText: string; model: string; createdAt: string } | undefined;
  return Response.json({ session, measurement: measurement ?? null, assessment: assessment ? { ...assessment, suggestions: JSON.parse(assessment.suggestions) } : null });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.action !== "cancel") return Response.json({ error: "Unsupported session action." }, { status: 400 });
  const now = new Date().toISOString();
  const result = db.prepare("UPDATE screening_sessions SET status = 'cancelled', cancelled_at = ?, cancel_reason = ? WHERE id = ? AND status = 'active'").run(now, typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "Stopped by operator", id);
  if (!result.changes) return Response.json({ error: "Active session not found." }, { status: 409 });
  return Response.json({ cancelled: true });
}