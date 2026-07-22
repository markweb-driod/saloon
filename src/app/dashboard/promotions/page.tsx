import { prisma } from "@/lib/prisma";
import { requireRoleSession } from "@/lib/session";
import PromoCodeManager from "@/components/PromoCodeManager";

export default async function PromotionsPage() {
  await requireRoleSession("ADMIN");

  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
        Promotions
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Codes here are live on the homepage the moment they&apos;re activated.
      </p>
      <div className="mt-6">
        <PromoCodeManager
          promoCodes={promoCodes.map((p) => ({
            id: p.id,
            code: p.code,
            discountType: p.discountType,
            discountValue: p.discountValue.toString(),
            active: p.active,
            usageLimit: p.usageLimit,
            usedCount: p.usedCount,
            expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
          }))}
        />
      </div>
    </div>
  );
}
