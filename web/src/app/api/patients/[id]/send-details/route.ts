import db from "@/lib/db";

export const runtime = "nodejs";

type Patient = { id: string; fullName: string; dateOfBirth: string; sex: string; email: string; mobileNumber: string };
type Screening = { id: string; status: string; completedAt: string | null; heartRate: number | null; spo2: number | null; signalQuality: string | null; assessmentSummary: string | null; assessmentSuggestions: string | null };

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) return Response.json({ error: "Make webhook is not configured. Set MAKE_WEBHOOK_URL, then restart HemoSync." }, { status: 503 });

  const { id } = await params;
  const patient = db.prepare(`SELECT id, full_name AS fullName, date_of_birth AS dateOfBirth, sex, email, mobile_number AS mobileNumber FROM patients WHERE id = ?`).get(id) as Patient | undefined;
  if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });
  const history = db.prepare(`SELECT s.id, s.status, s.started_at AS startedAt, s.completed_at AS completedAt, m.heart_rate_bpm AS heartRate, m.spo2_percent AS spo2, m.signal_quality AS signalQuality, a.summary AS assessmentSummary, a.suggestions AS assessmentSuggestions FROM screening_sessions s LEFT JOIN measurements m ON m.screening_session_id = s.id LEFT JOIN ai_assessments a ON a.screening_session_id = s.id WHERE s.patient_id = ? ORDER BY s.started_at DESC`).all(id) as Screening[];
  const latest = history[0];
  const recipient = patient.mobileNumber.startsWith("0") ? `+63${patient.mobileNumber.slice(1)}` : patient.mobileNumber;
  const smsPrefix = `HemoSync: HR ${latest?.heartRate ?? "N/A"} BPM, SpO2 ${latest?.spo2 ?? "N/A"}%, signal ${latest?.signalQuality ?? "N/A"}. `;
  const smsSuffix = " Screening only; not diagnosis.";
  const assessment = latest?.assessmentSummary ?? "See emailed report for screening guidance.";
  const smsContent = `${smsPrefix}${assessment.slice(0, Math.max(0, 160 - smsPrefix.length - smsSuffix.length))}${smsSuffix}`;
  const smsRequestBody = JSON.stringify({
    recipient,
    content: smsContent,
    sender_id: process.env.UNISMS_SENDER_ID ?? "UniSMS",
    metadata: { source: "HemoSync", patient_id: patient.id, screening_session_id: latest?.id ?? "", screening_status: latest?.status ?? "unknown" }
  });

  try {
    const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient, latestScreening: latest ?? null, history, phone: recipient, smsMessage: smsContent, smsRequestBody, sentAt: new Date().toISOString(), source: "HemoSync local station" }) });
    if (!response.ok) return Response.json({ error: "Make rejected patient details." }, { status: 502 });
  } catch {
    return Response.json({ error: "Could not reach Make webhook." }, { status: 502 });
  }

  return Response.json({ sent: true });
}
