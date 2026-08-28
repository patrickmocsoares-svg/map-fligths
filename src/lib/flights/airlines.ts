/**
 * Airline eligibility rules for synthetic (estimated) offers.
 *
 * Rule requested by the business:
 *   - Domestic route (both airports in Brazil) → only Brazilian carriers.
 *   - International route → carriers that actually fly to that region,
 *     plus the Brazilian long-haul carriers when they serve it.
 */

export type SimpleAirline = { code: string; name: string };

/** Main Brazilian commercial airports (IATA). */
export const BR_AIRPORTS = new Set([
  "GRU", "CGH", "VCP", "GIG", "SDU", "BSB", "CNF", "PLU", "POA", "CWB",
  "FLN", "NVT", "JOI", "IGU", "LDB", "MGF", "REC", "SSA", "FOR", "NAT",
  "MCZ", "AJU", "JPA", "THE", "SLZ", "BEL", "MAO", "PVH", "RBR", "BVB",
  "MCP", "CGB", "CGR", "GYN", "UDI", "UBA", "RAO", "SJP", "BPS", "IOS",
  "PMW", "STM", "JDO", "PNZ", "VIX", "MOC", "IPN", "CXJ", "PET", "URG",
  "FEN", "CFB", "SJK", "QSC", "AFL", "ARU",
]);

/** Brazilian domestic carriers — the ONLY ones allowed on domestic routes. */
export const BR_DOMESTIC: SimpleAirline[] = [
  { code: "LA", name: "LATAM Airlines Brasil" },
  { code: "G3", name: "GOL Linhas Aéreas" },
  { code: "AD", name: "Azul Linhas Aéreas" },
];

/** Brazilian carriers with long-haul / regional international operations. */
const BR_INTERNATIONAL: SimpleAirline[] = [
  { code: "LA", name: "LATAM Airlines" },
  { code: "G3", name: "GOL Linhas Aéreas" },
  { code: "AD", name: "Azul Linhas Aéreas" },
];

type Region =
  | "south-america"
  | "north-america"
  | "europe"
  | "middle-east"
  | "africa"
  | "asia"
  | "oceania";

/** Carriers that credibly serve each region from Brazil. */
const REGION_AIRLINES: Record<Region, SimpleAirline[]> = {
  "south-america": [
    { code: "AR", name: "Aerolíneas Argentinas" },
    { code: "AV", name: "Avianca" },
    { code: "CM", name: "Copa Airlines" },
    { code: "H2", name: "SKY Airline" },
    { code: "JA", name: "JetSMART" },
  ],
  "north-america": [
    { code: "AA", name: "American Airlines" },
    { code: "UA", name: "United Airlines" },
    { code: "DL", name: "Delta Air Lines" },
    { code: "CM", name: "Copa Airlines" },
    { code: "AC", name: "Air Canada" },
    { code: "AM", name: "Aeroméxico" },
  ],
  europe: [
    { code: "TP", name: "TAP Air Portugal" },
    { code: "IB", name: "Iberia" },
    { code: "AF", name: "Air France" },
    { code: "KL", name: "KLM" },
    { code: "LH", name: "Lufthansa" },
    { code: "BA", name: "British Airways" },
    { code: "AZ", name: "ITA Airways" },
    { code: "IB", name: "Iberia" },
    { code: "UX", name: "Air Europa" },
    { code: "TK", name: "Turkish Airlines" },
  ],
  "middle-east": [
    { code: "EK", name: "Emirates" },
    { code: "QR", name: "Qatar Airways" },
    { code: "EY", name: "Etihad Airways" },
    { code: "TK", name: "Turkish Airlines" },
  ],
  africa: [
    { code: "ET", name: "Ethiopian Airlines" },
    { code: "SA", name: "South African Airways" },
    { code: "RAM", name: "Royal Air Maroc" },
    { code: "TP", name: "TAP Air Portugal" },
  ],
  asia: [
    { code: "EK", name: "Emirates" },
    { code: "QR", name: "Qatar Airways" },
    { code: "TK", name: "Turkish Airlines" },
    { code: "LH", name: "Lufthansa" },
    { code: "AF", name: "Air France" },
  ],
  oceania: [
    { code: "QF", name: "Qantas" },
    { code: "LA", name: "LATAM Airlines" },
    { code: "EK", name: "Emirates" },
    { code: "QR", name: "Qatar Airways" },
  ],
};

/** Region inference from destination coordinates (lat, lon). */
export function regionFromCoords([lat, lon]: [number, number]): Region {
  if (lon >= -95 && lon <= -30 && lat < 13) return "south-america";
  if (lat >= 13 && lon <= -30) return "north-america";
  if (lon > -30 && lon < 40 && lat > 34) return "europe";
  if (lon >= 32 && lon <= 65 && lat >= 12 && lat <= 42) return "middle-east";
  if (lon > -20 && lon < 52 && lat <= 34) return "africa";
  if (lon > 110 && lat < -10) return "oceania";
  return "asia";
}

export function isDomesticRoute(origin: string, destination: string): boolean {
  return BR_AIRPORTS.has(origin.toUpperCase()) && BR_AIRPORTS.has(destination.toUpperCase());
}

/**
 * Airlines eligible for a synthetic offer on this route.
 * Domestic → LATAM / GOL / Azul only. International → region-consistent mix.
 */
export function eligibleAirlines(
  origin: string,
  destination: string,
  destCoords: [number, number],
): SimpleAirline[] {
  if (isDomesticRoute(origin, destination)) return BR_DOMESTIC;
  const region = regionFromCoords(destCoords);
  const pool = [...BR_INTERNATIONAL, ...REGION_AIRLINES[region]];
  // De-duplicate by code, keeping first occurrence.
  const seen = new Set<string>();
  return pool.filter((a) => (seen.has(a.code) ? false : (seen.add(a.code), true)));
}
