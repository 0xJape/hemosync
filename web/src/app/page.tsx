"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { useRouter } from "next/navigation";
import Auralis from "@/components/auralis";
import MotionReveal from "@/components/motion-reveal";
import SystemLoading from "@/components/system-loading";

type Session = { id: string; patientId: string; patientName: string; status: string; startedAt: string };
type Measurement = { heartRate: number; spo2: number; measuredAt: string; signalQuality?: string; validWindowCount?: number; sampleWindowCount?: number };
type Device = { connected: boolean; state: string; fingerPresent: boolean; signalQuality: string; lastSeenAt: string; heartRate?: number; spo2?: number };

const region12Locations = [
  ["Cotabato", ["Alamada", "Aleosan", "Antipas", "Arakan", "Banisilan", "Carmen", "Kabacan", "City of Kidapawan", "Libungan", "M'Lang", "Magpet", "Makilala", "Matalam", "Midsayap", "Pigkawayan", "Pikit", "President Roxas", "Tulunan"]],
  ["South Cotabato", ["Banga", "City of Koronadal", "Lake Sebu", "Norala", "Polomolok", "Santo Niño", "Surallah", "T'Boli", "Tampakan", "Tantangan", "Tupi"]],
  ["Sultan Kudarat", ["Bagumbayan", "Columbio", "Esperanza", "Isulan", "Kalamansig", "Lambayong", "Lebak", "Lutayan", "Palimbang", "President Quirino", "Sen. Ninoy Aquino", "City of Tacurong"]],
  ["Sarangani", ["Alabel", "Glan", "Kiamba", "Maasim", "Maitum", "Malapatan", "Malungon"]],
  ["General Santos City", ["General Santos City"]]
] as const;

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [device, setDevice] = useState<Device | null>(null);
  const [commandPending, setCommandPending] = useState<"start" | "stop" | null>(null);
  const [processingSeconds, setProcessingSeconds] = useState<number | null>(null);
  const [captureSeconds, setCaptureSeconds] = useState<number | null>(null);
  const [fingerHoldSeconds, setFingerHoldSeconds] = useState<number | null>(null);
  const sessionId = session?.id;

  useEffect(() => {
    fetch("/api/screening-sessions/active")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setSession(data?.session ?? null))
      .catch(() => setError("Could not restore active screening session."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!sessionId || session?.status === "completed") return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/screening-sessions/${sessionId}`);
        if (!response.ok) return;
        const data = await response.json();
        setSession(data.session);
        if (data.measurement) setMeasurement(data.measurement);
      } catch { setError("Could not refresh screening results."); }
    }, 500);
    return () => clearInterval(timer);
  }, [sessionId, session?.status]);

  useEffect(() => {
    if (!onboarded) return;
    const refresh = async () => {
      try {
        const response = await fetch("/api/device-status");
        if (!response.ok) return;
        const data = await response.json();
        setDevice(data.device ?? null);
      } catch { setDevice(null); }
    };
    void refresh();
    const timer = setInterval(refresh, 500);
    return () => clearInterval(timer);
  }, [onboarded]);

  useEffect(() => {
    if (device?.state !== "processing") return;
    const resetTimer = window.setTimeout(() => setProcessingSeconds(10), 0);
    const timer = window.setInterval(() => setProcessingSeconds((seconds) => seconds === null || seconds <= 1 ? 0 : seconds - 1), 1000);
    return () => { window.clearTimeout(resetTimer); window.clearInterval(timer); };
  }, [device?.state]);

  useEffect(() => {
    if (captureSeconds === null || captureSeconds <= 0) return;
    const timer = window.setTimeout(() => setCaptureSeconds((seconds) => seconds === null || seconds <= 1 ? null : seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [captureSeconds]);

  useEffect(() => {
    if (device?.state !== "measuring") return;
    const resetTimer = window.setTimeout(() => setFingerHoldSeconds(30), 0);
    const timer = window.setInterval(() => setFingerHoldSeconds((seconds) => seconds === null || seconds <= 1 ? 0 : seconds - 1), 1000);
    return () => { window.clearTimeout(resetTimer); window.clearInterval(timer); };
  }, [device?.state]);

  useEffect(() => {
    if (session?.status !== "completed") return;
    const timer = window.setTimeout(() => router.push(`/records/${session.patientId}`), 10000);
    return () => window.clearTimeout(timer);
  }, [router, session?.patientId, session?.status]);

  async function startScreening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/screening-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error ?? "Could not start screening.");
      else { setSession(data.session); setMeasurement(null); }
    } catch { setError("Could not connect to local screening service."); }
    finally { setSubmitting(false); }
  }

  function newScreening() {
    setSession(null);
    setMeasurement(null);
    setError("");
  }

  async function stopScreening() {
    if (!sessionId || !confirm("Stop and cancel this screening? No final result will be stored.")) return;
    const response = await fetch(`/api/screening-sessions/${sessionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    if (!response.ok) { setError("Could not stop screening."); return; }
    newScreening();
  }

  async function commandDevice(command: "start" | "stop") {
    setCommandPending(command);
    setError("");
    if (command === "start") setCaptureSeconds(10);
    try {
      const response = await fetch("/api/device-status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "hemosync-esp32-01", command, sessionId }) });
      if (!response.ok) setError(`Could not send ${command} command.`);
    } catch { setError(`Could not send ${command} command.`); }
    finally { window.setTimeout(() => setCommandPending(null), 2200); }
  }

  if (loading) return <main className="min-h-screen bg-[#08090c] text-white"><SystemLoading label="Initializing screening station" /></main>;

  if (!onboarded) return (
    <main className="relative min-h-screen overflow-hidden bg-[#080104] text-white">
      <Auralis />
      <div className="auralis-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">
        <nav className="flex items-center justify-between border-b border-white/10 py-5" aria-label="HemoSync">
          <div className="flex items-center gap-3"><img src="/hemosync.png" alt="HemoSync" className="h-10 w-10 rounded-xl object-contain" /><div><strong className="tracking-[.16em]">HEMOSYNC</strong><p className="text-[10px] uppercase tracking-[.25em] text-white/45">Screening intelligence</p></div></div>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65"><i className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /> Local system ready</span>
        </nav>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
          <div>
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.3em] text-red-300"><span className="h-px w-10 bg-red-400" /> Next-generation screening</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl lg:text-[5.6rem]">Vitals synchronized.<br/><span className="auralis-text">Care accelerated.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">Local heart-rate and blood-oxygen screening built for fast, private patient intake. Data stays on this station.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button onClick={() => setOnboarded(true)} className="group min-h-14 rounded-2xl bg-white px-7 font-semibold text-[#160308] shadow-[0_12px_50px_rgba(255,255,255,.12)] transition hover:-translate-y-0.5 hover:bg-red-50">Begin screening <span className="ml-3 inline-block transition group-hover:translate-x-1">→</span></button>
              <span className="text-sm text-white/45">No login required · Single-station mode</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-12 rounded-full bg-red-600/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[.25em] text-white/45">Station overview</p><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Operational</span></div>
              <div className="mt-8 grid grid-cols-2 gap-3"><VitalPreview value="—" unit="BPM" label="Heart rate" pulse /><VitalPreview value="—" unit="%" label="Blood oxygen" /></div>
              <div className="mt-6 border-t border-white/10 pt-6">
                {["Register patient details", "Capture screening values", "Store result locally"].map((step, index) => <div key={step} className="flex items-center gap-4 py-2.5"><span className="grid h-7 w-7 place-items-center rounded-full border border-red-400/30 bg-red-500/10 text-xs text-red-300">0{index + 1}</span><span className="text-sm text-white/70">{step}</span>{index === 2 && <span className="ml-auto text-emerald-400">✓</span>}</div>)}
              </div>
              <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-white/45">ESP32 sensor required. Live readings appear only after verified sensor capture.</p>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-white/10 py-5 text-xs text-white/35"><span>HemoSync · Local clinical screening</span><span>Private by design · Offline-first</span></footer>
      </div>
    </main>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090c] text-white">
      <div className="signal-glow pointer-events-none absolute inset-0" />
      <div className="auralis-grid pointer-events-none absolute inset-0 opacity-40" />
      <SiteHeader />

      <div id="screening"><MotionReveal className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {(submitting || captureSeconds !== null || device?.state === "measuring" || device?.state === "processing" || device?.state === "uploading") && <SystemLoading label={captureSeconds !== null ? "Starting sensor capture · keep finger ready" : device?.state === "measuring" ? fingerHoldSeconds === 0 ? "Completing capture · keep finger still" : "Keep finger flat on sensor · estimated hold time" : device?.state === "processing" ? `Processing verified signal · ${processingSeconds ?? 10}s remaining` : device?.state === "uploading" ? "Saving verified result" : "Creating patient session"} countdown={captureSeconds ?? (device?.state === "measuring" ? fingerHoldSeconds ?? 30 : device?.state === "processing" ? processingSeconds ?? 10 : undefined)} />}{error && <div role="alert" data-reveal className="mb-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100 backdrop-blur-xl">⚠ {error}</div>}
        {!session ? (
          <div className="grid gap-8 xl:grid-cols-[.8fr_1.2fr] xl:gap-14">
            <section data-reveal className="flex flex-col justify-between py-3 xl:min-h-[650px]">
              <div><p className="signal-label">Patient intake · 01</p><h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-5xl lg:text-6xl">Initialize a new <span className="auralis-text">screening profile.</span></h1><p className="mt-6 max-w-lg leading-7 text-white/50">Register patient identity and contact details before physiological data capture. Required fields protect record accuracy.</p></div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3 xl:grid-cols-1"><ProcessStep number="01" label="Patient details" active /><ProcessStep number="02" label="Vitals capture" /><ProcessStep number="03" label="Local storage" /></div>
            </section>

            <form data-reveal onSubmit={startScreening} className="future-panel p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6"><div><p className="signal-label">Secure record</p><h2 className="mt-2 text-2xl font-semibold">Patient information</h2></div><span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">Required before test</span></div>
              <div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Full name" name="fullName" placeholder="Patient full name" required /><Field label="Date of birth" name="dateOfBirth" type="date" required /><label className="future-field">Sex<select name="sex" required><option value="">Select sex</option><option>Female</option><option>Male</option><option>Other</option></select></label><Field label="Mobile number" name="mobileNumber" type="tel" placeholder="Contact number" required /><Field label="Email address" name="email" type="email" placeholder="patient@example.com" required wide /><label className="future-field sm:col-span-2">Region XII municipality/city<select name="municipality" required><option value="">Select location</option>{region12Locations.map(([province, locations]) => <optgroup key={province} label={province}>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</optgroup>)}</select><input name="province" type="hidden" value="Region XII" /></label></div>
              <label className="mt-7 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60"><input name="consent" value="true" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-red-600" /> Patient consents to local storage of screening details and delivery of results.</label>
              <button disabled={submitting} className="future-button mt-7 w-full">{submitting ? "Initializing session…" : "Continue to vitals capture"}<span>→</span></button>
            </form>
          </div>
        ) : (
          <div className={session.status === "completed" ? "" : "capture-active"}>
            <section data-reveal className="flex flex-wrap items-end justify-between gap-5"><div><p className="signal-label">Live screening · Session 01</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{session.patientName}</h1><p className="mt-2 max-w-2xl break-all text-xs text-white/35">ID {session.id} · Started {new Date(session.startedAt).toLocaleString()}</p></div><span aria-live="polite" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${session.status === "completed" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-amber-400/25 bg-amber-400/10 text-amber-200"}`}><i className={`h-2 w-2 rounded-full ${session.status === "completed" ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`} />{session.status === "completed" ? "Screening completed" : "Awaiting measurement"}</span></section>

            <section className="mt-8 grid gap-5 lg:grid-cols-2"><MeasurementCard label="Heart rate" value={measurement?.heartRate ?? device?.heartRate} unit="BPM" icon="♥" live={!measurement && device?.state === "measuring"} /><MeasurementCard label="Blood oxygen" value={measurement?.spo2 ?? device?.spo2} unit="%" icon="O₂" live={!measurement && device?.state === "measuring"} /></section>

            {session.status !== "completed" && <CaptureConsole device={device} commandPending={commandPending} onCommand={commandDevice} onCancel={stopScreening} />}

            {session.status === "completed" ? <section data-reveal className="future-panel mt-5 flex flex-col justify-between gap-6 border-emerald-400/20 p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="signal-label text-emerald-300">✓ Data synchronized</p><h2 className="mt-2 text-2xl font-semibold">Screening stored locally</h2><p className="mt-2 text-sm text-white/45">Measured {measurement ? new Date(measurement.measuredAt).toLocaleString() : "successfully"}. {measurement?.signalQuality && `Quality: ${measurement.signalQuality}. `}{measurement?.validWindowCount && `${measurement.validWindowCount}/${measurement.sampleWindowCount} valid windows.`}</p></div><div className="flex flex-wrap gap-3"><Link href={`/sessions/${session.id}`} className="rounded-xl border border-white/10 px-5 py-3 text-sm">View report</Link><button onClick={newScreening} className="future-button shrink-0">Start new screening <span>→</span></button></div></section> : <section data-reveal className="future-panel mt-5 p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="signal-label">Hardware acquisition</p><h2 className="mt-2 text-2xl font-semibold">{device?.connected ? device.state.replaceAll("_", " ") : "ESP32 sensor offline"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">{device?.connected ? `Finger ${device.fingerPresent ? "detected" : "not detected"} · Signal quality ${device.signalQuality}. Live telemetry refreshes every 500 ms.` : "Connect HemoSync ESP32 before starting capture. No manual clinical readings are accepted."}</p></div><span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/45">Sensor link: {device?.connected ? "Connected" : "Offline"}</span></div><div className="mt-7 flex flex-wrap gap-3"><button disabled={!device?.connected} type="button" onClick={() => commandDevice("start")} className="future-button sm:w-auto">Start sensor capture <span>→</span></button><button disabled={!device?.connected} type="button" onClick={() => commandDevice("stop")} className="rounded-xl border border-red-400/25 px-5 py-3 text-sm text-red-200 disabled:cursor-not-allowed disabled:opacity-40">Stop sensor</button><button type="button" onClick={stopScreening} className="rounded-xl border border-red-400/25 px-5 py-3 text-sm text-red-200">Cancel session</button></div></section>}
          </div>
        )}
      </MotionReveal></div>
    </main>
  );
}

function Field({ label, name, type = "text", required = false, wide = false, min, max, placeholder }: { label: string; name: string; type?: string; required?: boolean; wide?: boolean; min?: string; max?: string; placeholder?: string }) {
  return <label className={`future-field ${wide ? "sm:col-span-2" : ""}`}>{label}<input name={name} type={type} required={required} min={min} max={max} placeholder={placeholder} /></label>;
}

function MeasurementCard({ label, value, unit, icon, live = false }: { label: string; value?: number; unit: string; icon: string; live?: boolean }) {
  return <article data-reveal className="hud-status future-panel relative overflow-hidden p-6 sm:p-8"><div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-red-500/10 blur-3xl"/><div className="flex items-center justify-between"><p className="signal-label">{label}</p><span className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/20 bg-red-500/10 text-sm text-red-300">{icon}</span></div><p className="mt-8 text-5xl font-semibold tracking-[-.06em] sm:text-6xl">{value ?? "—"}<span className="ml-3 text-lg font-medium tracking-normal text-white/30">{unit}</span></p><div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-sm"><span className="text-white/40">{live ? "Live sensor telemetry · 500 ms" : value ? "Verified result" : "Waiting for sensor"}</span><span className={value ? "text-emerald-300" : "text-amber-200"}>{live ? "● Live" : value ? "● Stable" : "○ Pending"}</span></div></article>;
}

function CaptureConsole({ device, commandPending, onCommand, onCancel }: { device: Device | null; commandPending: "start" | "stop" | null; onCommand: (command: "start" | "stop") => void; onCancel: () => void }) {
  const state = commandPending ? "queued" : device?.state ?? "offline";
  const copy = state === "queued" ? { step: "Command transmitted", title: `${commandPending === "start" ? "Starting" : "Stopping"} sensor capture…`, detail: "ESP32 receives queued commands within two seconds." } : state === "measuring" ? { step: "Step 2 · Capture active", title: "Keep finger still on sensor", detail: "Reading pulse and blood oxygen. Live cards update every 500 ms." } : state === "waiting_for_finger" ? { step: "Step 1 · Finger required", title: "Place finger over sensor", detail: "Cover sensor fully. Capture starts after stable signal is detected." } : state === "processing" || state === "uploading" ? { step: "Verification running", title: "Do not remove finger", detail: "HemoSync is validating and storing three signal windows." } : { step: "Step 1 · Ready", title: "Start sensor capture", detail: device?.connected ? "Press start, then place finger flat over sensor when prompted." : "Reconnect HemoSync ESP32 to enable capture." };
  const disabled = !device?.connected || commandPending !== null || state === "processing" || state === "uploading";
  return <section className="capture-console mt-5" aria-live="polite"><div className="capture-console__status"><span className={`capture-console__dot ${device?.connected ? "capture-console__dot--online" : ""}`} /><span>{device?.connected ? "ESP32 connected" : "ESP32 offline"}</span><span className="capture-console__divider" /> <span>{state.replaceAll("_", " ")}</span></div><div className="capture-console__body"><div><p className="signal-label">{copy.step}</p><h2>{copy.title}</h2><p>{copy.detail}</p></div><div className="capture-console__actions"><button disabled={disabled} type="button" onClick={() => onCommand("start")} className="future-button">{commandPending === "start" ? "Starting…" : "Start capture"}<span>→</span></button><button disabled={!device?.connected || commandPending !== null} type="button" onClick={() => onCommand("stop")} className="capture-console__stop">{commandPending === "stop" ? "Stopping…" : "Stop"}</button><button disabled={commandPending !== null} type="button" onClick={onCancel} className="capture-console__cancel">Cancel session</button></div></div></section>;
}

function ProcessStep({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
  return <div className={`flex items-center gap-4 rounded-2xl border p-4 ${active ? "border-red-400/25 bg-red-500/10" : "border-white/10 bg-white/[.03]"}`}><span className={active ? "text-red-300" : "text-white/25"}>{number}</span><span className={active ? "text-white" : "text-white/40"}>{label}</span>{active && <span className="ml-auto h-2 w-2 rounded-full bg-red-400 shadow-[0_0_10px_#ef4444]" />}</div>;
}

function VitalPreview({ value, unit, label, pulse = false }: { value: string; unit: string; label: string; pulse?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex items-center gap-2 text-xs text-white/45">{pulse && <span className="text-red-400">♥</span>}{label}</div><p className="mt-3 text-4xl font-semibold tracking-tight">{value}<span className="ml-1 text-sm font-normal text-white/40">{unit}</span></p></div>;
}
