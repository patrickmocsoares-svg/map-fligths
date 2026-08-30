/**
 * Server-only implementation of the MAB Opportunity Discovery sweep.
 *
 * Kept out of `*.functions.ts` so that trusted callers (the authenticated
 * admin server function and the secret-protected cron hook) share one code
 * path, and so the sweep can never be triggered by an unauthenticated
 * client RPC.
 */
import { POPULAR_ROUTES, SWEEP_HORIZONS_DAYS, type RouteRegion } from "./popular-routes";

export type SweepInput = {
  regions?: RouteRegion[];
  cabin: "economy" | "premium" | "business" | "first";
  horizons?: number[];
  maxRoutes: number;
};

export type SweepReport = {
  startedAt: string;
  finishedAt: string;
  provider: string;
  routesRequested: number;
  routesSucceeded: number;
  observations: number;
  failures: { origin: string; destination: string; date: string; error: string }[];
};

function toIsoDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export async function runDiscoverySweep(data: SweepInput): Promise<SweepReport> {
  const { searchFlights } = await import("../flights");
  const startedAt = new Date().toISOString();

  const regions = new Set<RouteRegion>(
    data.regions ?? ["domestic", "south_america", "usa", "europe"],
  );
  const horizons = data.horizons ?? SWEEP_HORIZONS_DAYS;
  const routes = POPULAR_ROUTES.filter((r) => regions.has(r.region)).slice(0, data.maxRoutes);

  const failures: SweepReport["failures"] = [];
  let observations = 0;
  let routesSucceeded = 0;
  let provider = "unknown";

  for (const route of routes) {
    for (const days of horizons) {
      const departDate = toIsoDate(days);
      try {
        const result = await searchFlights({
          origin: route.origin,
          destination: route.destination,
          departDate,
          passengers: 1,
          cabin: data.cabin,
          limit: 10,
        });
        provider = result.provider;
        observations += result.offers.length;
        if (result.offers.length > 0) routesSucceeded++;
      } catch (err) {
        failures.push({
          origin: route.origin,
          destination: route.destination,
          date: departDate,
          error: (err as Error).message.slice(0, 200),
        });
      }
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    provider,
    routesRequested: routes.length * horizons.length,
    routesSucceeded,
    observations,
    failures,
  };
}
