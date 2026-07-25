import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Calendar,
  Check,
  ChevronDown,
  Plane,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { useIsMobile } from "@/hooks/use-mobile";
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

  const [origin, setOrigin] = useState("GRU");
  const [destination, setDestination] = useState("MIA");
  const [depart, setDepart] = useState(() => addDaysISO(21));
  const [ret, setRet] = useState(() => addDaysISO(28));

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
      className={`rounded-3xl border border-white/10 bg-card/85 p-4 backdrop-blur-2xl sm:p-5 md:p-7 ${compact ? "shadow-card" : "shadow-luxe"}`}
    >
      {/* Top control bar */}
      <div className="flex flex-wrap items-center gap-2">
        <TripTypeMenu value={trip} onChange={setTrip} />
        <PassengerMenu
          adults={adults}
          setAdults={setAdults}
          childrenCount={children}
          setChildren={setChildren}
          infants={infants}
          setInfants={setInfants}
        />
        <CabinMenu value={cabin} onChange={setCabin} />

        <button
          type="button"
          onClick={() => setFlexible((f) => !f)}
          className={`ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            flexible
              ? "border-gold/60 bg-gold/10 text-gold"
              : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold"
          }`}
          aria-pressed={flexible}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden xs:inline sm:inline">Datas flexíveis</span>
          <span className="xs:hidden sm:hidden">Flex ±3d</span>
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
                className="justify-self-end md:justify-self-auto rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 h-11 w-11 grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Remover trecho"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLeg}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-dashed border-gold/40 px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/5 transition"
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
          {/* Mobile swap */}
          <button
            type="button"
            onClick={swap}
            className="md:hidden mx-auto -my-1 grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-card text-gold"
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

      {/* Search CTA */}
      <div className="mt-6 flex justify-center md:mt-7">
        <button
          type="submit"
          className="btn-primary btn-primary-hover w-full sm:w-auto px-6 sm:px-10 py-4 text-sm uppercase tracking-[0.18em]"
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
    <Menu label={label} icon={<Plane className="h-4 w-4" />} sheetTitle="Tipo de viagem">
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
    <Menu label={t(CABIN_LABEL[value])} icon={<Sparkles className="h-4 w-4" />} sheetTitle="Classe">
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
  childrenCount,
  setChildren,
  infants,
  setInfants,
}: {
  adults: number;
  setAdults: (n: number) => void;
  childrenCount: number;
  setChildren: (n: number) => void;
  infants: number;
  setInfants: (n: number) => void;
}) {
  const total = adults + childrenCount + infants;
  const label = `${total} ${total === 1 ? "passageiro" : "passageiros"}`;
  return (
    <Menu
      label={label}
      icon={<Users className="h-4 w-4" />}
      sheetTitle="Passageiros"
      showConfirm
    >
      {(close) => (
        <div className="w-full md:w-72 p-2">
          <div className="hidden md:block px-3 pt-1 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Total: {total}
          </div>
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
            value={childrenCount}
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
          <div className="hidden md:block px-1 pt-2">
            <button
              type="button"
              onClick={close}
              className="w-full rounded-lg gold-gradient py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
            >
              Confirmar
            </button>
          </div>
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
    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 md:py-2.5 hover:bg-muted/30">
      <div className="min-w-0">
        <div className="text-base md:text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs md:text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center gap-3 md:gap-2">
        <StepButton
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Diminuir ${label}`}
        >
          −
        </StepButton>
        <span className="w-7 text-center text-base md:text-sm font-semibold tabular-nums">{value}</span>
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
      className="grid h-11 w-11 md:h-8 md:w-8 place-items-center rounded-full border border-gold/40 text-lg md:text-base text-gold hover:bg-gold/10 active:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

/* ============================== Menu shell (bottom sheet on mobile) ============================== */

function Menu({
  label,
  icon,
  children,
  sheetTitle,
  showConfirm,
}: {
  label: string;
  icon: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  sheetTitle?: string;
  showConfirm?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isMobile]);

  // Lock body scroll when mobile sheet open
  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          open ? "border-gold text-gold" : "border-border text-foreground hover:border-gold/40"
        }`}
      >
        <span className="text-gold/70">{icon}</span>
        <span className="truncate max-w-[9rem]">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>

      {open && !isMobile && (
        <div className="absolute z-50 mt-2 min-w-[12rem] rounded-xl border border-border bg-card shadow-luxe">
          {children(close)}
        </div>
      )}

      {open && isMobile && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            aria-label="Fechar"
            onClick={close}
            className="absolute inset-0 bg-black/60 animate-fade"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-white/10 bg-card shadow-luxe animate-slide-up flex flex-col">
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="font-display text-lg font-bold">{sheetTitle ?? label}</h3>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-3 pb-2">
              {children(close)}
            </div>
            {showConfirm && (
              <div className="border-t border-white/5 bg-card px-4 pt-3 safe-bottom">
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-4 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-luxe"
                >
                  <Check className="h-4 w-4" /> Confirmar
                </button>
              </div>
            )}
          </div>
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
      className={`block w-full rounded-lg px-4 py-3 md:py-2 text-left text-base md:text-sm transition ${
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
    <label className="block min-w-0 rounded-xl border border-border bg-input/50 px-4 py-3 focus-within:border-gold transition">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <Calendar className="h-3.5 w-3.5 text-gold/70" />
      </div>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-w-0 bg-transparent text-base font-semibold text-foreground outline-none [color-scheme:dark]"
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
