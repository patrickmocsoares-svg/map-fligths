import { Link, useRouterState } from "@tanstack/react-router";
import { Plane, Menu, X, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useT, useLocale, setLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

export function Header() {
  const t = useT();
  const currentLoc = useLocale();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { to: "/", label: t("nav.home") },
    { to: "/opportunities", label: t("nav.opportunities") },
    { to: "/deals", label: t("nav.deals") },
    { to: "/alerts", label: t("nav.alerts") },
    { to: "/account", label: t("nav.account") },
  ];

  

  return (
    <header
      className={`sticky top-0 z-40 border-b border-brand-soft/30 bg-brand text-brand-foreground backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "header-scrolled" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8 md:py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cta text-cta-foreground shadow-md transition-transform duration-500 group-hover:rotate-[-8deg]">
            <Plane className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-tight">MAB Flights</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-brand-foreground/70">Premium Travel</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                data-active={active}
                className={`nav-link text-sm transition-colors ${active ? "text-cta" : "text-brand-foreground/80 hover:text-brand-foreground"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>


        <div className="hidden items-center gap-2 md:flex relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-brand-foreground/25 px-3 py-1.5 text-xs text-brand-foreground/85 hover:text-cta hover:border-cta/60 transition"
          >
            <Globe className="h-3.5 w-3.5" />
            {SUPPORTED_LOCALES.find((l) => l.code === currentLoc)?.flag} {currentLoc.toUpperCase()}
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-card text-foreground shadow-md py-1">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code as Locale);
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 ${
                    l.code === currentLoc ? "text-cta font-semibold" : "text-foreground"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden rounded-lg border border-brand-foreground/25 p-2 text-brand-foreground"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-brand-foreground/15 bg-brand">
          <nav className="flex flex-col px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="py-2.5 text-sm text-brand-foreground/90 hover:text-cta"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-brand-foreground/15 pt-2 flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code as Locale);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    l.code === currentLoc ? "border-cta text-cta" : "border-brand-foreground/25 text-brand-foreground/75"
                  }`}
                >
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
