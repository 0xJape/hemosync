import Link from "next/link";

export default function SiteHeader() {
  return <header className="relative z-20 border-b border-white/10 bg-[#090a0e]/90 text-white backdrop-blur-xl print:hidden"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-10"><Link href="/" className="shrink-0"><strong className="tracking-[.16em]">HEMOSYNC</strong><small className="block text-[10px] uppercase tracking-[.22em] text-white/40">Screening intelligence</small></Link><nav className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[.03] p-1" aria-label="Main navigation"><Link href="/" className="header-nav-link">Screening</Link><Link href="/records" className="header-nav-link">Records</Link><Link href="/map" className="header-nav-link">Map</Link></nav></div></header>;
}
