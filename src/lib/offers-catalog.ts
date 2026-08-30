/**
 * Curated commercial offers catalog (indicative pricing).
 *
 * These entries are NEVER presented as confirmed fares — every surface that
 * renders them must show the "Preço indicativo" label and the disclaimer from
 * `@/lib/brand`. They exist so the visitor always has a next action, even when
 * the flight providers return nothing.
 */
export type CatalogOffer = {
  /** Destination IATA code (also the photo key). */
  code: string;
  city: string;
  country: string;
  /** Default departure hub used in the route line. */
  origin: string;
  /** Indicative "a partir de" price in BRL. */
  priceFrom: number;
  scope: "national" | "international";
};

export const NATIONAL_OFFERS: CatalogOffer[] = [
  { code: "FLN", city: "Florianópolis", country: "Brasil", origin: "GRU", priceFrom: 349, scope: "national" },
  { code: "GIG", city: "Rio de Janeiro", country: "Brasil", origin: "GRU", priceFrom: 299, scope: "national" },
  { code: "SSA", city: "Salvador", country: "Brasil", origin: "GRU", priceFrom: 399, scope: "national" },
  { code: "REC", city: "Recife", country: "Brasil", origin: "GRU", priceFrom: 429, scope: "national" },
  { code: "FOR", city: "Fortaleza", country: "Brasil", origin: "GRU", priceFrom: 439, scope: "national" },
  { code: "BPS", city: "Porto Seguro", country: "Brasil", origin: "GRU", priceFrom: 379, scope: "national" },
  { code: "NAT", city: "Natal", country: "Brasil", origin: "GRU", priceFrom: 449, scope: "national" },
  { code: "MCZ", city: "Maceió", country: "Brasil", origin: "GRU", priceFrom: 419, scope: "national" },
  { code: "JPA", city: "João Pessoa", country: "Brasil", origin: "GRU", priceFrom: 459, scope: "national" },
  { code: "CWB", city: "Curitiba", country: "Brasil", origin: "GRU", priceFrom: 289, scope: "national" },
  { code: "BSB", city: "Brasília", country: "Brasil", origin: "GRU", priceFrom: 309, scope: "national" },
  { code: "CNF", city: "Belo Horizonte", country: "Brasil", origin: "GRU", priceFrom: 279, scope: "national" },
  { code: "IGU", city: "Foz do Iguaçu", country: "Brasil", origin: "GRU", priceFrom: 339, scope: "national" },
  { code: "POA", city: "Porto Alegre", country: "Brasil", origin: "GRU", priceFrom: 329, scope: "national" },
  { code: "VIX", city: "Vitória", country: "Brasil", origin: "GRU", priceFrom: 319, scope: "national" },
  { code: "GRU", city: "São Paulo", country: "Brasil", origin: "CNF", priceFrom: 259, scope: "national" },
];

export const INTERNATIONAL_OFFERS: CatalogOffer[] = [
  { code: "EZE", city: "Buenos Aires", country: "Argentina", origin: "GRU", priceFrom: 1099, scope: "international" },
  { code: "SCL", city: "Santiago", country: "Chile", origin: "GRU", priceFrom: 1349, scope: "international" },
  { code: "MVD", city: "Montevidéu", country: "Uruguai", origin: "GRU", priceFrom: 1249, scope: "international" },
  { code: "LIM", city: "Lima", country: "Peru", origin: "GRU", priceFrom: 1599, scope: "international" },
  { code: "BOG", city: "Bogotá", country: "Colômbia", origin: "GRU", priceFrom: 1699, scope: "international" },
  { code: "CUN", city: "Cancún", country: "México", origin: "GRU", priceFrom: 2499, scope: "international" },
  { code: "MIA", city: "Miami", country: "Estados Unidos", origin: "GRU", priceFrom: 2299, scope: "international" },
  { code: "MCO", city: "Orlando", country: "Estados Unidos", origin: "GRU", priceFrom: 2399, scope: "international" },
  { code: "JFK", city: "Nova York", country: "Estados Unidos", origin: "GRU", priceFrom: 2599, scope: "international" },
  { code: "LIS", city: "Lisboa", country: "Portugal", origin: "GRU", priceFrom: 2799, scope: "international" },
  { code: "MAD", city: "Madrid", country: "Espanha", origin: "GRU", priceFrom: 2899, scope: "international" },
  { code: "CDG", city: "Paris", country: "França", origin: "GRU", priceFrom: 3099, scope: "international" },
  { code: "FCO", city: "Roma", country: "Itália", origin: "GRU", priceFrom: 3199, scope: "international" },
  { code: "LHR", city: "Londres", country: "Reino Unido", origin: "GRU", priceFrom: 3299, scope: "international" },
  { code: "DXB", city: "Dubai", country: "Emirados Árabes", origin: "GRU", priceFrom: 3899, scope: "international" },
];

export const ALL_OFFERS: CatalogOffer[] = [...NATIONAL_OFFERS, ...INTERNATIONAL_OFFERS];

/** Deterministic rotation so the home page does not look static between visits. */
export function rotateOffers(list: CatalogOffer[], count: number, seed = new Date().getUTCDate()) {
  if (list.length === 0) return [];
  const start = seed % list.length;
  return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]!);
}
