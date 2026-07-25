import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AIRPORTS } from "@/lib/mock-data";
import { useLocalStorage, KEYS, type PriceAlert } from "@/lib/storage";
import { formatBRL, t } from "@/lib/i18n";
import { Bell, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alertas de preço — MAB Flights" },
      { name: "description", content: "Crie alertas e seja avisado quando o preço da sua rota cair." },
      { property: "og:title", content: "Alertas de preço — MAB Flights" },
      { property: "og:description", content: "Nunca perca uma oportunidade de voo com preço baixo." },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const [alerts, setAlerts] = useLocalStorage<PriceAlert[]>(KEYS.alerts, []);
  const [origin, setOrigin] = useState("GRU");
  const [destination, setDestination] = useState("MIA");
  const [target, setTarget] = useState(3000);

  const add = () => {
    setAlerts([
      { id: crypto.randomUUID(), origin, destination, targetPriceBRL: target, createdAt: new Date().toISOString() },
      ...alerts,
    ]);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-gold" />
          <div>
            <h1 className="font-display text-3xl md:text-4xl">{t("alerts.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("alerts.subtitle")}</p>
          </div>
        </div>

        <div className="mt-8 card-luxe rounded-2xl p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="block rounded-xl border border-border bg-input/50 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("search.origin")}</div>
              <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1 w-full bg-transparent text-base font-semibold outline-none">
                {AIRPORTS.map((a) => <option key={a.code} value={a.code} className="bg-card">{a.code} · {a.city}</option>)}
              </select>
            </label>
            <label className="block rounded-xl border border-border bg-input/50 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("search.destination")}</div>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-1 w-full bg-transparent text-base font-semibold outline-none">
                {AIRPORTS.map((a) => <option key={a.code} value={a.code} className="bg-card">{a.code} · {a.city}</option>)}
              </select>
            </label>
            <label className="block rounded-xl border border-border bg-input/50 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("alerts.target")}</div>
              <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-1 w-full bg-transparent text-base font-semibold outline-none" />
            </label>
            <button
              onClick={add}
              className="inline-flex items-center justify-center gap-2 rounded-xl gold-gradient text-primary-foreground font-semibold px-6 py-3 shadow-luxe hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> {t("alerts.create")}
            </button>
          </div>
        </div>

        <div className="mt-8">
          {alerts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12 border border-dashed border-gold/20 rounded-2xl">
              {t("account.empty.alerts")}
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl card-luxe p-4">
                  <div>
                    <div className="font-display text-xl">{a.origin} → {a.destination}</div>
                    <div className="text-xs text-muted-foreground">Criado em {new Date(a.createdAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-semibold">≤ {formatBRL(a.targetPriceBRL)}</span>
                    <button
                      onClick={() => setAlerts(alerts.filter((x) => x.id !== a.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
