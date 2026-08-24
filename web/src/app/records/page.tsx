"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import MotionReveal from "@/components/motion-reveal";
import SystemLoading from "@/components/system-loading";
import SiteHeader from "@/components/site-header";

type Patient = { id: string; fullName: string; dateOfBirth: string; sex: string; email: string; mobileNumber: string; screeningCount: number; lastScreeningAt: string | null };

export default function RecordsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load(search = "") {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients?q=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error();
      setPatients((await response.json()).patients);
    } catch { setError("Could not load patient records."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    fetch("/api/patients").then(async (response) => {
      if (!response.ok) throw new Error();
      setPatients((await response.json()).patients);
    }).catch(() => setError("Could not load patient records.")).finally(() => setLoading(false));
  }, []);
  function search(event: FormEvent) { event.preventDefault(); void load(query); }

  return <main className="relative min-h-screen overflow-hidden bg-[#08090c] text-white">
    <div className="signal-glow pointer-events-none absolute inset-0"/><div className="auralis-grid pointer-events-none absolute inset-0 opacity-40"/>
    <SiteHeader />
    <MotionReveal className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      {loading && <SystemLoading label="Indexing patient records" />}<section data-reveal className="flex flex-wrap items-end justify-between gap-6"><div><p className="signal-label">Local registry · Data core</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Patient records</h1><p className="mt-3 text-sm text-white/45">Search profiles, inspect screening history, and prepare reports.</p></div><span className="hud-status rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/55"><i className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"/>{patients.length} indexed profiles</span></section>
      <form data-reveal onSubmit={search} className="future-panel mt-8 flex flex-col gap-3 p-4 sm:flex-row"><label className="future-field flex-1"><span className="sr-only">Search patients</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or mobile number"/></label><button className="future-button">Search records</button></form>
      {error && <p role="alert" className="mt-5 text-red-300">{error}</p>}
      <section data-reveal className="future-panel mt-5 overflow-hidden"><div className="hidden grid-cols-[1.5fr_1fr_.7fr_.8fr_auto] gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[.15em] text-white/35 md:grid"><span>Patient</span><span>Contact</span><span>Screenings</span><span>Last screening</span><span/></div>
        {loading ? <p className="p-8 text-white/45">Loading records…</p> : patients.length === 0 ? <p className="p-8 text-white/45">No matching patient records.</p> : patients.map((patient) => <article key={patient.id} className="grid gap-4 border-b border-white/[.07] p-6 last:border-0 md:grid-cols-[1.5fr_1fr_.7fr_.8fr_auto] md:items-center"><div><h2 className="font-semibold">{patient.fullName}</h2><p className="mt-1 text-xs text-white/35">{patient.sex} · Born {new Date(`${patient.dateOfBirth}T00:00:00`).toLocaleDateString()}</p></div><div className="min-w-0 text-sm text-white/55"><p className="truncate">{patient.email}</p><p>{patient.mobileNumber}</p></div><p className="text-sm text-white/55"><span className="md:hidden">Screenings: </span>{patient.screeningCount}</p><p className="text-sm text-white/55">{patient.lastScreeningAt ? new Date(patient.lastScreeningAt).toLocaleDateString() : "None"}</p><Link href={`/records/${patient.id}`} className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-center text-sm text-red-200 transition hover:bg-red-500/20">Open</Link></article>)}
      </section>
    </MotionReveal>
  </main>;
}
