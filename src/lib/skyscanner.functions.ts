import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SkyResult = {
  id: string;
  airline: string;
  price: number | null;
  currency: string;
  departureTime: string | null;
  arrivalTime: string | null;
  stops: number | null;
  durationMin: number | null;
};

const paramsSchema = z.object({
  origin: z.string().trim().min(3).max(3),
  destination: z.string().trim().min(3).max(3),
  date: z.string().trim().min(1),
  returnDate: z.string().trim().optional().default(""),
});

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/** Defensive normalizer — provider payload shapes vary between plans. */
function normalize(raw: unknown): SkyResult[] {
  const root = raw as Record<string, unknown> | null;
  if (!root) return [];
  const candidates =
    (Array.isArray(root["itineraries"]) && (root["itineraries"] as unknown[])) ||
    (Array.isArray(root["flights"]) && (root["flights"] as unknown[])) ||
    (Array.isArray(root["results"]) && (root["results"] as unknown[])) ||
    (Array.isArray(root["data"]) && (root["data"] as unknown[])) ||
    (Array.isArray((root["data"] as Record<string, unknown>)?.["itineraries"]) &&
      ((root["data"] as Record<string, unknown>)["itineraries"] as unknown[])) ||
    [];

  return (candidates as Record<string, unknown>[]).slice(0, 30).map((item, i) => {
    const leg =
      (Array.isArray(item["legs"]) && (item["legs"] as Record<string, unknown>[])[0]) ||
      (item["leg"] as Record<string, unknown>) ||
      item;
    const priceRaw = pick(item, ["price", "raw_price", "totalPrice", "minPrice"]);
    const price =
      typeof priceRaw === "number"
        ? priceRaw
        : typeof priceRaw === "object" && priceRaw
          ? Number(pick(priceRaw as Record<string, unknown>, ["raw", "amount", "value"]) ?? NaN)
          : Number(priceRaw ?? NaN);

    const carriers = (leg["carriers"] as Record<string, unknown>) ?? {};
    const marketing = Array.isArray(carriers["marketing"])
      ? (carriers["marketing"] as Record<string, unknown>[])[0]
      : undefined;

    const airline =
      (pick(item, ["airline", "carrier", "airlineName"]) as string) ??
      (marketing?.["name"] as string) ??
      (pick(leg, ["airline", "carrier"]) as string) ??
      "Companhia aérea";

    const durationRaw = pick(leg, ["durationInMinutes", "duration", "durationMin"]);

    return {
      id: String(pick(item, ["id", "itineraryId"]) ?? `sky-${i}`),
      airline: String(airline),
      price: Number.isFinite(price) ? price : null,
      currency: "BRL",
      departureTime: (pick(leg, ["departure", "departureTime", "departure_at"]) as string) ?? null,
      arrivalTime: (pick(leg, ["arrival", "arrivalTime", "arrival_at"]) as string) ?? null,
      stops: Number.isFinite(Number(pick(leg, ["stopCount", "stops", "transfers"])))
        ? Number(pick(leg, ["stopCount", "stops", "transfers"]))
        : null,
      durationMin: Number.isFinite(Number(durationRaw)) ? Number(durationRaw) : null,
    };
  });
}

export const searchSkyscannerFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => paramsSchema.parse(data))
  .handler(async ({ data }): Promise<{ results: SkyResult[]; error?: string }> => {
    const key = process.env["RAPIDAPI_KEY"];
    if (!key) return { results: [], error: "missing_credentials" };

    const url = new URL("https://skyscanner-flights4.p.rapidapi.com/api/v1/flights/search");
    url.searchParams.set("origin", data.origin.toUpperCase());
    url.searchParams.set("destination", data.destination.toUpperCase());
    url.searchParams.set("date", data.date);
    if (data.returnDate) url.searchParams.set("returnDate", data.returnDate);
    url.searchParams.set("adults", "1");
    url.searchParams.set("currency", "BRL");
    url.searchParams.set("country", "BR");
    url.searchParams.set("locale", "pt-BR");

    try {
      const res = await fetch(url, {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "skyscanner-flights4.p.rapidapi.com",
        },
      });
      if (!res.ok) return { results: [], error: `upstream_${res.status}` };
      const json = await res.json();
      return { results: normalize(json) };
    } catch {
      return { results: [], error: "network_error" };
    }
  });
