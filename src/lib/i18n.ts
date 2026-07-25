export type Locale = "pt-BR" | "en" | "es" | "fr" | "it";

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

type Dict = Record<string, string>;

const ptBR: Dict = {
  "brand.name": "MAB Flights",
  "brand.slogan": "Transformando milhas em oportunidades.",
  "nav.home": "Início",
  "nav.deals": "Ofertas",
  "nav.opportunities": "Oportunidades do dia",
  "nav.alerts": "Alertas de preço",
  "nav.account": "Minha conta",
  "nav.search": "Buscar voos",
  "search.title": "Encontre a próxima oportunidade",
  "search.subtitle": "Compare passagens, milhas e ofertas em tempo real.",
  "search.origin": "Origem",
  "search.destination": "Destino",
  "search.depart": "Ida",
  "search.return": "Volta",
  "search.passengers": "Passageiros",
  "search.cabin": "Classe",
  "search.cta": "Buscar voos",
  "search.oneway": "Só ida",
  "search.roundtrip": "Ida e volta",
  "cabin.economy": "Econômica",
  "cabin.premium": "Premium Economy",
  "cabin.business": "Executiva",
  "cabin.first": "Primeira Classe",
  "deals.domestic": "Melhores ofertas no Brasil",
  "deals.international": "Melhores ofertas internacionais",
  "deals.miles": "Achados com milhas",
  "deals.viewAll": "Ver todas",
  "deal.savings": "Economia estimada",
  "deal.discount": "de desconto",
  "score.excellent": "Excelente oportunidade",
  "score.good": "Boa oportunidade",
  "score.normal": "Preço normal",
  "score.label": "MAB Score",
  "flight.duration": "Duração",
  "flight.stops": "Paradas",
  "flight.direct": "Direto",
  "flight.stop": "parada",
  "flight.stops_plural": "paradas",
  "flight.book": "Reservar agora",
  "flight.save": "Salvar rota",
  "flight.alert": "Criar alerta",
  "flight.history": "Histórico de preços",
  "flight.avgPrice": "Preço médio",
  "flight.currentPrice": "Preço atual",
  "account.title": "Minha conta",
  "account.saved": "Rotas favoritas",
  "account.alerts": "Meus alertas",
  "account.empty.saved": "Você ainda não salvou nenhuma rota.",
  "account.empty.alerts": "Você ainda não criou alertas de preço.",
  "alerts.title": "Alertas de preço",
  "alerts.subtitle": "Seja avisado quando o preço cair.",
  "alerts.create": "Criar alerta",
  "alerts.target": "Preço-alvo",
  "alerts.remove": "Remover",
  "results.title": "Resultados da busca",
  "results.found": "voos encontrados",
  "results.sort": "Ordenar por",
  "results.sort.price": "Menor preço",
  "results.sort.score": "Melhor MAB Score",
  "results.sort.duration": "Menor duração",
  "footer.tagline": "Sua próxima viagem começa aqui.",
  "misc.from": "a partir de",
  "misc.perPax": "por passageiro",
  "misc.miles": "milhas",
};

// Placeholder dictionaries — real translations to be provided per locale.
const en: Dict = { ...ptBR };
const es: Dict = { ...ptBR };
const fr: Dict = { ...ptBR };
const it: Dict = { ...ptBR };

const DICTS: Record<Locale, Dict> = { "pt-BR": ptBR, en, es, fr, it };

let currentLocale: Locale = DEFAULT_LOCALE;

export function setLocale(l: Locale) {
  currentLocale = l;
  if (typeof window !== "undefined") localStorage.setItem("mab_locale", l);
}
export function getLocale(): Locale {
  if (typeof window !== "undefined") {
    const s = localStorage.getItem("mab_locale") as Locale | null;
    if (s && DICTS[s]) currentLocale = s;
  }
  return currentLocale;
}
export function t(key: string): string {
  return DICTS[getLocale()][key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
}

export function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}
export function formatMiles(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}
