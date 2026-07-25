import { createFileRoute } from "@tanstack/react-router";

// Temporary one-shot seed endpoint. Delete after seeding.
export const Route = createFileRoute("/api/public/seed-airports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("key") !== "seed-mab-2026") {
          return new Response("forbidden", { status: 403 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const [airportsCsv, countriesCsv] = await Promise.all([
          fetch("https://davidmegginson.github.io/ourairports-data/airports.csv").then((r) => r.text()),
          fetch("https://davidmegginson.github.io/ourairports-data/countries.csv").then((r) => r.text()),
        ]);

        const parseCsv = (txt: string): string[][] => {
          const rows: string[][] = [];
          let cur: string[] = [];
          let field = "";
          let inQ = false;
          for (let i = 0; i < txt.length; i++) {
            const c = txt[i];
            if (inQ) {
              if (c === '"') {
                if (txt[i + 1] === '"') { field += '"'; i++; } else inQ = false;
              } else field += c;
            } else {
              if (c === '"') inQ = true;
              else if (c === ",") { cur.push(field); field = ""; }
              else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
              else if (c === "\r") { /* skip */ }
              else field += c;
            }
          }
          if (field.length || cur.length) { cur.push(field); rows.push(cur); }
          return rows;
        };

        const cRows = parseCsv(countriesCsv);
        const cHead = cRows[0];
        const cCodeI = cHead.indexOf("code");
        const cNameI = cHead.indexOf("name");
        const countries = new Map<string, string>();
        for (let i = 1; i < cRows.length; i++) {
          const r = cRows[i];
          if (r[cCodeI]) countries.set(r[cCodeI], r[cNameI]);
        }

        const aRows = parseCsv(airportsCsv);
        const h = aRows[0];
        const idx = {
          type: h.indexOf("type"),
          name: h.indexOf("name"),
          lat: h.indexOf("latitude_deg"),
          lon: h.indexOf("longitude_deg"),
          iso: h.indexOf("iso_country"),
          city: h.indexOf("municipality"),
          sched: h.indexOf("scheduled_service"),
          icao: h.indexOf("icao_code"),
          iata: h.indexOf("iata_code"),
          gps: h.indexOf("gps_code"),
        };
        const seen = new Set<string>();
        const records: {
          iata_code: string; icao_code: string | null; airport_name: string;
          city: string | null; country: string | null;
          latitude: number | null; longitude: number | null;
        }[] = [];
        for (let i = 1; i < aRows.length; i++) {
          const r = aRows[i];
          const iata = (r[idx.iata] || "").trim().toUpperCase();
          if (iata.length !== 3) continue;
          const type = r[idx.type];
          if (!["large_airport", "medium_airport", "small_airport"].includes(type)) continue;
          if (type === "small_airport" && r[idx.sched] !== "yes") continue;
          if (seen.has(iata)) continue;
          seen.add(iata);
          records.push({
            iata_code: iata,
            icao_code: ((r[idx.icao] || r[idx.gps] || "").trim().toUpperCase()) || null,
            airport_name: (r[idx.name] || "").trim(),
            city: (r[idx.city] || "").trim() || null,
            country: countries.get(r[idx.iso]) || r[idx.iso] || null,
            latitude: r[idx.lat] ? Number(r[idx.lat]) : null,
            longitude: r[idx.lon] ? Number(r[idx.lon]) : null,
          });
        }

        let inserted = 0;
        const CHUNK = 500;
        for (let i = 0; i < records.length; i += CHUNK) {
          const chunk = records.slice(i, i + CHUNK);
          const { error } = await supabaseAdmin
            .from("airports")
            .upsert(chunk, { onConflict: "iata_code" });
          if (error) {
            return Response.json({ inserted, error: error.message }, { status: 500 });
          }
          inserted += chunk.length;
        }

        return Response.json({ ok: true, total: records.length, inserted });
      },
    },
  },
});
