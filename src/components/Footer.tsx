import { Link } from "@tanstack/react-router";
import { Plane, MessageCircle, Mail, MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";
import { BRAND, INDICATIVE_DISCLAIMER } from "@/lib/brand";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import { PLATFORM_LINKS } from "@/components/PlatformSection";

export function Footer() {
  const t = useT();
  const { settings } = useSettings();
  const wa = whatsappLink(
    `Olá! Vim pelo site da ${BRAND.name} e quero falar com um consultor.`,
    settings.whatsappNumber,
  );

  return (
    <footer className="mt-24 bg-brand text-brand-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-cta text-cta-foreground">
                <Plane className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg">{BRAND.name}</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-brand-foreground/70">
                  {BRAND.subtitle}
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-brand-foreground/80">{BRAND.tagline}</p>
            <p className="mt-1 max-w-sm text-sm text-brand-foreground/60">{BRAND.slogan}</p>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-whatsapp px-4 text-xs font-bold uppercase tracking-wide text-whatsapp-foreground transition hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" /> Falar com um consultor
            </a>
          </div>

          <nav className="text-sm">
            <p className="mb-3 text-xs uppercase tracking-widest text-brand-foreground/60">
              {t("footer.platform")}
            </p>
            <ul className="space-y-2">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    hash={l.hash}
                    className="text-brand-foreground/85 transition hover:text-cta"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-sm text-brand-foreground/85">
            <p className="mb-3 text-xs uppercase tracking-widest text-brand-foreground/60">
              {t("footer.contact")}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {BRAND.email}
            </p>
            <p className="mt-2 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> {BRAND.location}
            </p>
            <p className="mt-2 text-brand-foreground/60">{settings.businessHours}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/solicitar" className="transition hover:text-cta">
                  Solicitar emissão com milhas
                </Link>
              </li>
              <li>
                <Link to="/auth" className="transition hover:text-cta">
                  Entrar / criar conta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-brand-foreground/15 pt-6 text-xs text-brand-foreground/60 md:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND.name} · {BRAND.domain}
          </span>
          <span>{INDICATIVE_DISCLAIMER}</span>
        </div>
      </div>
    </footer>
  );
}
