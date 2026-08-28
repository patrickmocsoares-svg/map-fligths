/**
 * Deterministic *estimated* flight offers for the promo showcase.
 *
 * These are clearly-labelled estimates used only to start a WhatsApp
 * conversation — never presented as bookable fares. Airline selection follows
 * the business rule: domestic routes only get Brazilian carriers, international
 * routes get carriers that actually serve that region.
 */
import { getDestination } from "@/lib/destinations";
import { airlinesForCatalogRegion, BR_DOMESTIC } from "@/lib/flights/airlines";

export type PromoOffer = {
  id: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  depart: string;
  arrive: string;
  durationLabel: string;
  stops: number;
  price: number;
  cabin: string;
};

function hash(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function isDomesticPromo(code: string) {
  return getDestination(code).region === "Brasil";
}

export function promoAirlines(code: string) {
  const d = getDestination(code);
  return d.region === "Brasil" ? BR_DOMESTIC : airlinesForCatalogRegion(d.region);
}

export function promoOffers(code: string, basePrice: number, salt = 0): PromoOffer[] {
  const rnd = hash(`${code}:${basePrice}:${salt}`);
  const airlines = promoAirlines(code);
  const domestic = isDomesticPromo(code);
  const count = Math.min(airlines.length, 4);

  return Array.from({ length: count }, (_, i) => {
    const airline = airlines[Math.floor(rnd() * airlines.length + i) % airlines.length];
    const depH = 5 + Math.floor(rnd() * 17);
    const depM = [0, 10, 25, 40, 55][Math.floor(rnd() * 5)];
    const baseMin = domestic ? 70 + Math.floor(rnd() * 180) : 560 + Math.floor(rnd() * 480);
    const stops = domestic
      ? rnd() > 0.65
        ? 1
        : 0
      : rnd() > 0.5
        ? 1
        : rnd() > 0.9
          ? 2
          : 0;
    const total = baseMin + stops * (domestic ? 70 : 160);
    const arr = (depH * 60 + depM + total) % 1440;
    const price = Math.round((basePrice * (0.92 + rnd() * 0.45)) / 10) * 10;

    return {
      id: `${code}-${airline.code}-${i}`,
      airlineCode: airline.code,
      airlineName: airline.name,
      flightNumber: `${airline.code} ${100 + Math.floor(rnd() * 8900)}`,
      depart: `${pad(depH)}:${pad(depM)}`,
      arrive: `${pad(Math.floor(arr / 60))}:${pad(arr % 60)}`,
      durationLabel: `${Math.floor(total / 60)}h ${pad(total % 60)}m`,
      stops,
      price,
      cabin: "Econômica",
    };
  }).sort((a, b) => a.price - b.price);
}
