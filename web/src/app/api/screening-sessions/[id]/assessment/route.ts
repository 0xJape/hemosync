import { randomUUID } from "node:crypto";
import db from "@/lib/db";

export const runtime = "nodejs";

const disclaimer = "This is screening guidance, not a diagnosis. Discuss concerns with a qualified clinician.";
const assessmentModel = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = db.prepare("SELECT summary, suggestions, spoken_text AS spokenText, model, created_at AS createdAt FROM ai_assessments WHERE screening_session_id = ?").get(id);
  return Response.json({ assessment: assessment ?? null });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ error: "Groq is not configured. Set GROQ_API_KEY, then restart HemoSync." }, { status: 503 });

  const { id } = await params;
  const existing = db.prepare("SELECT summary, suggestions, spoken_text AS spokenText, model, created_at AS createdAt FROM ai_assessments WHERE screening_session_id = ?").get(id);
  if (existing) return Response.json({ assessment: existing });
  const row = db.prepare(`SELECT p.full_name AS patientName, m.heart_rate_bpm AS heartRate, m.spo2_percent AS spo2, m.estimated_systolic_bp AS systolicBp, m.estimated_diastolic_bp AS diastolicBp, m.estimated_hemoglobin AS hemoglobin, m.signal_quality AS signalQuality, m.valid_window_count AS validWindowCount, m.sample_window_count AS sampleWindowCount FROM screening_sessions s JOIN patients p ON p.id = s.patient_id JOIN measurements m ON m.screening_session_id = s.id WHERE s.id = ? AND s.status = 'completed'`).get(id) as { patientName: string; heartRate: number; spo2: number; systolicBp: number; diastolicBp: number; hemoglobin: number; signalQuality: string; validWindowCount: number; sampleWindowCount: number } | undefined;
  if (!row) return Response.json({ error: "Completed screening result not found." }, { status: 404 });

  const prompt = `You provide cautious, precise patient-facing screening interpretation. Use only supplied values. Never diagnose, name diseases, prescribe treatment, or claim an emergency. Explain every reported value: heart rate ${row.heartRate} BPM, SpO2 ${row.spo2}%, estimated blood pressure ${row.systolicBp}/${row.diastolicBp} mmHg, estimated hemoglobin ${row.hemoglobin} g/dL, and signal quality ${row.signalQuality}. Clearly call blood pressure and hemoglobin estimates, not direct clinical measurements. Compare heart rate with a commonly used adult resting screening reference of 60–100 BPM and SpO2 with a commonly used screening reference of 95% or higher. State that these references may not apply during exercise, in children, or with clinical conditions. Poor signal quality or limited valid windows must reduce confidence and recommend repeat measurement. Return JSON only with keys summary and suggestions. summary: 4–5 short sentences, name every available value, explain any value outside reference, and state clear follow-up urgency without emergency claims. suggestions: array of exactly 3 short practical next steps. End summary with: ${disclaimer}\n\nData: heart rate ${row.heartRate} BPM; SpO2 ${row.spo2}%; estimated BP ${row.systolicBp}/${row.diastolicBp} mmHg; estimated Hb ${row.hemoglobin} g/dL; signal quality ${row.signalQuality}; valid windows ${row.validWindowCount}/${row.sampleWindowCount}.`;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: assessmentModel, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }) });
    if (!response.ok) return Response.json({ error: "Groq could not assess this screening." }, { status: 502 });
    const content = (await response.json()).choices?.[0]?.message?.content;
    const generated = JSON.parse(content) as { summary?: unknown; suggestions?: unknown };
    const summary = typeof generated.summary === "string" ? generated.summary.trim().slice(0, 1200) : "";
    const suggestions = Array.isArray(generated.suggestions) ? generated.suggestions.filter((item): item is string => typeof item === "string").slice(0, 3).map((item) => item.trim().slice(0, 280)) : [];
    if (!summary || suggestions.length !== 3) throw new Error("Invalid Groq response");
    const spokenText = `Scan completed. Average heart rate ${row.heartRate} beats per minute. Blood oxygen ${row.spo2} percent. Estimated blood pressure ${row.systolicBp} over ${row.diastolicBp} millimeters of mercury. Estimated hemoglobin ${row.hemoglobin} grams per deciliter. ${summary} Suggestions: ${suggestions.join(". ")}`.slice(0, 3500);
    const assessment = { summary, suggestions: JSON.stringify(suggestions), spokenText, model: assessmentModel, createdAt: new Date().toISOString() };
    db.prepare("INSERT INTO ai_assessments (id, screening_session_id, summary, suggestions, spoken_text, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(`aia_${randomUUID()}`, id, assessment.summary, assessment.suggestions, assessment.spokenText, assessment.model, assessment.createdAt);
    return Response.json({ assessment: { ...assessment, suggestions } }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not create assessment. Try again." }, { status: 502 });
  }
}
