/**
 * Scheduled hook: MAB Opportunity Discovery sweep.
 *
 * Called by pg_cron (see the accompanying schedule migration). Runs the
 * discovery sweep across popular Brazil-origin routes and returns a JSON
 * report. Authenticated with the Supabase publishable key via `apikey`
 * header — no custom shared secret needed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { runDiscoverySweepFn } from "@/lib/discovery.functions";

export const Route = createFileRoute("/api/public/hooks/discover-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        if (!apiKey || apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          body = {};
        }
        try {
          const report = await runDiscoverySweepFn({ data: body });
          return new Response(JSON.stringify({ ok: true, report }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: (err as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
