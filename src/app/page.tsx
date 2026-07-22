import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import HeroCarousel from "@/components/HeroCarousel";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import TiltCard from "@/components/ui/TiltCard";
import OfferPopup from "@/components/OfferPopup";
import SpecialOffers from "@/components/SpecialOffers";
import NewsletterSignup from "@/components/NewsletterSignup";
import Logo from "@/components/Logo";
import { prisma } from "@/lib/prisma";

const STATS = [
  { value: "15+", label: "years of refined service" },
  { value: "40+", label: "master stylists" },
  { value: "IL", label: "Middle Eastern roots" },
  { value: "92%", label: "repeat clientele" },
];

const PRODUCT_CATEGORIES = [
  {
    title: "Signature Collections",
    blurb: "Curated bundles selected for tone, texture, and salon-ready luxury.",
    badge: "Refined",
    src: "https://images.unsplash.com/photo-1595956553066-fe24a8c33395?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "Extension Systems",
    blurb: "Professional-grade wefts, tapes, and clips for flawless application.",
    badge: "Boutique",
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "Designer Wigs",
    blurb: "Ready-to-wear luxury silhouettes with natural movement and comfort.",
    badge: "Elegant",
    src: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop",
  },
  {
    title: "Toppers & Enhancements",
    blurb: "Discreet volume and coverage solutions built for premium confidence.",
    badge: "Signature",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2069&auto=format&fit=crop",
  },
];

const STORE_SPOTLIGHT = [
  {
    title: "Couture Clip-In Set",
    description: "Salon-ready volume in minutes for editorial styling.",
    price: "€139",
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "Platinum Weft Bundle",
    description: "Premium long-length texture with seamless blend.",
    price: "€179",
    src: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop",
  },
  {
    title: "Silk Closure Duo",
    description: "Soft, undetectable coverage for boutique clients.",
    price: "€69",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2069&auto=format&fit=crop",
  },
  {
    title: "Designer Lace Wig",
    description: "Perfect for high-end displays and refined salon styling.",
    price: "€195",
    src: "https://images.unsplash.com/photo-1595956553066-fe24a8c33395?q=80&w=1974&auto=format&fit=crop",
  },
];

const COLLECTIONS = [
  {
    title: "Raw Hair Wholesale",
    description: "Premium long-length selections curated for consistent shine and strength.",
    items: [
      { label: "Silk Straight Reserve", price: "€89", src: "/images/landing/hero-collections.svg" },
      { label: "Natural Wave Heritage", price: "€98", src: "/images/landing/couture-clip-in-set.svg" },
      { label: "Soft Curl Atelier", price: "€119", src: "/images/landing/platinum-weft-bundle.svg" },
    ],
  },
  {
    title: "Bundles & Closures",
    description: "Seamless, polished finishes built for modern salon transformations.",
    items: [
      { label: "Silk Closure Kit", price: "€139", src: "/images/landing/silk-closure-duo.svg" },
      { label: "Deep Wave Bundle", price: "€99", src: "/images/landing/couture-clip-in-set.svg" },
      { label: "Luxe Frontal Pair", price: "€149", src: "/images/landing/designer-lace-wig.svg" },
    ],
  },
];

const STYLISTS = [
  { name: "Ella", role: "Master Colorist", specialty: "Signature Balayage & Highlights", src: "https://images.unsplash.com/photo-1595956553066-fe24a8c33395?q=80&w=1974&auto=format&fit=crop" },
  { name: "Julia", role: "Extension Specialist", specialty: "Seamless Wefts & Keratin", src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1974&auto=format&fit=crop" },
  { name: "Wendy", role: "Texture Expert", specialty: "Silk Presses & Treatments", src: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop" },
];

const SERVICES = [
  {
    title: "Signature Balayage",
    description: "Custom hand-painted highlights tailored to your features for a natural, sun-kissed luxury finish.",
    duration: "120 mins",
    price: "From €180",
    src: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2069&auto=format&fit=crop"
  },
  {
    title: "Seamless Extensions Install",
    description: "Professional weft or tape-in installations using our premium Waifuu collections for flawless blending.",
    duration: "180 mins",
    price: "From €250",
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1974&auto=format&fit=crop"
  },
  {
    title: "Silk Press & Treatment",
    description: "Deep conditioning and precision straightening that leaves textured hair with a glass-like shine.",
    duration: "90 mins",
    price: "From €120",
    src: "https://images.unsplash.com/photo-1595956553066-fe24a8c33395?q=80&w=1974&auto=format&fit=crop"
  },
  {
    title: "Luxury Blowout",
    description: "Voluminous, long-lasting styling perfect for special events or regular maintenance.",
    duration: "60 mins",
    price: "From €65",
    src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=2069&auto=format&fit=crop"
  }
];

export default async function Home() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { homepagePosition: "asc" },
    take: 4,
  });

  const spotlight =
    featuredProducts.length > 0
      ? featuredProducts.map((p) => ({
          title: p.name,
          description: p.description ?? "",
          price: `$${Number(p.unitPrice).toFixed(2)}`,
          src: p.imageUrl || STORE_SPOTLIGHT[index % STORE_SPOTLIGHT.length].src,
        }))
      : STORE_SPOTLIGHT;

  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-cream-100">
      <section className="relative overflow-hidden bg-navy-950/95 pb-16 pt-12 sm:pb-20 sm:pt-20">
        <Image
          src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2069&auto=format&fit=crop"
          alt="Woman with beautiful hair"
          fill
          priority
          className="object-cover opacity-25"
          aria-hidden
        />
        <div className="absolute inset-0 bg-navy-950/75" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-navy-950 to-transparent" aria-hidden />
        <Container className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="mx-auto max-w-xl space-y-6 text-center text-cream-100 xl:mx-0 xl:text-left">
              <Reveal>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-gold-400 uppercase backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500"></span>
                  </span>
                  Introducing The Blue Renaissance
                </div>
                <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-cream-100 xs:text-5xl sm:text-6xl md:text-7xl">
                  Israeli luxury hair, curated for salons and boutiques.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-cream-200/85 sm:text-lg xl:mx-0">
                  Discover Waifuu’s refined collections, curated with precision, elegance, and a distinctly Middle Eastern sensibility for modern beauty brands.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap justify-center gap-3 xl:justify-start">
                  <LinkButton href="/book" variant="gold">
                    Book a Service
                  </LinkButton>
                  <LinkButton href="/products" variant="outline-light">
                    Shop Products
                  </LinkButton>
                </div>
              </Reveal>
            </div>
            <div className="relative">
              <HeroCarousel />
              <div className="pointer-events-none absolute -right-10 top-1/3 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
            </div>
          </div>
        </Container>
      </section>

      <OfferPopup />

      <section className="relative overflow-hidden bg-white/95 py-14 sm:py-20">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold-500">Spotlight sale</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-navy-950 sm:text-4xl">
                A rotating showcase of premium pieces.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Discover limited-quantity inventory with direct buy options and special launch savings.
              </p>
            </div>
            <LinkButton href="/products" variant="outline" className="w-fit px-4 py-2.5 text-xs">
              Open storefront
            </LinkButton>
          </div>
          <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {spotlight.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <TiltCard className="h-full">
                  <Card className="h-full">
                    <div className="relative overflow-hidden rounded-[1.5rem]">
                      <Image
                        src={item.src}
                        alt={item.title}
                        width={900}
                        height={700}
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-gold-600">{item.price}</p>
                      <h3 className="mt-3 font-serif text-xl font-semibold text-navy-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                      <LinkButton href="/products" variant="gold" className="mt-6 w-full px-4 py-3 text-sm">
                        Buy now
                      </LinkButton>
                    </div>
                  </Card>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <SpecialOffers />

      <section className="bg-cream-200/70 py-20 sm:py-28 md:py-32">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Motion"
                title="See our craftsmanship in motion"
                subtitle="Shop with confidence after seeing real hair quality, handling and luxury presentation."
              />
            </div>
            <div className="group relative overflow-hidden rounded-[2rem] border border-navy-900/10 shadow-[0_30px_90px_-36px_rgba(10,14,39,0.35)]">
              <div className="relative overflow-hidden rounded-[2rem]">
                <Image
                  src="/images/landing/brand-video-poster.svg"
                  alt="Brand film poster"
                  width={1600}
                  height={900}
                  loading="eager"
                          className="h-full w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/50 bg-navy-950/60 backdrop-blur transition-transform duration-300 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-gold-400">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative z-20 -mt-12 px-4 sm:-mt-16 sm:px-6">
        <Container className="px-0!">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 rounded-3xl border border-gold-400/20 bg-navy-950/95 px-6 py-8 shadow-[0_32px_80px_-28px_rgba(5,6,15,0.45)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4 sm:px-8 sm:py-10">
            {STATS.map((stat, index) => (
              <Reveal key={stat.label} variant="flip-x" delay={index * 80}>
                <div className="flex flex-col items-center text-center">
                  <span className="font-serif text-2xl font-semibold text-gold-400 sm:text-3xl md:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-2 text-[10px] uppercase tracking-[0.18em] text-cream-200/70 sm:text-xs sm:tracking-[0.22em]">
                    {stat.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="products" className="scroll-mt-24 py-20 sm:py-28 md:py-36">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Product categories"
              title="Refined collections for premium salons and retailers"
              subtitle="From signature bundles to designer wigs, each category is built to perform with elegance."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-2 xl:grid-cols-4">
            {PRODUCT_CATEGORIES.map((category, index) => (
              <Reveal key={category.title} delay={index * 80}>
                <Card className="group flex h-full flex-col overflow-hidden">
                  <div className="relative overflow-hidden rounded-[1.5rem]">
                    <Image
                      src={category.src}
                      alt={category.title}
                      width={900}
                      height={700}
                      loading="eager"
                          className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-6 flex flex-1 flex-col">
                    <span className="inline-flex w-fit rounded-full border border-gold-400/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-gold-600">
                      {category.badge}
                    </span>
                    <h3 className="mt-4 font-serif text-2xl font-semibold text-navy-950">{category.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{category.blurb}</p>
                    <LinkButton href="/products" variant="outline" className="mt-6 w-fit px-4 py-2.5 text-xs">
                      Shop the range
                    </LinkButton>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream-200/70 py-20 sm:py-28 md:py-36">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Collections"
              title="A more classic product layout for discerning buyers"
              subtitle="Featured ranges that feel editorial, premium, and beautifully presented."
            />
          </Reveal>
          {COLLECTIONS.map((collection, collectionIndex) => (
            <Reveal key={collection.title} delay={collectionIndex * 90}>
              <div className="mt-16 first:mt-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-600">
                      {collection.title}
                    </p>
                    <h3 className="mt-3 font-serif text-3xl font-semibold text-navy-950 sm:text-4xl">
                      {collection.title}
                    </h3>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                      {collection.description}
                    </p>
                  </div>
                  <LinkButton href="/products" variant="outline" className="w-fit px-4 py-2.5 text-xs">
                    Shop the collection
                  </LinkButton>
                </div>
                <div className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {collection.items.map((item) => (
                    <Card key={item.label} className="group overflow-hidden">
                      <div className="relative overflow-hidden rounded-[1.4rem]">
                        <Image
                          src={item.src}
                          alt={item.label}
                          width={900}
                          height={700}
                          loading="eager"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-5">
                        <p className="text-sm uppercase tracking-[0.22em] text-gold-600">{item.price}</p>
                        <h4 className="mt-3 font-serif text-xl font-semibold text-navy-950">{item.label}</h4>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-600">Salon-ready luxury</span>
                          <LinkButton href="/products" variant="outline" className="px-3 py-2 text-[11px]">
                            Buy now
                          </LinkButton>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </Container>
      </section>

      <section className="bg-white/95 py-20 sm:py-28 md:py-36">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Our Services"
              title="Premium treatments, delivered to you"
              subtitle="From transformative color to seamless extensions, enjoy salon-grade luxury wherever you are."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((service, index) => (
              <Reveal key={service.title} delay={index * 80}>
                <Card className="group flex h-full flex-col overflow-hidden border-navy-900/5 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="relative h-64 overflow-hidden rounded-[1.4rem]">
                    <Image
                      src={service.src}
                      alt={service.title}
                      fill
                      loading="eager"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 rounded-full bg-navy-950/80 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-widest text-gold-400">
                      {service.duration}
                    </div>
                  </div>
                  <div className="mt-6 flex flex-1 flex-col px-1">
                    <h3 className="font-serif text-xl font-semibold text-navy-950">{service.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{service.description}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-sm font-medium text-navy-950">{service.price}</span>
                      <LinkButton href="/book" variant="outline" className="px-4 py-2 text-xs">
                        Book Service
                      </LinkButton>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy-950 py-20 sm:py-28 md:py-36">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Mobile Salon"
              title="Book a master stylist to your location"
              subtitle="Experience our Signature Balayage and premium hair services in the comfort of your own space."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STYLISTS.map((person, staffIndex) => (
              <Reveal key={person.name} delay={staffIndex * 90}>
                <Card className="group flex flex-col overflow-hidden bg-[#0B1226]/90 border-white/10 text-cream-100">
                  <div className="relative h-80 overflow-hidden rounded-[1.4rem]">
                    <Image
                      src={person.src}
                      alt={person.name}
                      fill
                      loading="eager"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-6 flex flex-1 flex-col">
                    <p className="text-xs uppercase tracking-[0.3em] text-gold-400">{person.role}</p>
                    <h3 className="mt-3 font-serif text-2xl font-semibold text-cream-100">{person.name}</h3>
                    <p className="mt-3 text-sm text-cream-200/70">Specialty: <span className="text-cream-200/90">{person.specialty}</span></p>
                    <div className="mt-8 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-cream-200/80">
                        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-400" />
                        <span>Available Now</span>
                      </div>
                      <LinkButton href={`/book?stylist=${person.name.toLowerCase()}`} variant="gold" className="px-4 py-2.5 text-xs">
                        Book {person.name}
                      </LinkButton>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <footer className="bg-navy-950 py-12">
        <Container>
          <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
            <div>
              <Logo />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-200/75">
                Waifuu — Israeli luxury hair collections for salons and boutiques. Premium quality, trusted sourcing, and refined service.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/products" variant="gold" className="px-4 py-2 text-xs">
                  Buy Products
                </LinkButton>
                <LinkButton href="/book" variant="outline-light" className="px-4 py-2 text-xs">
                  Book a Service
                </LinkButton>
              </div>
              <div className="mt-8 flex gap-4">
                <a href="#" aria-label="Instagram" className="text-cream-100/80 hover:text-gold-400">Instagram</a>
                <a href="#" aria-label="Facebook" className="text-cream-100/80 hover:text-gold-400">Facebook</a>
                <a href="#" aria-label="TikTok" className="text-cream-100/80 hover:text-gold-400">TikTok</a>
              </div>
            </div>

            <div className="md:col-span-1">
              <h3 className="text-sm font-medium uppercase tracking-[0.28em] text-gold-400">Quick links</h3>
              <ul className="mt-4 space-y-2 text-sm text-cream-200/75">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/products">Products</Link></li>
                <li><Link href="/book">Book a service</Link></li>
                <li><Link href="/login">Login</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium uppercase tracking-[0.28em] text-gold-400">Contact</h3>
              <div className="mt-4 text-sm text-cream-200/75">
                <p>Israel</p>
                <p className="mt-2">hello@waifuu.de</p>
                <p className="mt-2">+49 30 1234 5678</p>
              </div>
              <div className="mt-6">
                <NewsletterSignup />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-navy-900/20 pt-6 text-center text-xs text-cream-200/40">
            &copy; {new Date().getFullYear()} Waifuu. All rights reserved.
          </div>
        </Container>
      </footer>
    </main>
  );
}
