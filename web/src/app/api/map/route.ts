import db from "@/lib/db";

export const runtime = "nodejs";

type Row = { municipality: string; screenings: number; patients: number };

export async function GET() {
  const rows = db.prepare(`
    SELECT p.municipality, COUNT(m.id) AS screenings, COUNT(DISTINCT p.id) AS patients
    FROM patients p
    JOIN screening_sessions s ON s.patient_id = p.id AND s.status = 'completed'
    JOIN measurements m ON m.screening_session_id = s.id
    WHERE p.municipality IS NOT NULL
    GROUP BY p.municipality ORDER BY screenings DESC
  `).all() as Row[];
  return Response.json({ municipalities: rows });
}