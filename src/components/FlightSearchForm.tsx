import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowLeftRight, Calendar, Users, Plane } from "lucide-react";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { t } from "@/lib/i18n";

type Trip = "roundtrip" | "oneway";

export function FlightSearchForm({ compact = false }: { compact?: boolean }) {
  const nav = useNavigate();
  const [trip, setTrip] = useState<Trip>("roundtrip");
  const [origin, setOrigin] = useState("GRU");
  const [destination, setDestination] = useState("MIA");
  const [depart, setDepart] = useState(() => addDaysISO(21));
  const [ret, setRet] = useState(() => addDaysISO(28));
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState<"economy" | "premium" | "business" | "first">("economy");

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
      className={`card-luxe rounded-2xl p-5 md:p-7 ${compact ? "" : "shadow-luxe"}`}
    >
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTrip("roundtrip")}
          className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
            trip === "roundtrip" ? "gold-gradient text-primary-foreground" : "border border-border text-muted-foreground"
          }`}
        >
          {t("search.roundtrip")}
        </button>
        <button
          type="button"
          onClick={() => setTrip("oneway")}
          className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
            trip === "oneway" ? "gold-gradient text-primary-foreground" : "border border-border text-muted-foreground"
          }`}
        >
          {t("search.oneway")}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
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
      </div>

      <div className={`mt-3 grid gap-3 ${trip === "roundtrip" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <DateField label={t("search.depart")} value={depart} onChange={setDepart} />
        {trip === "roundtrip" && <DateField label={t("search.return")} value={ret} onChange={setRet} min={depart} />}
        <NumberField label={t("search.passengers")} value={pax} onChange={setPax} icon={<Users className="h-4 w-4" />} />
        <SelectField
          label={t("search.cabin")}
          value={cabin}
          onChange={(v) => setCabin(v as typeof cabin)}
          options={[
            { value: "economy", label: t("cabin.economy") },
            { value: "premium", label: t("cabin.premium") },
            { value: "business", label: t("cabin.business") },
            { value: "first", label: t("cabin.first") },
          ]}
        />
      </div>

      <button
        type="submit"
        className="mt-5 w-full md:w-auto md:ml-auto md:flex inline-flex items-center justify-center gap-2 rounded-xl gold-gradient text-primary-foreground font-semibold px-8 py-3.5 shadow-luxe hover:opacity-95 transition"
      >
        {t("search.cta")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}


function DateField({ label, value, onChange, min }: { label: string; value: string; onChange: (v: string) => void; min?: string }) {
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

function NumberField({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-border bg-input/50 px-4 py-3 focus-within:border-gold transition">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className="text-gold/70">{icon}</span>
      </div>
      <input
        type="number"
        min={1}
        max={9}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="mt-1 w-full bg-transparent text-base font-semibold text-foreground outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block rounded-xl border border-border bg-input/50 px-4 py-3 focus-within:border-gold transition">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-base font-semibold text-foreground outline-none appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function addDaysISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
