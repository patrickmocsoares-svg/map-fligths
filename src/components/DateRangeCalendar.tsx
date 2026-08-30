import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  /** ISO yyyy-mm-dd */
  depart: string;
  /** ISO yyyy-mm-dd — empty string when one-way */
  ret: string;
  /** when false the calendar picks a single date */
  range: boolean;
  onChange: (next: { depart: string; ret: string }) => void;
  labelDepart?: string;
  labelReturn?: string;
  theme?: "dark" | "light";
};

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
function fmt(s: string) {
  if (!s) return "";
  const d = fromISO(s);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]?.slice(0, 3)}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function DateRangeCalendar({
  depart,
  ret,
  range,
  onChange,
  labelDepart = "Ida",
  labelReturn = "Volta",
  theme = "dark",
}: Props) {
  const light = theme === "light";
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const [cursor, setCursor] = useState(() => startOfMonth(depart ? fromISO(depart) : today));
  const [hover, setHover] = useState<string>("");

  useEffect(() => {
    if (isMobile || !open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isMobile, open]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  const monthsToRender = isMobile ? 12 : 2;
  const months = Array.from({ length: monthsToRender }, (_, i) => addMonths(cursor, i));

  function pick(dayISO: string) {
    if (!range) {
      onChange({ depart: dayISO, ret: "" });
      setOpen(false);
      return;
    }
    if (!depart || (depart && ret)) {
      onChange({ depart: dayISO, ret: "" });
      return;
    }
    if (dayISO < depart) {
      onChange({ depart: dayISO, ret: "" });
      return;
    }
    onChange({ depart, ret: dayISO });
    if (!isMobile) setOpen(false);
  }

  const previewEnd = range && depart && !ret && hover > depart ? hover : ret;

  const grid = (m: Date) => {
    const first = startOfMonth(m);
    const blanks = first.getDay();
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    return (
      <div key={iso(first)} className="min-w-0">
        <div className={`mb-2 text-center text-sm font-semibold ${light ? "text-slate-900" : "text-foreground"}`}>
          {MONTHS[m.getMonth()]} {m.getFullYear()}
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = new Date(m.getFullYear(), m.getMonth(), i + 1);
            const key = iso(d);
            const disabled = key < iso(today);
            const isStart = key === depart;
            const isEnd = key === ret;
            const inRange =
              range && depart && previewEnd && key > depart && key < previewEnd;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onMouseEnter={() => setHover(key)}
                onClick={() => pick(key)}
                className={[
                  "relative mx-auto grid h-10 w-10 place-items-center rounded-full text-sm transition",
                  disabled
                    ? "cursor-not-allowed opacity-30"
                    : light
                      ? "text-slate-800 hover:bg-sky-100"
                      : "text-foreground hover:bg-gold/15",
                  inRange ? (light ? "bg-sky-100 text-sky-700" : "bg-gold/10 text-gold") : "",
                  isStart || isEnd
                    ? light
                      ? "bg-sky-600 font-bold text-white hover:bg-sky-700"
                      : "gold-gradient font-bold text-primary-foreground hover:opacity-90"
                    : "",
                ].join(" ")}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const summary = (
    <>
      {!light && (
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{range ? `${labelDepart} · ${labelReturn}` : labelDepart}</span>
          <Calendar className="h-3.5 w-3.5 text-gold/70" />
        </div>
      )}
      <div
        className={
          light
            ? "flex h-full items-center gap-2 truncate text-sm font-medium text-slate-900"
            : "mt-1 truncate text-base font-semibold text-foreground"
        }
      >
        {light && <Calendar className="h-4 w-4 shrink-0 text-sky-600" />}
        {depart ? fmt(depart) : "Selecionar data"}
        {range ? ` — ${ret ? fmt(ret) : "volta"}` : ""}
      </div>
    </>
  );

  const body = (
    <div className="space-y-6 md:flex md:gap-8 md:space-y-0">{months.map(grid)}</div>
  );

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          light
            ? `block h-11 w-full min-w-0 rounded-xl border bg-white px-4 text-left text-sm text-slate-900 transition ${open ? "border-sky-500" : "border-sky-200"}`
            : `block w-full min-w-0 rounded-xl border bg-input/50 px-4 py-3 text-left transition ${open ? "border-gold" : "border-border"}`
        }
      >
        {summary}
      </button>

      {open && !isMobile && (
        <div className={`absolute left-0 z-50 mt-2 w-[36rem] max-w-[90vw] rounded-2xl border p-4 shadow-xl ${light ? "border-sky-200 bg-white text-slate-900" : "border-border bg-card shadow-luxe"}`}>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              disabled={iso(cursor) <= iso(startOfMonth(today))}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-gold disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {range ? "Escolha ida e volta" : "Escolha a data de ida"}
            </span>
            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-gold"
            >
              →
            </button>
          </div>
          {body}
        </div>
      )}

      {open && isMobile && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 animate-fade"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-luxe animate-slide-up">
            <div className="pt-3">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold">
                  {range ? "Ida e volta" : "Data de ida"}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {depart ? fmt(depart) : "Selecione"}
                  {range ? ` — ${ret ? fmt(ret) : "volta"}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2">{body}</div>
            <div className="border-t border-border bg-card px-4 pt-3 safe-bottom">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-4 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground"
              >
                <Check className="h-4 w-4" /> Confirmar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
