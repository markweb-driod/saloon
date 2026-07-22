"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import AnimatedLogo from "@/components/AnimatedLogo";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "STYLIST" | "RECEPTIONIST" | "ADMIN";
} | null;

const STAFF_ROLES = ["STYLIST", "RECEPTIONIST", "ADMIN"];

const MARKETING_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/book", label: "Salon Services" },
  { href: "/consultation", label: "Consultation" },
];

export default function NavBar() {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const showMarketingLinks = !loading && !user;
  const isAppShellRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/account");

  if (isAppShellRoute) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-[110] border-b border-gold-500/15 bg-navy-950/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <AnimatedLogo />

        <div className="hidden items-center gap-8 text-sm tracking-wide text-cream-200/80 md:flex">
          {showMarketingLinks &&
            MARKETING_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-gold-400">
                {link.label}
              </Link>
            ))}
          {!loading && user && STAFF_ROLES.includes(user.role) && (
            <Link href="/dashboard" className="transition-colors hover:text-gold-400">
              Dashboard
            </Link>
          )}
          {!loading && user && user.role === "CUSTOMER" && (
            <Link href="/account" className="transition-colors hover:text-gold-400">
              My Account
            </Link>
          )}
          {!loading && !user && (
            <Link href="/login" className="transition-colors hover:text-gold-400">
              Log in
            </Link>
          )}
          {!loading && user && (
            <button onClick={handleLogout} className="transition-colors hover:text-gold-400">
              Log out
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {(showMarketingLinks || loading) && (
            <div className="hidden md:block">
              <LinkButton
                href="/quote"
                variant="gold"
                className="px-5 py-2.5 text-xs lg:px-6 lg:py-3 lg:text-sm"
              >
                Request a Quote
              </LinkButton>
            </div>
          )}

          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-10 w-10 shrink-0 flex-col items-center justify-center space-y-[5px] rounded-full border border-cream-100/20 transition-colors hover:border-gold-400 md:hidden"
          >
            <span
              className={`h-px w-4 bg-cream-100 transition-all duration-300 ${
                menuOpen ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-4 bg-cream-100 transition-all duration-300 ${
                menuOpen ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>
    </header>

      {/* Mobile sidebar drawer */}
      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[100] bg-navy-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[100] flex w-[82%] max-w-xs flex-col border-l border-gold-500/15 bg-navy-950 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out md:hidden pt-24 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2 text-base text-cream-200/85">
          {showMarketingLinks &&
            MARKETING_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 transition-colors hover:bg-white/5 hover:text-gold-400"
              >
                {link.label}
              </Link>
            ))}
          {!loading && user && STAFF_ROLES.includes(user.role) && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 transition-colors hover:bg-white/5 hover:text-gold-400"
            >
              Dashboard
            </Link>
          )}
          {!loading && user && user.role === "CUSTOMER" && (
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 transition-colors hover:bg-white/5 hover:text-gold-400"
            >
              My Account
            </Link>
          )}
          {!loading && !user && (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 transition-colors hover:bg-white/5 hover:text-gold-400"
            >
              Log in
            </Link>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-5">
          {!loading && user ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="w-full rounded-lg px-3 py-3 text-left text-cream-200/85 transition-colors hover:bg-white/5 hover:text-gold-400"
            >
              Log out
            </button>
          ) : (
            <LinkButton
              href="/consultation"
              variant="gold"
              className="w-full px-5 py-3 text-sm"
              onClick={() => setMenuOpen(false)}
            >
              Book Consultation
            </LinkButton>
          )}
        </div>
      </aside>
    </>
  );
}
