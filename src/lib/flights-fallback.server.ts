import type { FlightSearchParams } from "./flights/types";

export async function searchFlightsWithFallback(data: FlightSearchParams) {
  try {
    const { searchSkyscanner } = await import("./flights/providers/skyscanner.server");
    const result = await searchSkyscanner(data);
    if (result.offers.length > 0) return { ...result, source: "real" as const };
  } catch (error) {
    console.error("[flights-fallback] skyscanner failed", error);
  }

  try {
    const { searchFlights } = await import("./flights");
    const result = await searchFlights(data);
    if (result.offers.length > 0) return { ...result, source: "real" as const };
  } catch (error) {
    console.error("[flights-fallback] real provider failed", error);
  }

  try {
    const { devProvider } = await import("./flights/providers/dev");
    const result = await devProvider.search(data);
    if (result.offers.length > 0) return { ...result, source: "estimated" as const };
  } catch (error) {
    console.error("[flights-fallback] estimated provider failed", error);
  }

  return {
    provider: "none",
    searchedAt: new Date().toISOString(),
    params: data,
    currency: data.currency ?? "BRL",
    offers: [],
    source: "none" as const,
  };
}