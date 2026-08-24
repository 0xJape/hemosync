"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/site-header";

type Stats = { municipality: string; screenings: number; patients: number };
type Boundary = GeoJSON.Feature<GeoJSON.Geometry, { adm3_en: string; screenings?: number; patients?: number }>;

const boundaryUrls = [
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/provdists/lowres/municities-provdist-1204700000.0.001.json",
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/provdists/lowres/municities-provdist-1206300000.0.001.json",
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/provdists/lowres/municities-provdist-1206500000.0.001.json",
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/provdists/lowres/municities-provdist-1208000000.0.001.json"
];

export default function MapPage() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState<Stats | null>(null);
  const [total, setTotal] = useState({ patients: 0, screenings: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!container.current || map.current) return;
    import("leaflet").then((leaflet) => {
      const instance = leaflet.map(container.current!).setView([6.7, 124.7], 7);
      map.current = instance;
      leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap © CARTO" }).addTo(instance);
      Promise.all([fetch("/api/map").then((response) => response.json()), ...boundaryUrls.map((url) => fetch(url).then((response) => { if (!response.ok) throw new Error(`Boundary request failed: ${response.status}`); return response.json(); }))]).then(([data, ...boundaries]) => {
        const stats = data.municipalities as Stats[];
        const byName = new Map(stats.map((item) => [item.municipality, item]));
        const features = boundaries.flatMap((collection) => collection.features).filter((feature) => feature.geometry).map((feature: Boundary) => ({ ...feature, properties: { ...feature.properties, ...(byName.get(feature.properties.adm3_en) ?? { screenings: 0, patients: 0 }) } }));
        setTotal({ patients: stats.reduce((sum, item) => sum + item.patients, 0), screenings: stats.reduce((sum, item) => sum + item.screenings, 0) });
        leaflet.geoJSON({ type: "FeatureCollection", features } as never, { style: (feature) => { const patients = Number(feature?.properties?.patients ?? 0); return { color: "#fecaca", weight: 1, fillColor: patients >= 10 ? "#fb7185" : patients >= 5 ? "#dc2626" : patients >= 1 ? "#7f1d1d" : "#27272a", fillOpacity: .72 }; }, onEachFeature: (feature, layer) => layer.on("click", () => setSelected({ municipality: feature.properties.adm3_en, patients: Number(feature.properties.patients), screenings: Number(feature.properties.screenings) })).bindTooltip(feature.properties.adm3_en) }).addTo(instance);
        instance.fitBounds([[5.35, 124.15], [7.45, 125.75]], { padding: [36, 36] });
        }).catch((reason) => { console.error("Region XII map data error", reason); setError("Could not load Region XII boundaries. Check network access and reload."); });
    }).catch((reason) => { console.error("Leaflet load error", reason); setError("Could not load map engine. Reload the page."); });
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  return <main className="min-h-screen bg-[#08090c] text-white"><SiteHeader /><div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8"><p className="signal-label">Geographic screening activity</p><h1 className="mt-3 text-4xl font-semibold">Region XII screening map</h1><p className="mt-3 text-sm text-white/45">Municipality boundaries show aggregate number of registered people tested. No patient identities or individual locations appear.</p>{error && <p className="mt-5 text-red-300">{error}</p>}<section className="mt-7 grid gap-4 sm:grid-cols-2"><Metric label="People tested" value={total.patients}/><Metric label="Completed screenings" value={total.screenings}/></section><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><div className="future-panel overflow-hidden p-2"><div ref={container} className="h-[680px] w-full rounded-[1.1rem]" aria-label="Interactive Region XII municipality map" /></div><aside className="future-panel p-6"><p className="signal-label">Municipality detail</p><h2 className="mt-3 text-2xl font-semibold">{selected?.municipality ?? "Select boundary"}</h2>{selected ? <div className="mt-6 grid gap-3"><Metric label="People tested" value={selected.patients}/><Metric label="Completed screenings" value={selected.screenings}/></div> : <p className="mt-5 text-sm leading-6 text-white/45">Click municipality to view aggregate activity.</p>}<div className="mt-8 space-y-2 text-xs text-white/45"><Legend color="#27272a" text="No people tested"/><Legend color="#7f1d1d" text="1–4 people"/><Legend color="#dc2626" text="5–9 people"/><Legend color="#fb7185" text="10+ people"/></div></aside></div><p className="mt-5 text-xs text-white/30">MapLibre GL. Boundaries: philippines-json-maps (MIT), PSGC/OCHA-derived. General Santos boundary pending separate source.</p></div></main>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-wider text-white/35">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function Legend({ color, text }: { color: string; text: string }) { return <div className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{ background: color }}/>{text}</div>; }

