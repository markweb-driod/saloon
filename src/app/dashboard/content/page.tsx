import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import { ensureSiteContentSeeded, DEFAULT_CONTENT } from "@/lib/content";
import ContentManager from "@/components/ContentManager";

export default async function ContentPage() {
  await requireRoleSession("ADMIN");
  await ensureSiteContentSeeded();

  const rows = await prisma.siteContent.findMany({
    where: { key: { in: DEFAULT_CONTENT.map((d) => d.key) } },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Content
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Edit homepage and footer copy live, no code changes required.
      </p>
      <ContentManager
        content={DEFAULT_CONTENT.map((d) => ({
          key: d.key,
          label: d.label,
          value: byKey[d.key] ?? d.value,
        }))}
      />
    </div>
  );
}
