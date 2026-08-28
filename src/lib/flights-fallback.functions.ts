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

export const searchFlightsFallbackFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      origin: z.string().length(3),
      destination: z.string().length(3),
      departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      passengers: z.number().int().min(1).max(9),
      cabin: z.enum(["economy", "premium", "business", "first"]),
      currency: z.string().length(3).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { searchFlightsWithFallback } = await import("./flights-fallback.server");
    return searchFlightsWithFallback(data);
  });

