import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Calendar,
  ChevronDown,
  Plane,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { t } from "@/lib/i18n";

type TripType = "roundtrip" | "oneway" | "multicity";
type Cabin = "economy" | "premium" | "business" | "first";

type Leg = { origin: string; destination: string; depart: string };

const CABIN_LABEL: Record<Cabin, string> = {
  economy: "cabin.economy",
  premium: "cabin.premium",
  business: "cabin.business",
  first: "cabin.first",
};

export function FlightSearchForm({ compact = false }: { compact?: boolean }) {
  const nav = useNavigate();
  const [trip, setTrip] = useState<TripType>("roundtrip");
  const [cabin, setCabin] = useState<Cabin>("economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [flexible, setFlexible] = useState(false);

  // Simple trip legs
  const [origin, setOrigin] = useState("GRU");
  const [destination, setDestination] = useState("MIA");
  const [depart, setDepart] = useState(() => addDaysISO(21));
  const [ret, setRet] = useState(() => addDaysISO(28));

  // Multi-city legs (starts with the two above merged in)
  const [legs, setLegs] = useState<Leg[]>(() => [
    { origin: "GRU", destination: "MIA", depart: addDaysISO(21) },
    { origin: "MIA", destination: "GRU", depart: addDaysISO(28) },
  ]);

  const pax = adults + children + infants;

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const swapLeg = (i: number) => {
    setLegs((prev) =>
      prev.map((l, idx) =>
        idx === i ? { ...l, origin: l.destination, destination: l.origin } : l,
      ),
    );
  };

  const addLeg = () => {
    setLegs((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          origin: last?.destination ?? "GRU",
          destination: "",
          depart: last?.depart ? shiftISO(last.depart, 3) : addDaysISO(30),
        },
      ];
    });
  };

  const removeLeg = (i: number) => {
    setLegs((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  };

  const updateLeg = (i: number, patch: Partial<Leg>) => {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trip === "multicity") {
      const first = legs[0];
      const last = legs[legs.length - 1];
      nav({
        to: "/search",
        search: {
          origin: first?.origin,
          destination: last?.destination,
          depart: first?.depart,
          pax,
          cabin,
        },
      });
      return;
    }
    nav({
      to: "/search",
      search: {
        origin,
        destination,
        depart,
        ret: trip === "roundtrip" ? ret : undefined,
        pax,
        cabin,
      },
    });
  };

  return (
    <form
      onSubmit={submit}
      className={`card-luxe rounded-2xl p-4 md:p-6 ${compact ? "" : "shadow-luxe"}`}
    >
      {/* Top control bar: trip type · passengers · cabin */}
      <div className="flex flex-wrap items-center gap-2">
        <TripTypeMenu value={trip} onChange={setTrip} />
        <PassengerMenu
          adults={adults}
          setAdults={setAdults}
          children={children}
          setChildren={setChildren}
          infants={infants}
          setInfants={setInfants}
        />
        <CabinMenu value={cabin} onChange={setCabin} />

        <button
          type="button"
          onClick={() => setFlexible((f) => !f)}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            flexible
              ? "border-gold/60 bg-gold/10 text-gold"
              : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold"
          }`}
          aria-pressed={flexible}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Datas flexíveis
          <span className="hidden sm:inline text-[10px] text-muted-foreground/80">
            ±3 dias
          </span>
        </button>
      </div>

      {/* Body */}
      {trip === "multicity" ? (
        <div className="mt-4 space-y-3">
          {legs.map((leg, i) => (
            <div
              key={i}
              className="grid gap-3 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end"
            >
              <AirportAutocomplete
                label={`${t("search.origin")} ${i + 1}`}
                value={leg.origin}
                onChange={(v) => updateLeg(i, { origin: v })}
                icon={<Plane className="h-4 w-4 -rotate-45" />}
              />
              <button
                type="button"
                onClick={() => swapLeg(i)}
                className="hidden md:grid place-items-center rounded-full border border-gold/30 text-gold hover:bg-gold/10 transition h-10 w-10 self-end mb-1"
                aria-label="Trocar origem e destino"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <AirportAutocomplete
                label={t("search.destination")}
                value={leg.destination}
                onChange={(v) => updateLeg(i, { destination: v })}
                icon={<Plane className="h-4 w-4 rotate-45" />}
              />
              <DateField
                label={t("search.depart")}
                value={leg.depart}
                onChange={(v) => updateLeg(i, { depart: v })}
              />
              <button
                type="button"
                onClick={() => removeLeg(i)}
                disabled={legs.length <= 2}
                className="justify-self-end md:justify-self-auto rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 h-10 w-10 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Remover trecho"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLeg}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-gold/40 px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/5 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar trecho
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
          <AirportAutocomplete
            label={t("search.origin")}
            value={origin}
            onChange={setOrigin}
            icon={<Plane className="h-4 w-4 -rotate-45" />}
          />
          <button
            type="button"
            onClick={swap}
            className="hidden md:grid place-items-center rounded-full border border-gold/30 text-gold hover:bg-gold/10 transition h-10 w-10 self-end mb-1"
            aria-label="Trocar origem e destino"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <AirportAutocomplete
            label={t("search.destination")}
            value={destination}
            onChange={setDestination}
            icon={<Plane className="h-4 w-4 rotate-45" />}
          />
          <div
            className={`grid gap-3 ${trip === "roundtrip" ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <DateField label={t("search.depart")} value={depart} onChange={setDepart} />
            {trip === "roundtrip" && (
              <DateField
                label={t("search.return")}
                value={ret}
                onChange={setRet}
                min={depart}
              />
            )}
          </div>
        </div>
      )}

      {/* Search CTA — Google Flights style floating pill */}
      <div className="mt-6 flex justify-center">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground font-semibold px-8 py-3 shadow-luxe hover:opacity-95 transition"
        >
          <Search className="h-4 w-4" />
          {t("search.cta")}
        </button>
      </div>
    </form>
  );
}

/* ============================== Menus ============================== */

function TripTypeMenu({
  value,
  onChange,
}: {
  value: TripType;
  onChange: (v: TripType) => void;
}) {
  const label =
    value === "roundtrip"
      ? t("search.roundtrip")
      : value === "oneway"
        ? t("search.oneway")
        : "Multi-destinos";
  return (
    <Menu label={label} icon={<Plane className="h-4 w-4" />}>
      {(close) => (
        <div className="p-1">
          <MenuItem selected={value === "roundtrip"} onClick={() => { onChange("roundtrip"); close(); }}>
            {t("search.roundtrip")}
          </MenuItem>
          <MenuItem selected={value === "oneway"} onClick={() => { onChange("oneway"); close(); }}>
            {t("search.oneway")}
          </MenuItem>
          <MenuItem selected={value === "multicity"} onClick={() => { onChange("multicity"); close(); }}>
            Multi-destinos
          </MenuItem>
        </div>
      )}
    </Menu>
  );
}

function CabinMenu({ value, onChange }: { value: Cabin; onChange: (v: Cabin) => void }) {
  return (
    <Menu label={t(CABIN_LABEL[value])} icon={<Sparkles className="h-4 w-4" />}>
      {(close) => (
        <div className="p-1">
          {(Object.keys(CABIN_LABEL) as Cabin[]).map((c) => (
            <MenuItem key={c} selected={value === c} onClick={() => { onChange(c); close(); }}>
              {t(CABIN_LABEL[c])}
            </MenuItem>
          ))}
        </div>
      )}
    </Menu>
  );
}

function PassengerMenu({
  adults,
  setAdults,
  children,
  setChildren,
  infants,
  setInfants,
}: {
  adults: number;
  setAdults: (n: number) => void;
  children: number;
  setChildren: (n: number) => void;
  infants: number;
  setInfants: (n: number) => void;
}) {
  const total = adults + children + infants;
  const label = `${total} ${total === 1 ? "passageiro" : "passageiros"}`;
  return (
    <Menu label={label} icon={<Users className="h-4 w-4" />}>
      {() => (
        <div className="w-72 p-2">
          <PaxRow
            label="Adultos"
            hint="13+ anos"
            value={adults}
            onChange={setAdults}
            min={1}
          />
          <PaxRow
            label="Crianças"
            hint="2 – 12 anos"
            value={children}
            onChange={setChildren}
            min={0}
          />
          <PaxRow
            label="Bebês"
            hint="No colo · até 2 anos"
            value={infants}
            onChange={setInfants}
            min={0}
            max={adults}
          />
        </div>
      )}
    </Menu>
  );
}

function PaxRow({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 9,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/30">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center gap-2">
        <StepButton
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Diminuir ${label}`}
        >
          −
        </StepButton>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
        <StepButton
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Aumentar ${label}`}
        >
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

/* ============================== Menu shell ============================== */

function Menu({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          open ? "border-gold text-gold" : "border-border text-foreground hover:border-gold/40"
        }`}
      >
        <span className="text-gold/70">{icon}</span>
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 min-w-[12rem] rounded-xl border border-border bg-card shadow-luxe">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
        selected ? "bg-gold/10 text-gold" : "text-foreground hover:bg-muted/40"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================== Date field ============================== */

function DateField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
}) {
  return (
    <label className="block rounded-xl border border-border bg-input/50 px-4 py-3 focus-within:border-gold transition">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <Calendar className="h-3.5 w-3.5 text-gold/70" />
      </div>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-base font-semibold text-foreground outline-none [color-scheme:dark]"
      />
    </label>
  );
}

/* ============================== helpers ============================== */

function addDaysISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function shiftISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
