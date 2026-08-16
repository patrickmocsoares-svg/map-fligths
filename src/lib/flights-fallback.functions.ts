/**
 * Flight search with provider fallback.
 *
 * 1. Tries the Skyscanner Flights4 (RapidAPI) endpoint.
 * 2. On error, non-OK status or empty list, falls back to the already
 *    connected provider layer (Travelpayouts and friends).
 *
 * Runs server-side only so the RapidAPI key is never exposed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const cabin = z.enum(["economy", "premium", "business", "first"]);

const schema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().int().min(1).max(9),
  cabin,
  currency: z.string().length(3).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const searchFlightsFallbackFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { searchSkyscanner } = await import("./flights/providers/skyscanner.server");
    const skyscanner = await searchSkyscanner(data);
    if (skyscanner.offers.length > 0) return skyscanner;

    const { searchFlights } = await import("./flights");
    return searchFlights(data);
  });
