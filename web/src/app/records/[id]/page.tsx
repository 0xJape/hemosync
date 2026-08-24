"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SystemLoading from "@/components/system-loading";
import SiteHeader from "@/components/site-header";

type Patient = { id: string; fullName: string; dateOfBirth: string; sex: string; email: string; mobileNumber: string; archivedAt: string | null };
type Session = { id: string; status: string; startedAt: string; completedAt: string | null; heartRate: number | null; spo2: number | null; signalQuality: string | null };

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  async function load() { const response = await fetch(`/api/patients/${id}`); if (!response.ok) { setError("Patient record not found."); return; } const data = await response.json(); setPatient(data.patient); setSessions(data.sessions); }
  useEffect(() => {
    fetch(`/api/patients/${id}`).then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setPatient(data.patient);
      setSessions(data.sessions);
    }).catch(() => setError("Patient record not found."));
  }, [id]);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const response = await fetch(`/api/patients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); const data = await response.json(); if (!response.ok) setError(data.error); else { setEditing(false); void load(); } }
  async function archive() { if (!patient || !confirm(`${patient.archivedAt ? "Restore" : "Archive"} this patient record?`)) return; await fetch(`/api/patients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !patient.archivedAt }) }); void load(); }
  async function sendDetails() { setSending(true); setSent(false); setError(""); try { const response = await fetch(`/api/patients/${id}/send-details`, { method: "POST" }); const data = await response.json(); if (!response.ok) setError(data.error ?? "Could not send details."); else setSent(true); } catch { setError("Could not send details."); } finally { setSending(false); } }
  function exportCsv() { if (!patient) return; const esc = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`; const rows = [["Session ID","Status","Started","Completed","Heart rate (BPM)","SpO2 (%)","Signal quality"], ...sessions.map((s) => [s.id,s.status,s.startedAt,s.completedAt,s.heartRate,s.spo2,s.signalQuality])]; const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${patient.fullName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-screenings.csv`; link.click(); URL.revokeObjectURL(link.href); }
  if (!patient) return <main className="min-h-screen bg-[#08090c] text-white">{error ? <p className="grid min-h-screen place-items-center text-red-300">{error}</p> : <SystemLoading label="Decrypting patient profile" />}</main>;
  return <main className="relative min-h-screen bg-[#08090c] text-white"><div className="signal-glow pointer-events-none fixed inset-0"/><SiteHeader /><div className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-8 print:max-w-none print:p-0">
    <nav className="flex flex-wrap items-center justify-between gap-4 print:hidden"><Link href="/records" className="text-sm text-white/55">← Patient records</Link><div className="flex flex-wrap gap-2"><button onClick={sendDetails} disabled={sending} className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 disabled:opacity-50">{sending ? "Sending…" : sent ? "Details sent ✓" : "Send details"}</button><button onClick={exportCsv} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Export CSV</button><button onClick={() => window.print()} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Print / Save PDF</button><button onClick={archive} className="rounded-xl border border-red-400/25 px-4 py-2 text-sm text-red-200">{patient.archivedAt ? "Restore" : "Archive"}</button></div></nav>
    <header className="mt-8 border-b border-white/10 pb-7 print:mt-0"><p className="signal-label">Patient profile</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-semibold tracking-[-.04em]">{patient.fullName}</h1><p className="mt-2 break-all text-xs text-white/35">{patient.id}{patient.archivedAt ? " · Archived" : ""}</p></div><button onClick={() => setEditing(!editing)} className="future-button print:hidden">{editing ? "Close editor" : "Edit profile"}</button></div></header>
    {error && <p role="alert" className="mt-5 text-red-300 print:hidden">{error}</p>}
    {editing && <form onSubmit={save} className="future-panel mt-6 grid gap-5 p-6 sm:grid-cols-2 print:hidden"><Field name="fullName" label="Full name" value={patient.fullName}/><Field name="dateOfBirth" label="Date of birth" value={patient.dateOfBirth} type="date"/><Field name="sex" label="Sex" value={patient.sex}/><Field name="mobileNumber" label="Mobile number" value={patient.mobileNumber}/><Field name="email" label="Email" value={patient.email}/><button className="future-button self-end">Save changes</button></form>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Date of birth" value={new Date(`${patient.dateOfBirth}T00:00:00`).toLocaleDateString()}/><Stat label="Sex" value={patient.sex}/><Stat label="Mobile" value={patient.mobileNumber}/><Stat label="Email" value={patient.email}/></section>
    <section className="future-panel mt-6 overflow-hidden print:border-gray-300 print:bg-white print:text-black print:shadow-none"><div className="border-b border-white/10 px-6 py-5 print:border-gray-300"><p className="signal-label print:text-red-700">Screening history</p><h2 className="mt-2 text-2xl font-semibold">{sessions.length} recorded sessions</h2></div>{sessions.length === 0 ? <p className="p-6 text-white/45">No screening history.</p> : sessions.map((session) => <Link key={session.id} href={`/sessions/${session.id}`} className="grid gap-3 border-b border-white/[.07] p-6 last:border-0 hover:bg-white/[.03] sm:grid-cols-[1fr_.7fr_.7fr_auto] sm:items-center print:border-gray-200 print:text-black"><div><p className="font-medium">{new Date(session.startedAt).toLocaleString()}</p><p className="mt-1 text-xs text-white/35 print:text-gray-500">{session.id}</p></div><p className="capitalize text-sm">{session.status}</p><p className="text-sm">{session.heartRate ?? "—"} BPM · {session.spo2 ?? "—"}%</p><span className="text-sm text-red-300 print:hidden">View report →</span></Link>)}</section>
  </div></main>;
}
function Field({ name, label, value, type = "text" }: { name: string; label: string; value: string; type?: string }) { return <label className="future-field">{label}<input name={name} type={type} defaultValue={value} required/></label>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="future-panel min-w-0 p-5 print:border-gray-300 print:bg-white print:text-black"><p className="text-xs uppercase tracking-[.15em] text-white/35 print:text-gray-500">{label}</p><p className="mt-2 break-words text-sm">{value}</p></div>; }
