import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { findDeal, priceHistory } from "@/lib/mock-data";
import { computeMabScore, scoreColorClass, scoreLabelKey } from "@/lib/mab-score";
import { formatBRL, formatMiles, t } from "@/lib/i18n";
import { useLocalStorage, KEYS, type SavedRoute, type PriceAlert } from "@/lib/storage";
import { Bell, Heart, Plane, Sparkles, ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/flight/$id")({
  loader: ({ params }) => {
    const deal = findDeal(params.id);
    if (!deal) throw notFound();
    return { deal };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Voo não encontrado — MAB Flights" }, { name: "robots", content: "noindex" }] };
    const { deal } = loaderData;
    const title = `${deal.origin.city} → ${deal.destination.city} · ${deal.airline.name} — MAB Flights`;
    const desc = `Passagem ${deal.origin.code}-${deal.destination.code} por ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(deal.priceBRL)}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: FlightDetail,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Voo não encontrado</h1>
        <Link to="/" className="mt-6 inline-block text-gold">Voltar ao início</Link>
      </div>
      <Footer />
    </div>
  ),
});

function FlightDetail() {
  const { deal } = Route.useLoaderData();
  const score = computeMabScore(deal);
  const history = useMemo(() => priceHistory(deal), [deal]);
  const [saved, setSaved] = useLocalStorage<SavedRoute[]>(KEYS.saved, []);
  const [alerts, setAlerts] = useLocalStorage<PriceAlert[]>(KEYS.alerts, []);
  const [showAlert, setShowAlert] = useState(false);
  const [target, setTarget] = useState(Math.round(deal.priceBRL * 0.9));

  const routeKey = `${deal.origin.code}-${deal.destination.code}`;
  const isSaved = saved.some((s) => s.id === routeKey);

  const toggleSave = () => {
    if (isSaved) setSaved(saved.filter((s) => s.id !== routeKey));
    else setSaved([{ id: routeKey, origin: deal.origin.code, destination: deal.destination.code, createdAt: new Date().toISOString() }, ...saved]);
  };

  const createAlert = () => {
    setAlerts([
      { id: crypto.randomUUID(), origin: deal.origin.code, destination: deal.destination.code, targetPriceBRL: target, createdAt: new Date().toISOString() },
      ...alerts,
    ]);
    setShowAlert(false);
  };

  const max = Math.max(...history.map((h) => h.price));
  const min = Math.min(...history.map((h) => h.price));
  const dh = Math.floor(deal.durationMin / 60);
  const dm = deal.durationMin % 60;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-gold">← Voltar</Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card-luxe rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: deal.airline.color }}>
                {deal.airline.code}
              </span>
              <div>
                <div className="font-medium">{deal.airline.name}</div>
                <div className="text-xs text-muted-foreground">Voo {deal.airline.code}{Math.floor(Math.random() * 9000 + 1000)} · {deal.stops === 0 ? t("flight.direct") : `${deal.stops} ${t("flight.stop")}`}</div>
              </div>
              <span className={`ml-auto rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${scoreColorClass(score.label)}`}>
                {t("score.label")} {score.score} · {t(scoreLabelKey(score.label))}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div>
                <div className="font-display text-5xl">{deal.origin.code}</div>
                <div className="mt-1 text-sm">{deal.origin.city}</div>
                <div className="text-xs text-muted-foreground">{deal.origin.name}</div>
                <div className="mt-3 text-xs text-gold">{deal.departDate}</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs text-muted-foreground">{dh}h{dm.toString().padStart(2, "0")}</div>
                <div className="flex items-center gap-2 w-32">
                  <span className="h-px flex-1 bg-gold/30" />
                  <Plane className="h-4 w-4 text-gold" />
                  <span className="h-px flex-1 bg-gold/30" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{deal.stops === 0 ? t("flight.direct") : `${deal.stops} ${t("flight.stop")}`}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl">{deal.destination.code}</div>
                <div className="mt-1 text-sm">{deal.destination.city}</div>
                <div className="text-xs text-muted-foreground">{deal.destination.name}</div>
                {deal.returnDate && <div className="mt-3 text-xs text-gold">Volta: {deal.returnDate}</div>}
              </div>
            </div>

            {/* Price history */}
            <div className="mt-10">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl">{t("flight.history")}</h3>
                <div className="text-xs text-muted-foreground">
                  {t("flight.avgPrice")}: <span className="text-foreground">{formatBRL(deal.averagePriceBRL)}</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-gold/10 bg-background/60 p-4">
                <svg viewBox="0 0 400 120" className="w-full h-32">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.13 88)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="oklch(0.82 0.13 88)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const pts = history.map((h, i) => {
                      const x = (i / (history.length - 1)) * 400;
                      const y = 110 - ((h.price - min) / (max - min || 1)) * 100;
                      return `${x},${y}`;
                    });
                    return (
                      <>
                        <polyline points={`0,120 ${pts.join(" ")} 400,120`} fill="url(#g1)" />
                        <polyline points={pts.join(" ")} fill="none" stroke="oklch(0.82 0.13 88)" strokeWidth="1.5" />
                      </>
                    );
                  })()}
                </svg>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>90 dias atrás</span>
                  <span>Hoje</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking card */}
          <div className="space-y-4">
            <div className="card-luxe rounded-2xl p-6">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("flight.currentPrice")}</div>
              <div className="mt-1 font-display text-4xl text-gold-gradient">{formatBRL(deal.priceBRL)}</div>
              <div className="text-xs text-muted-foreground">{t("misc.perPax")}</div>
              {deal.miles && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  <span>Ou {formatMiles(deal.miles)} {t("misc.miles")}</span>
                </div>
              )}
              <div className="mt-4 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-xs text-success">
                {t("deal.savings")}: <strong>{formatBRL(score.savings)}</strong> (-{score.discountPct}%)
              </div>

              <button className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl gold-gradient text-primary-foreground font-semibold px-4 py-3 shadow-luxe hover:opacity-95 transition">
                {t("flight.book")} <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={toggleSave}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                    isSaved ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground hover:text-gold hover:border-gold/40"
                  }`}
                >
                  {isSaved ? <Check className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                  {isSaved ? "Salvo" : t("flight.save")}
                </button>
                <button
                  onClick={() => setShowAlert((v) => !v)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-gold hover:border-gold/40"
                >
                  <Bell className="h-3.5 w-3.5" /> {t("flight.alert")}
                </button>
              </div>

              {showAlert && (
                <div className="mt-3 rounded-lg border border-gold/20 p-3">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("alerts.target")}</label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="mt-1 w-full rounded-md bg-input px-3 py-2 text-sm outline-none focus:border-gold border border-border"
                  />
                  <button
                    onClick={createAlert}
                    className="mt-2 w-full rounded-md gold-gradient text-primary-foreground text-xs font-semibold py-2"
                  >
                    {t("alerts.create")}
                  </button>
                </div>
              )}
            </div>

            <div className="card-luxe rounded-2xl p-6 text-xs text-muted-foreground space-y-2">
              <div className="flex justify-between"><span>Bagagem de mão</span><span className="text-foreground">Incluída</span></div>
              <div className="flex justify-between"><span>Bagagem despachada</span><span>Opcional</span></div>
              <div className="flex justify-between"><span>Cancelamento</span><span>24h grátis</span></div>
              <div className="flex justify-between"><span>Emissão</span><span className="text-gold">Imediata</span></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
