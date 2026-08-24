import db from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const deviceId = new URL(request.url).searchParams.get("deviceId")?.trim();
  if (!deviceId) return Response.json({ error: "Device ID required." }, { status: 400 });
  const command = db.prepare("SELECT id, command, session_id AS sessionId FROM device_commands WHERE device_id = ? AND acknowledged_at IS NULL ORDER BY id LIMIT 1").get(deviceId) as { id: number; command: string; sessionId: string | null } | undefined;
  if (!command) return Response.json({ command: null });
  db.prepare("UPDATE device_commands SET acknowledged_at = ? WHERE id = ?").run(new Date().toISOString(), command.id);
  return Response.json({ command });
}