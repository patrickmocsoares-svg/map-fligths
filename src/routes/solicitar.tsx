import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { createOrderFn } from "@/lib/orders.functions";
import {
  CABINS,
  CABIN_LABELS,
  orderRequestSchema,
  type OrderCreated,
  type OrderRequestInput,
} from "@/lib/orders/schema";
import { whatsappLink, SUPPORT_HOURS } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/solicitar")({
  head: () => ({
    meta: [
      { title: "Solicitar orçamento de passagem com milhas | TRIPmoc" },
      {
        name: "description",
        content:
          "Envie sua solicitação de emissão com milhas. Nossa equipe cota as melhores opções e responde em até 1 hora no horário de atendimento.",
      },
      { property: "og:title", content: "Solicitar orçamento com milhas — TRIPmoc" },
      {
        property: "og:description",
        content:
          "Conte para onde quer ir e nossa equipe monta o melhor caminho em milhas, com orçamento confirmado por especialistas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestPage,
});

type Errors = Partial<Record<string, string>>;

const emptyForm: OrderRequestInput = {
  fullName: "",
  email: "",
  phone: "",
  origin: "",
  destination: "",
  departDate: "",
  returnDate: "",
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "economy",
  preferredAirline: "",
  preferredProgram: "",
  flexibleDates: false,
  budgetBRL: undefined,
  notes: "",
};

const fieldBase =
  "w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-border";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      {children}
      {required ? <span className="text-brand"> *</span> : null}
    </span>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-destructive">{msg}</p>;
}

function RequestPage() {
  const submitOrder = useServerFn(createOrderFn);
  const [form, setForm] = useState<OrderRequestInput>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<OrderCreated | null>(null);
  const { settings } = useSettings();

  const waNumber = settings?.whatsappNumber;

  function quoteMessage(data: OrderCreated, f: OrderRequestInput) {
    const s = data.summary;
    const pax =
      `${s.adults} adulto(s)` +
      (s.children ? `, ${s.children} criança(s)` : "") +
      (s.infants ? `, ${s.infants} bebê(s)` : "");
    return [
      "Olá! Recebemos uma nova solicitação de orçamento através do TRIPmoc.",
      "",
      `Protocolo: ${data.protocol}`,
      `Cliente: ${f.fullName}`,
      `E-mail: ${f.email}`,
      `WhatsApp: ${f.phone}`,
      `Origem: ${s.origin}`,
      `Destino: ${s.destination}`,
      `Data de ida: ${s.departDate}`,
      `Data de volta: ${s.returnDate ?? "Somente ida"}`,
      `Passageiros: ${pax}`,
      `Classe: ${CABIN_LABELS[s.cabin as keyof typeof CABIN_LABELS] ?? s.cabin}`,
      f.notes ? `Observações: ${f.notes}` : "",
      "",
      "Solicitação de orçamento enviada pelo site.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const mutation = useMutation({
    mutationFn: (payload: unknown) => submitOrder({ data: payload as never }),
    onSuccess: (data) => {
      const created = data as OrderCreated;
      setResult(created);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.open(whatsappLink(quoteMessage(created, form), waNumber), "_blank", "noopener");
      }
    },
  });

  function set<K extends keyof OrderRequestInput>(key: K, value: OrderRequestInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = orderRequestSchema.safeParse({
      ...form,
      returnDate: form.returnDate || undefined,
      budgetBRL: form.budgetBRL === undefined || Number.isNaN(form.budgetBRL) ? undefined : form.budgetBRL,
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const wa = useMemo(() => {
    if (!result)
      return whatsappLink(
        "Olá! Gostaria de solicitar um orçamento de passagem com milhas.",
        waNumber,
      );
    return whatsappLink(quoteMessage(result, form), waNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, form, waNumber]);


  if (result) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
          <div className="animate-rise rounded-3xl border border-border bg-card/50 p-7 md:p-10">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cta text-primary-foreground shadow-luxe">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Solicitação recebida com sucesso.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Nossa equipe analisará as informações fornecidas e preparará seu orçamento de
              acordo com os dados da sua viagem.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Após a análise, o orçamento será encaminhado ao e-mail informado e também
              disponibilizado por meio do WhatsApp para maior comodidade.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Agradecemos por escolher a TRIPmoc.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/80">
              Atendimento: {settings?.businessHours ?? SUPPORT_HOURS}
            </p>


            <div className="mt-8 rounded-2xl border border-border bg-background/50 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Protocolo
              </div>
              <div className="mt-1 font-display text-2xl font-bold tracking-tight text-brand">
                {result.protocol}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/50 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Resumo da viagem
              </div>
              <div className="mt-3 flex items-center gap-3 font-display text-xl font-semibold">
                {result.summary.origin}
                <Plane className="h-4 w-4 text-brand" />
                {result.summary.destination}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Ida</dt>
                  <dd>{result.summary.departDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Volta</dt>
                  <dd>{result.summary.returnDate ?? "Somente ida"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Passageiros</dt>
                  <dd>
                    {result.summary.adults} adulto(s)
                    {result.summary.children ? `, ${result.summary.children} criança(s)` : ""}
                    {result.summary.infants ? `, ${result.summary.infants} bebê(s)` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Classe</dt>
                  <dd>{CABIN_LABELS[result.summary.cabin as keyof typeof CABIN_LABELS]}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cta px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
              <Link
                to="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
        <div className="max-w-2xl animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-brand">
            <Sparkles className="h-3 w-3" /> Emissão com milhas
          </div>
          <h1 className="mt-5 font-display text-[2.2rem] font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Solicitar <span className="font-serif font-normal text-brand">orçamento</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Conte para onde quer ir. Nossa equipe cota as melhores combinações em milhas e
            confirma o valor final com você — sem cobrança automática e sem compromisso.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-9 animate-rise rounded-3xl border border-border bg-card/40 p-6 md:p-8"
          style={{ animationDelay: "100ms" }}
        >
          {/* Contato */}
          <h2 className="font-display text-lg font-semibold">Seus dados</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label required>Nome completo</Label>
              <input
                className={fieldBase}
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Maria Almeida"
                autoComplete="name"
              />
              <ErrorText msg={errors.fullName} />
            </div>
            <div>
              <Label required>Telefone / WhatsApp</Label>
              <input
                className={fieldBase}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
              <ErrorText msg={errors.phone} />
            </div>
            <div>
              <Label required>E-mail</Label>
              <input
                className={fieldBase}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="voce@email.com"
                inputMode="email"
                autoComplete="email"
              />
              <ErrorText msg={errors.email} />
            </div>
          </div>

          {/* Viagem */}
          <h2 className="mt-10 font-display text-lg font-semibold">Sua viagem</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <Label required>Origem</Label>
              <AirportAutocomplete
                label=""
                value={form.origin}
                onChange={(code) => set("origin", code)}
                icon={<MapPin className="h-4 w-4" />}
                placeholder="Cidade, aeroporto ou IATA"
              />
              <ErrorText msg={errors.origin} />
            </div>
            <div>
              <Label required>Destino</Label>
              <AirportAutocomplete
                label=""
                value={form.destination}
                onChange={(code) => set("destination", code)}
                icon={<MapPin className="h-4 w-4" />}
                placeholder="Cidade, aeroporto ou IATA"
              />
              <ErrorText msg={errors.destination} />
            </div>
            <div>
              <Label required>Data de ida</Label>
              <input
                type="date"
                className={fieldBase}
                value={form.departDate}
                onChange={(e) => set("departDate", e.target.value)}
              />
              <ErrorText msg={errors.departDate} />
            </div>
            <div>
              <Label>Data de volta (opcional)</Label>
              <input
                type="date"
                className={fieldBase}
                value={form.returnDate ?? ""}
                onChange={(e) => set("returnDate", e.target.value)}
              />
              <ErrorText msg={errors.returnDate} />
            </div>
            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <div>
                <Label required>Adultos</Label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  className={fieldBase}
                  value={form.adults}
                  onChange={(e) => set("adults", Number(e.target.value))}
                />
                <ErrorText msg={errors.adults} />
              </div>
              <div>
                <Label>Crianças</Label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  className={fieldBase}
                  value={form.children ?? 0}
                  onChange={(e) => set("children", Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Bebês</Label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  className={fieldBase}
                  value={form.infants ?? 0}
                  onChange={(e) => set("infants", Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label required>Classe</Label>
              <select
                className={fieldBase}
                value={form.cabin}
                onChange={(e) => set("cabin", e.target.value as OrderRequestInput["cabin"])}
              >
                {CABINS.map((c) => (
                  <option key={c} value={c} className="bg-background">
                    {CABIN_LABELS[c]}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.cabin} />
            </div>
            <div>
              <Label>Orçamento estimado (R$)</Label>
              <input
                type="number"
                min={0}
                className={fieldBase}
                value={form.budgetBRL ?? ""}
                onChange={(e) =>
                  set("budgetBRL", e.target.value === "" ? undefined : Number(e.target.value))
                }
                placeholder="3000"
              />
            </div>
          </div>

          {/* Preferências */}
          <h2 className="mt-10 font-display text-lg font-semibold">Preferências (opcional)</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <Label>Companhia preferida</Label>
              <input
                className={fieldBase}
                value={form.preferredAirline ?? ""}
                onChange={(e) => set("preferredAirline", e.target.value)}
                placeholder="LATAM, GOL, Azul…"
              />
            </div>
            <div>
              <Label>Programa de milhas preferido</Label>
              <input
                className={fieldBase}
                value={form.preferredProgram ?? ""}
                onChange={(e) => set("preferredProgram", e.target.value)}
                placeholder="Smiles, Latam Pass, TudoAzul…"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3.5 md:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[color:var(--cta)]"
                checked={Boolean(form.flexibleDates)}
                onChange={(e) => set("flexibleDates", e.target.checked)}
              />
              <span className="text-sm">
                Tenho flexibilidade de datas (posso viajar alguns dias antes ou depois)
              </span>
            </label>
            <div className="md:col-span-2">
              <Label>Observações</Label>
              <textarea
                rows={4}
                className={`${fieldBase} resize-y`}
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Conte detalhes que ajudem na cotação: bagagem, horários, milhas que já possui…"
              />
            </div>
          </div>

          {mutation.isError ? (
            <div className="mt-7 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Não conseguimos enviar sua solicitação agora. Tente novamente em instantes.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cta px-8 py-4 text-sm font-semibold text-primary-foreground shadow-luxe transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                Enviar solicitação <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            Seus dados são usados apenas para elaborar o orçamento. Resposta em até 1 hora no
            horário de atendimento.
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
