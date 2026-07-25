import { Plane } from "lucide-react";
import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="border-t border-gold/10 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md gold-gradient text-primary-foreground">
                <Plane className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg">MAB Flights</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("brand.slogan")}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="text-gold/80 uppercase tracking-widest text-xs mb-3">Plataforma</p>
            <ul className="space-y-2">
              <li>Ofertas nacionais</li>
              <li>Ofertas internacionais</li>
              <li>Achados com milhas</li>
              <li>Alertas de preço</li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="text-gold/80 uppercase tracking-widest text-xs mb-3">Contato</p>
            <p>contato@mabflights.com</p>
            <p className="mt-1">São Paulo · Brasil</p>
          </div>
        </div>
        <div className="mt-10 border-t border-gold/10 pt-6 text-xs text-muted-foreground/70 flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} MAB Flights. {t("footer.tagline")}</span>
          <span>Preços indicativos. Sujeitos a disponibilidade.</span>
        </div>
      </div>
    </footer>
  );
}
