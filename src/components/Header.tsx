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

  const currentLoc = getLocale();

  return (
    <header
      className={`sticky top-0 z-40 border-b border-gold/10 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "header-scrolled" : "bg-background/80"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8 md:py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="grid h-9 w-9 place-items-center rounded-lg gold-gradient text-primary-foreground shadow-luxe transition-transform duration-500 group-hover:rotate-[-8deg]">
            <Plane className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-tight">MAB Flights</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Premium Travel</span>
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
                className={`nav-link text-sm transition-colors ${active ? "text-gold" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>


        <div className="hidden items-center gap-2 md:flex relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-gold/20 px-3 py-1.5 text-xs text-muted-foreground hover:text-gold hover:border-gold/40 transition"
          >
            <Globe className="h-3.5 w-3.5" />
            {SUPPORTED_LOCALES.find((l) => l.code === currentLoc)?.flag} {currentLoc.toUpperCase()}
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-md border border-gold/20 bg-card shadow-luxe py-1">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code as Locale);
                    setLangOpen(false);
                    force((x) => x + 1);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 ${
                    l.code === currentLoc ? "text-gold" : "text-foreground"
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
          className="md:hidden rounded-md border border-gold/20 p-2 text-gold"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gold/10 bg-background/95">
          <nav className="flex flex-col px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="py-2.5 text-sm text-foreground/90 hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gold/10 pt-2 flex flex-wrap gap-2">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code as Locale);
                    force((x) => x + 1);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    l.code === currentLoc ? "border-gold text-gold" : "border-border text-muted-foreground"
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
