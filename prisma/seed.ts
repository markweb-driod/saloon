import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_CONTENT = [
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

const prisma = new PrismaClient();

const SALON_HOURS = { start: "09:00", end: "17:00" };
const DEFAULT_WORKING_HOURS = JSON.stringify({
  mon: [SALON_HOURS],
  tue: [SALON_HOURS],
  wed: [SALON_HOURS],
  thu: [SALON_HOURS],
  fri: [SALON_HOURS],
  sat: [{ start: "10:00", end: "14:00" }],
  sun: [],
});

async function upsertUser(opts: {
  email: string;
  name: string;
  role: "ADMIN" | "RECEPTIONIST" | "STYLIST" | "CUSTOMER";
  password: string;
  specialties?: string;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);
  const isStaffRole =
    opts.role === "STYLIST" || opts.role === "RECEPTIONIST" || opts.role === "ADMIN";
  const staffFields = {
    commissionRate: opts.role === "STYLIST" ? 40 : 0,
    specialties: opts.specialties,
    workingHours: DEFAULT_WORKING_HOURS,
  };

  return prisma.user.upsert({
    where: { email: opts.email },
    update: {
      passwordHash,
      ...(isStaffRole
        ? { staff: { upsert: { create: staffFields, update: staffFields } } }
        : {}),
    },
    create: {
      email: opts.email,
      name: opts.name,
      role: opts.role,
      passwordHash,
      ...(isStaffRole
        ? { staff: { create: staffFields } }
        : { customer: { create: {} } }),
    },
  });
}

async function main() {
  await upsertUser({
    email: "admin@salon.test",
    name: "Salon Admin",
    role: "ADMIN",
    password: "password123",
  });
  await upsertUser({
    email: "reception@salon.test",
    name: "Front Desk",
    role: "RECEPTIONIST",
    password: "password123",
  });
  await upsertUser({
    email: "ella@salon.test",
    name: "Ella",
    role: "STYLIST",
    password: "password123",
    specialties: "Signature Balayage & Highlights",
  });
  await upsertUser({
    email: "julia@salon.test",
    name: "Julia",
    role: "STYLIST",
    password: "password123",
    specialties: "Seamless Wefts & Keratin",
  });
  await upsertUser({
    email: "wendy@salon.test",
    name: "Wendy",
    role: "STYLIST",
    password: "password123",
    specialties: "Silk Presses & Treatments",
  });
  await upsertUser({
    email: "customer@salon.test",
    name: "Casey Customer",
    role: "CUSTOMER",
    password: "password123",
  });

  const services = [
    { name: "Signature Balayage", durationMinutes: 120, price: 180, category: "Color" },
    { name: "Seamless Extensions Install", durationMinutes: 180, price: 250, category: "Extensions" },
    { name: "Silk Press & Treatment", durationMinutes: 90, price: 120, category: "Treatment" },
    { name: "Luxury Blowout", durationMinutes: 60, price: 65, category: "Styling" },
  ];
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
    }
  }

  const products = [
    {
      name: "Hydrating Shampoo",
      sku: "SH-HYD-250",
      category: "Shampoo",
      description:
        "A sulfate-free daily shampoo that replenishes moisture without weighing hair down. Formulated with hyaluronic acid and coconut extract for soft, hydrated strands after every wash.",
      imageUrl: "https://loremflickr.com/600/600/shampoo?lock=401",
      stockQuantity: 20,
      reorderThreshold: 5,
      unitCost: 6,
      unitPrice: 18,
      featured: true,
      homepagePosition: 1,
    },
    {
      name: "Repair Conditioner",
      sku: "CO-REP-250",
      category: "Conditioner",
      description:
        "A deep-conditioning treatment that rebuilds the hair's protein structure, smoothing split ends and restoring elasticity to color-treated and heat-styled hair.",
      imageUrl: "https://loremflickr.com/600/600/conditioner?lock=402",
      stockQuantity: 20,
      reorderThreshold: 5,
      unitCost: 6.5,
      unitPrice: 19,
      featured: true,
      homepagePosition: 2,
    },
    {
      name: "Argan Hair Oil",
      sku: "OI-ARG-100",
      category: "Treatment",
      description:
        "A lightweight, fast-absorbing finishing oil pressed from Moroccan argan kernels. Tames frizz, adds mirror shine, and protects against heat up to 450°F.",
      imageUrl: "https://loremflickr.com/600/600/arganoil?lock=403",
      stockQuantity: 12,
      reorderThreshold: 4,
      unitCost: 8,
      unitPrice: 26,
      featured: true,
      homepagePosition: 3,
    },
    {
      name: "Silk Serum",
      sku: "SR-SLK-050",
      category: "Treatment",
      description:
        "A silicone-free smoothing serum that seals the cuticle for glass-like shine and all-day frizz control, without buildup or greasiness.",
      imageUrl: "https://loremflickr.com/600/600/serum?lock=404",
      stockQuantity: 15,
      reorderThreshold: 5,
      unitCost: 9,
      unitPrice: 28,
      supplierNote: "Order from GlowSupply Co, lead time 5 days",
      featured: true,
      homepagePosition: 4,
    },
    {
      name: "Heat Shield Spray",
      sku: "HS-SPR-150",
      category: "Styling",
      description:
        "A weightless leave-in spray that forms a protective barrier against blow-dryers, curling irons, and flat irons up to 450°F, while adding touchable hold.",
      imageUrl: "https://loremflickr.com/600/600/hairspray?lock=405",
      stockQuantity: 18,
      reorderThreshold: 6,
      unitCost: 5.5,
      unitPrice: 22,
    },
    {
      name: "Overnight Repair Mask",
      sku: "MK-RPR-200",
      category: "Treatment",
      description:
        "An intensive leave-in mask enriched with keratin and biotin. Apply before bed once a week to wake up to visibly stronger, smoother, more resilient hair.",
      imageUrl: "https://loremflickr.com/600/600/hairmask?lock=406",
      stockQuantity: 10,
      reorderThreshold: 4,
      unitCost: 10,
      unitPrice: 32,
    },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        category: p.category,
        description: p.description,
        imageUrl: p.imageUrl,
        unitCost: p.unitCost,
        unitPrice: p.unitPrice,
        reorderThreshold: p.reorderThreshold,
        ...("supplierNote" in p ? { supplierNote: p.supplierNote } : {}),
        ...("featured" in p ? { featured: p.featured } : {}),
        ...("homepagePosition" in p ? { homepagePosition: p.homepagePosition } : {}),
      },
      create: p,
    });
  }

  for (const c of DEFAULT_CONTENT) {
    await prisma.siteContent.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }

  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: "PERCENT",
      discountValue: 10,
      active: true,
    },
  });

  console.log("Seed complete. Test accounts (password: password123):");
  console.log(
    "  admin@salon.test / reception@salon.test / stylist@salon.test / stylist2@salon.test / customer@salon.test"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
