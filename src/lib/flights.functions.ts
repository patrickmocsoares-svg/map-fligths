/**
 * Server-function entry point for flight search.
 *
 * The UI (loader or component) calls `searchFlightsFn` via `useServerFn`.
 * Provider selection and secret handling live server-side.
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

export const searchFlightsFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    // Import inside the handler so providers (which may reference server-only
    // envs / SDKs) don't leak into the client bundle.
    const { searchFlights } = await import("./flights");
    return searchFlights(data);
  });
