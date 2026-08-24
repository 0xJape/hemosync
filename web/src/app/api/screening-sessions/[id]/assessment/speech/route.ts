import db from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ error: "Groq is not configured." }, { status: 503 });
  const { id } = await params;
  const assessment = db.prepare("SELECT spoken_text AS spokenText FROM ai_assessments WHERE screening_session_id = ?").get(id) as { spokenText: string } | undefined;
  if (!assessment) return Response.json({ error: "Create assessment before audio." }, { status: 409 });
  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "canopylabs/orpheus-v1-english", voice: "daniel", response_format: "wav", input: assessment.spokenText }) });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Groq TTS failed", response.status, detail.slice(0, 500));
      return Response.json({ error: `Groq could not create audio (HTTP ${response.status}).` }, { status: 502 });
    }
    return new Response(response.body, { headers: { "Content-Type": response.headers.get("Content-Type") ?? "audio/wav", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not create audio." }, { status: 502 });
  }
}
