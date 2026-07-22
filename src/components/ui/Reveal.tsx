"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "fade" | "flip-x" | "flip-y";

const VARIANT_CLASS: Record<Variant, string> = {
  fade: "reveal",
  "flip-x": "reveal reveal-flip-x",
  "flip-y": "reveal reveal-flip-y",
};

export default function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "fade",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: Variant;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Render visible on the server and on the first client paint. The old
  // hidden-first approach left whole sections blank when a proxied dev
  // session delayed or interrupted the observer callback.
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${VARIANT_CLASS[variant]} ${inView ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
