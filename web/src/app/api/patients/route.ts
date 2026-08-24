import db from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const includeArchived = searchParams.get("archived") === "true";
  const like = `%${query}%`;
  const patients = db.prepare(`
    SELECT p.id, p.full_name AS fullName, p.date_of_birth AS dateOfBirth, p.sex, p.email,
      p.mobile_number AS mobileNumber, p.created_at AS createdAt, p.updated_at AS updatedAt,
      p.archived_at AS archivedAt, COUNT(s.id) AS screeningCount, MAX(s.started_at) AS lastScreeningAt
    FROM patients p LEFT JOIN screening_sessions s ON s.patient_id = p.id
    WHERE (? = 1 OR p.archived_at IS NULL)
      AND (? = '' OR p.full_name LIKE ? OR p.email LIKE ? OR p.mobile_number LIKE ?)
    GROUP BY p.id ORDER BY COALESCE(MAX(s.started_at), p.created_at) DESC LIMIT 100
  `).all(includeArchived ? 1 : 0, query, like, like, like);
  return Response.json({ patients });
}
