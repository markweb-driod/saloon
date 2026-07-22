import { prisma } from "@/lib/prisma";

export const DEFAULT_CONTENT: { key: string; label: string; value: string }[] = [
  {
    key: "hero_title",
    label: "Homepage hero title",
    value: "Israeli luxury hair, curated for salons and boutiques.",
  },
  {
    key: "hero_subtitle",
    label: "Homepage hero subtitle",
    value:
      "Discover Waifuu's refined collections, curated with precision, elegance, and a distinctly Middle Eastern sensibility for modern beauty brands.",
  },
  {
    key: "footer_address",
    label: "Footer address",
    value: "Israel",
  },
  { key: "footer_email", label: "Footer email", value: "hello@waifuu.de" },
  { key: "footer_phone", label: "Footer phone", value: "+49 30 1234 5678" },
];

/** Reads editable site copy from SiteContent, falling back to defaults when unset. */
export async function getSiteContent(
  keys: string[]
): Promise<Record<string, string>> {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const defaults = Object.fromEntries(
    DEFAULT_CONTENT.filter((d) => keys.includes(d.key)).map((d) => [d.key, d.value])
  );
  return { ...defaults, ...byKey };
}

/** Ensures every default content row exists in the DB, without overwriting edits. */
export async function ensureSiteContentSeeded(): Promise<void> {
  for (const item of DEFAULT_CONTENT) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
}
