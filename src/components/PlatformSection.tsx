/**
 * "Plataforma" — every item is a real, clickable entry point.
 * No decorative lists: each card navigates to an existing route.
 */
import { Link } from "@tanstack/react-router";
import { Plane, Globe2, Gem, BellRing, MapPinned, UserRound, ArrowRight } from "lucide-react";

export const PLATFORM_LINKS = [
  { to: "/deals", hash: undefined, label: "Ofertas Nacionais", desc: "Tarifas monitoradas dentro do Brasil", Icon: Plane },
  { to: "/deals", hash: undefined, label: "Ofertas Internacionais", desc: "América, Europa e Oriente Médio", Icon: Globe2 },
  { to: "/solicitar", hash: undefined, label: "Ofertas com Milhas", desc: "Consulte uma emissão com milhas", Icon: Gem },
  { to: "/alerts", hash: undefined, label: "Alertas de Preço", desc: "Avisamos quando a tarifa cair", Icon: BellRing },
  { to: "/", hash: "destinos", label: "Destinos Populares", desc: "Os destinos mais buscados agora", Icon: MapPinned },
  { to: "/account", hash: undefined, label: "Minha Conta", desc: "Rotas salvas e seus alertas", Icon: UserRound },
] as const;

export function PlatformSection() {
  return (
    <section id="plataforma" className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand">Plataforma</p>
        <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">Tudo o que você precisa em um lugar só</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_LINKS.map(({ to, hash, label, desc, Icon }) => (
          <Link
            key={label}
            to={to}
            hash={hash}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground">{desc}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-cta transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}
