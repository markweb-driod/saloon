"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps a background layer (e.g. hero photo) and drifts it slower than
 * scroll for a depth/parallax feel. Also applies a very subtle 3D tilt
 * that follows the pointer for an ambient, luxurious motion cue.
 */
export default function ParallaxLayer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafScroll = 0;
    let rafMove = 0;
    let tiltX = 0;
    let tiltY = 0;

    function applyTransform(scrollY: number) {
      if (!el) return;
      el.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0) scale(1.1) perspective(1200px) rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
    }

    function onScroll() {
      cancelAnimationFrame(rafScroll);
      rafScroll = requestAnimationFrame(() => applyTransform(window.scrollY));
    }

    function onMove(e: PointerEvent) {
      cancelAnimationFrame(rafMove);
      rafMove = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        tiltX = nx * 3;
        tiltY = -ny * 3;
        applyTransform(window.scrollY);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(rafScroll);
      cancelAnimationFrame(rafMove);
    };
  }, []);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
