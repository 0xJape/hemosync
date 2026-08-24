"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export default function MotionReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-reveal]", { opacity: 0, y: 20, duration: .65, stagger: .08, ease: "power3.out", clearProps: "all" });
    }, root);
    return () => context.revert();
  }, []);

  return <div ref={root} className={className}>{children}</div>;
}
