/**
 * Scheduled hook: MAB Opportunity Discovery sweep.
 *
 * Called by pg_cron (see the accompanying schedule migration). Authenticated
 * with a dedicated server-side secret (`DISCOVERY_HOOK_SECRET`) sent in the
 * `x-discovery-secret` header — never the public publishable key.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  regions: z.array(z.enum(["domestic", "south_america", "usa", "europe"])).optional(),
  cabin: z.enum(["economy", "premium", "business", "first"]).optional().default("economy"),
  horizons: z.array(z.number().int().min(1).max(365)).optional(),
  maxRoutes: z.number().int().min(1).max(200).optional().default(60),
});

export const Route = createFileRoute("/api/public/hooks/discover-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { isValidHookSecret } = await import("@/lib/security/guards.server");
        const provided =
          request.headers.get("x-discovery-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          null;

        if (!isValidHookSecret(provided)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let raw: unknown = {};
        try {
          raw = await request.json();
        } catch {
          raw = {};
        }

        const parsed = bodySchema.safeParse(raw ?? {});
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "invalid_request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { runDiscoverySweep } = await import("@/lib/discovery/sweep.server");
          const report = await runDiscoverySweep(parsed.data);
          return new Response(JSON.stringify({ ok: true, report }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[discover-prices] sweep failed", err);
          return new Response(JSON.stringify({ ok: false, error: "sweep_failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
