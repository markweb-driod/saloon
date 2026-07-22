import Card from "@/components/ui/Card";

export default function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        {title}
      </h1>
      <Card className="mt-6 max-w-lg">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
          Coming soon
        </span>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {phase} is next up on the build plan (see{" "}
          <code className="rounded bg-navy-900/5 px-1.5 py-0.5 text-navy-800">
            docs/implementation-plan.md
          </code>
          ).
        </p>
      </Card>
    </div>
  );
}
