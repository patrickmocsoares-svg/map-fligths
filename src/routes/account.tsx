import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLocalStorage, KEYS, type SavedRoute, type PriceAlert } from "@/lib/storage";
import { AIRPORTS } from "@/lib/mock-data";
import { formatBRL, t } from "@/lib/i18n";
import { Heart, Bell, Trash2, User } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Minha conta — MAB Flights" },
      { name: "description", content: "Rotas salvas, alertas de preço e preferências." },
      { property: "og:title", content: "Minha conta — MAB Flights" },
      { property: "og:description", content: "Gerencie suas rotas favoritas e alertas." },
    ],
  }),
  component: Account,
});

function cityOf(code: string) {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code;
}

function Account() {
  const [saved, setSaved] = useLocalStorage<SavedRoute[]>(KEYS.saved, []);
  const [alerts, setAlerts] = useLocalStorage<PriceAlert[]>(KEYS.alerts, []);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full gold-gradient text-primary-foreground">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">{t("account.title")}</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta ao MAB Flights.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="card-luxe rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-gold" />
              <h2 className="font-display text-xl">{t("account.saved")}</h2>
            </div>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.empty.saved")}</p>
            ) : (
              <ul className="space-y-2">
                {saved.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <span>
                      <span className="font-display text-lg">{s.origin}</span> → <span className="font-display text-lg">{s.destination}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{cityOf(s.origin)} • {cityOf(s.destination)}</span>
                    </span>
                    <button
                      onClick={() => setSaved(saved.filter((x) => x.id !== s.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-luxe rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gold" />
                <h2 className="font-display text-xl">{t("account.alerts")}</h2>
              </div>
              <Link to="/alerts" className="text-xs text-gold">Gerenciar →</Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("account.empty.alerts")}</p>
            ) : (
              <ul className="space-y-2">
                {alerts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <span>
                      <span className="font-display text-lg">{a.origin}</span> → <span className="font-display text-lg">{a.destination}</span>
                      <span className="ml-2 text-xs text-gold">≤ {formatBRL(a.targetPriceBRL)}</span>
                    </span>
                    <button
                      onClick={() => setAlerts(alerts.filter((x) => x.id !== a.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
