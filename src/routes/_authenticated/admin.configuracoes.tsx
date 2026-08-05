import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPublicSettingsFn, updateSettingsFn } from "@/lib/settings.functions";
import { DEFAULT_MILES_SETTINGS, quoteMiles, type MilesSettings } from "@/lib/miles";
import { formatBRL, formatMiles } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações de milhas — MAB Flights" },
      { name: "description", content: "Parâmetros de precificação em milhas e canais de contato." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell>
      <SettingsPage />
    </AdminShell>
  ),
});

const field =
  "w-full rounded-xl border border-white/10 bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold/50";

function SettingsPage() {
  const fetchSettings = useServerFn(getPublicSettingsFn);
  const save = useServerFn(updateSettingsFn);
  const queryClient = useQueryClient();

  const q = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });
  const [form, setForm] = useState<MilesSettings>(DEFAULT_MILES_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const mutation = useMutation({
    mutationFn: (payload: MilesSettings) => save({ data: payload as never }),
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["settings"], data);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => setError((e as Error).message),
  });

  function set<K extends keyof MilesSettings>(key: K, value: MilesSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const preview = quoteMiles(2000, form);

  if (q.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Parâmetros usados para estimar o preço em milhas em todo o site.
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-card/40 p-5">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gold">
            Motor de precificação
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Custo por milha (R$)"
              hint="Quanto pagamos por milha comprada."
            >
              <input
                className={field}
                type="number"
                step="0.001"
                value={form.costPerMile}
                onChange={(e) => set("costPerMile", Number(e.target.value))}
              />
            </Field>
            <Field
              label="Valor de referência da milha (R$)"
              hint="Converte a tarifa em dinheiro para milhas necessárias."
            >
              <input
                className={field}
                type="number"
                step="0.001"
                value={form.mileValueRef}
                onChange={(e) => set("mileValueRef", Number(e.target.value))}
              />
            </Field>
            <Field label="Markup fixo (R$)" hint="Nossa margem por emissão.">
              <input
                className={field}
                type="number"
                step="1"
                value={form.markupFixed}
                onChange={(e) => set("markupFixed", Number(e.target.value))}
              />
            </Field>
            <Field label="Taxa de embarque (R$)" hint="Média cobrada por passageiro.">
              <input
                className={field}
                type="number"
                step="1"
                value={form.airportTax}
                onChange={(e) => set("airportTax", Number(e.target.value))}
              />
            </Field>
          </div>

          <h2 className="mb-4 mt-8 text-[10px] uppercase tracking-[0.24em] text-gold">
            Canais de atendimento
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp (somente dígitos)" hint="Ex: 5511999999999">
              <input
                className={field}
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="E-mail de contato">
              <input
                className={field}
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Horário de atendimento">
                <input
                  className={field}
                  value={form.businessHours}
                  onChange={(e) => set("businessHours", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe disabled:opacity-60"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar configurações
          </button>
          {mutation.isSuccess ? (
            <p className="mt-2 text-center text-xs text-emerald-300">Configurações salvas.</p>
          ) : null}
          {error ? <p className="mt-2 text-center text-xs text-destructive">{error}</p> : null}
        </section>

        <section className="h-fit rounded-2xl border border-gold/20 bg-card/40 p-5">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gold">
            Simulação · tarifa de {formatBRL(2000)}
          </h2>
          <dl className="space-y-2 text-sm">
            <Line label="Milhas necessárias" value={`${formatMiles(preview.milesRequired)} milhas`} />
            <Line label="Custo das milhas" value={formatBRL(preview.milesCost)} />
            <Line label="Markup" value={formatBRL(preview.markup)} />
            <Line label="Taxa de embarque" value={formatBRL(preview.airportTax)} />
          </dl>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Preço ao cliente
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold tracking-tight text-gold">
              {formatBRL(preview.clientPrice)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {preview.noSaving
                ? "Sem economia com esses parâmetros."
                : `Economia de ${formatBRL(preview.savings)} (${preview.savingsPct}%)`}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground/70">{hint}</span> : null}
    </label>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
