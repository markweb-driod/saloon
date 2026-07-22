type Align = "center" | "left";

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  light = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: Align;
  light?: boolean;
}) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col ${alignClass}`}>
      {eyebrow && (
        <span
          className={`mb-3 text-xs font-medium uppercase tracking-[0.3em] ${
            light ? "text-gold-400" : "text-gold-600"
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-serif text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl ${
          light ? "text-cream-100" : "text-navy-950"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${
            light ? "text-cream-200/80" : "text-slate-600"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
