/**
 * Development flight provider — realistic, deterministic offers.
 *
 * Used when no real upstream (Kiwi, Amadeus, ...) is configured. Unlike the
 * `mock` provider (which mirrors the local `DEALS` fixture), this one:
 *
 *   - synthesizes plausible offers for ANY origin/destination/date combo,
 *   - varies price/duration/stops by great-circle distance and cabin,
 *   - is deterministic per (route, date, cabin) so repeat searches are stable
 *     while still differing across routes,
 *   - writes each generated price into `price_history` so the MAB Score and
 *     opportunity discovery layers get populated automatically during dev.
 *
 * When a real provider (Kiwi) is configured, it takes precedence and this
 * adapter is never picked. The architecture stays ready to swap in real
 * upstreams with zero UI changes.
 */
import type {
  CabinClass,
  FlightItinerary,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
  FlightSegment,
} from "../types";
import type { FlightProvider } from "../provider";

const AIRLINES: { code: string; name: string; intl?: boolean }[] = [
  { code: "LA", name: "LATAM", intl: true },
  { code: "G3", name: "GOL" },
  { code: "AD", name: "Azul" },
  { code: "AA", name: "American Airlines", intl: true },
  { code: "UA", name: "United", intl: true },
  { code: "DL", name: "Delta", intl: true },
  { code: "AF", name: "Air France", intl: true },
  { code: "KL", name: "KLM", intl: true },
  { code: "IB", name: "Iberia", intl: true },
  { code: "TP", name: "TAP Portugal", intl: true },
  { code: "LH", name: "Lufthansa", intl: true },
  { code: "EK", name: "Emirates", intl: true },
];

// Rough coordinates for common IATA codes. Unknown airports fall back to a
// hash-derived pseudo-location so the generator still works for any code.
const COORDS: Record<string, [number, number]> = {
  GRU: [-23.43, -46.47], CGH: [-23.63, -46.65], VCP: [-23.01, -47.13],
  GIG: [-22.81, -43.25], SDU: [-22.91, -43.16], BSB: [-15.87, -47.92],
  CNF: [-19.63, -43.97], POA: [-30.0, -51.17], REC: [-8.13, -34.92],
  SSA: [-12.91, -38.33], FOR: [-3.78, -38.53], MAO: [-3.04, -60.05],
  FLN: [-27.67, -48.55], MIA: [25.79, -80.29], JFK: [40.64, -73.78],
  LAX: [33.94, -118.4], EWR: [40.69, -74.17], ORD: [41.98, -87.9],
  LIS: [38.77, -9.13], MAD: [40.47, -3.56], BCN: [41.3, 2.08],
  CDG: [49.01, 2.55], ORY: [48.72, 2.36], FCO: [41.8, 12.25],
  LHR: [51.47, -0.45], LGW: [51.15, -0.19], FRA: [50.03, 8.55],
  AMS: [52.31, 4.76], ZRH: [47.46, 8.55], EZE: [-34.82, -58.53],
  SCL: [-33.39, -70.79], BOG: [4.7, -74.14], LIM: [-12.02, -77.11],
  MEX: [19.44, -99.07], DXB: [25.25, 55.36], IST: [41.28, 28.75],
  DOH: [25.27, 51.61],
};

function hashCode(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function coordsFor(iata: string): [number, number] {
  const known = COORDS[iata];
  if (known) return known;
  const h = hashCode(iata);
  const lat = ((h % 140000) / 1000) - 70;   // -70..+70
  const lon = (((h >> 8) % 360000) / 1000) - 180; // -180..+180
  return [lat, lon];
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

const CABIN_MULT: Record<CabinClass, number> = {
  economy: 1,
  premium: 1.55,
  business: 2.9,
  first: 4.8,
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function buildSegment(
  airlineCode: string,
  airlineName: string,
  flightNo: string,
  origin: string,
  destination: string,
  depart: Date,
  durationMin: number,
  cabin: CabinClass,
): FlightSegment {
  const arr = new Date(depart.getTime() + durationMin * 60_000);
  return {
    airlineCode,
    airlineName,
    flightNumber: flightNo,
    originCode: origin,
    destinationCode: destination,
    departureTime: depart.toISOString(),
    arrivalTime: arr.toISOString(),
    durationMin,
    cabin,
  };
}

function buildItinerary(
  origin: string,
  destination: string,
  dateISO: string,
  hour: number,
  minute: number,
  totalMin: number,
  stops: number,
  airlineCode: string,
  airlineName: string,
  flightBase: number,
  cabin: CabinClass,
  rand: () => number,
): FlightItinerary {
  const dep = new Date(`${dateISO}T${pad(hour)}:${pad(minute)}:00Z`);
  const segments: FlightSegment[] = [];
  if (stops === 0) {
    segments.push(
      buildSegment(
        airlineCode,
        airlineName,
        String(flightBase),
        origin,
        destination,
        dep,
        totalMin,
        cabin,
      ),
    );
  } else {
    // Insert a plausible connection hub.
    const HUBS = ["GRU", "PTY", "BOG", "MIA", "LIS", "MAD", "CDG", "FRA", "IST"];
    const hub = HUBS[Math.floor(rand() * HUBS.length)];
    const layoverMin = 60 + Math.floor(rand() * 120);
    const legMin = Math.max(45, Math.floor((totalMin - layoverMin) / 2));
    const seg1 = buildSegment(
      airlineCode,
      airlineName,
      String(flightBase),
      origin,
      hub,
      dep,
      legMin,
      cabin,
    );
    const dep2 = new Date(new Date(seg1.arrivalTime).getTime() + layoverMin * 60_000);
    const seg2 = buildSegment(
      airlineCode,
      airlineName,
      String(flightBase + 1),
      hub,
      destination,
      dep2,
      totalMin - legMin - layoverMin,
      cabin,
    );
    segments.push(seg1, seg2);
  }
  return { durationMin: totalMin, stops, segments };
}

async function recordObservations(
  offers: FlightOffer[],
  params: FlightSearchParams,
): Promise<void> {
  if (offers.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = offers.map((o) => ({
      source: "dev",
      origin_iata: params.origin,
      destination_iata: params.destination,
      airline: o.airline.code || null,
      cabin: o.cabin,
      price: o.price,
      currency: o.currency,
      flight_date: params.departDate,
    }));
    await supabaseAdmin.from("price_history").insert(rows);
  } catch {
    // Non-fatal: history writes must never break the search.
  }
}

export const devProvider: FlightProvider = {
  id: "dev",
  label: "Development (synthetic)",
  real: false,

  // Always available — this is the development fallback.
  isConfigured: () => true,

  async status() {
    return {
      id: "dev",
      label: "Development (synthetic)",
      state: "connected",
      real: false,
      message: "Synthetic offers — enable a real provider for production.",
    };
  },


  async search(params: FlightSearchParams): Promise<FlightSearchResult> {
    const currency = params.currency ?? "BRL";
    const limit = Math.min(params.limit ?? 12, 15);

    const a = coordsFor(params.origin);
    const b = coordsFor(params.destination);
    const km = Math.max(120, distanceKm(a, b));
    const isIntl = km > 2500;

    // Cruise ~800 km/h + 40 min ground overhead.
    const baselineMin = Math.round((km / 800) * 60 + 40);
    // Base BRL price scales sub-linearly with distance.
    const baseBRL = Math.round(120 + Math.pow(km, 0.82) * 1.35);

    const seed = hashCode(`${params.origin}-${params.destination}-${params.departDate}-${params.cabin}`);
    const rand = mulberry32(seed);

    const eligible = AIRLINES.filter((al) => (isIntl ? true : !al.intl || al.code === "LA"));
    const offers: FlightOffer[] = [];

    for (let i = 0; i < limit; i++) {
      const al = eligible[Math.floor(rand() * eligible.length)];
      // Departures spread across the day, deterministic per index.
      const hour = 5 + Math.floor(rand() * 17);
      const minute = [0, 15, 30, 45][Math.floor(rand() * 4)];

      // Some offers are direct, others have 1 stop (more likely for long-haul).
      const stops = isIntl ? (rand() < 0.55 ? 0 : 1) : rand() < 0.85 ? 0 : 1;
      const stopPenalty = stops === 0 ? 1 : 1.18 + rand() * 0.15;
      const durationMin = Math.round(baselineMin * (0.95 + rand() * 0.15) * stopPenalty);

      // Price = base * cabin * pax * jitter, slightly cheaper for extra stops.
      const jitter = 0.75 + rand() * 0.5; // 0.75 .. 1.25
      const stopDiscount = stops === 0 ? 1 : 0.88;
      const price = Math.round(
        baseBRL * CABIN_MULT[params.cabin] * Math.max(1, params.passengers) * jitter * stopDiscount,
      );

      const outbound = buildItinerary(
        params.origin,
        params.destination,
        params.departDate,
        hour,
        minute,
        durationMin,
        stops,
        al.code,
        al.name,
        1000 + Math.floor(rand() * 8999),
        params.cabin,
        rand,
      );

      let ret: FlightItinerary | undefined;
      if (params.returnDate) {
        const rHour = 6 + Math.floor(rand() * 16);
        const rMin = [0, 15, 30, 45][Math.floor(rand() * 4)];
        ret = buildItinerary(
          params.destination,
          params.origin,
          params.returnDate,
          rHour,
          rMin,
          Math.round(durationMin * (0.95 + rand() * 0.1)),
          stops,
          al.code,
          al.name,
          1000 + Math.floor(rand() * 8999),
          params.cabin,
          rand,
        );
      }

      const head = outbound.segments[0];
      const tail = outbound.segments[outbound.segments.length - 1];

      // Miles alternative for a subset of offers (economy/business only).
      const miles =
        rand() < 0.35
          ? Math.round((price / (params.cabin === "business" ? 55 : 40)) * 1000)
          : undefined;

      offers.push({
        id: `dev-${seed.toString(36)}-${i}`,
        provider: "dev",
        airline: { code: al.code, name: al.name },
        flightNumber: head.flightNumber,
        departureTime: head.departureTime,
        arrivalTime: tail.arrivalTime,
        durationMin: outbound.durationMin,
        stops: outbound.stops,
        outbound,
        return: ret,
        price,
        currency,
        cabin: params.cabin,
        miles,
      });
    }

    offers.sort((x, y) => x.price - y.price);

    // Feed the deals intelligence layer so MAB Score + opportunities populate
    // automatically during development. Errors are swallowed inside.
    await recordObservations(offers, params);

    return {
      provider: "dev",
      searchedAt: new Date().toISOString(),
      params,
      currency,
      offers,
    };
  },
};
