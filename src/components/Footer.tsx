import { Plane } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-24 bg-brand text-brand-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-cta text-cta-foreground">
                <Plane className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg">MAB Flights</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-brand-foreground/75">{t("brand.slogan")}</p>
          </div>
          <div className="text-sm text-brand-foreground/80">
            <p className="text-brand-foreground/60 uppercase tracking-widest text-xs mb-3">{t("footer.platform")}</p>
            <ul className="space-y-2">
              <li>{t("deals.domestic")}</li>
              <li>{t("deals.international")}</li>
              <li>{t("deals.miles")}</li>
              <li>{t("nav.alerts")}</li>
            </ul>
          </div>
          <div className="text-sm text-brand-foreground/80">
            <p className="text-brand-foreground/60 uppercase tracking-widest text-xs mb-3">{t("footer.contact")}</p>
            <p>contato@mabflights.com</p>
            <p className="mt-1">São Paulo · Brasil</p>
          </div>
        </div>
        <div className="mt-10 border-t border-brand-foreground/15 pt-6 text-xs text-brand-foreground/60 flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} MAB Flights. {t("footer.tagline")}</span>
          <span>{t("footer.priceNote")}</span>
        </div>
      </div>
    </footer>
  );
}
