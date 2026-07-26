import { useEffect, useRef, useState } from "react";
import { Plane, Search, X } from "lucide-react";
import { type Airport, searchAirports, useAirport } from "@/lib/airports";
import { useT } from "@/lib/i18n";

type Props = {
  label: string;
  value: string; // IATA code
  onChange: (code: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
};

export function AirportAutocomplete({ label, value, onChange, icon, placeholder }: Props) {
  const t = useT();
  const selected = useAirport(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced async search
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const r = await searchAirports(query, 8);
      if (!cancelled) {
        setResults(r);
        setHighlight(0);
        setLoading(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  function pick(a: Airport) {
    onChange(a.code);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const a = results[highlight];
      if (a) pick(a);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div
        className={`block rounded-xl border bg-input/50 px-4 py-3 transition ${
          open ? "border-gold" : "border-border"
        }`}
      >
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{label}</span>
          <span className="text-gold/70">{icon ?? <Plane className="h-4 w-4" />}</span>
        </div>

        {open ? (
          <div className="mt-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder ?? t("search.placeholder")}
              className="w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Limpar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setQuery("");
            }}
            className="mt-1 w-full text-left"
          >
            <div className="text-lg font-semibold text-foreground truncate">
              {selected ? `${selected.code} · ${selected.city}` : t("search.selectAirport")}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {selected ? `${selected.name} · ${selected.country}` : t("search.tapToSearch")}
            </div>
          </button>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-card shadow-luxe"
        >
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">{t("search.searching")}</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">{t("search.noAirport")}</div>
          )}
          {results.map((a, i) => {
            const active = i === highlight;
            return (
              <button
                key={a.code}
                type="button"
                role="option"
                aria-selected={active}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(a)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  active ? "bg-gold/10" : "hover:bg-muted/40"
                }`}
              >
                <span className="grid h-9 w-12 shrink-0 place-items-center rounded-md border border-gold/30 text-xs font-bold text-gold">
                  {a.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {a.city} — {a.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.country}
                    {a.region ? ` · ${a.region}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
