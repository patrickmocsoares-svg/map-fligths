/**
 * i18n runtime with reactive locale subscription.
 *
 * Dictionaries live in /src/locales/<code>.ts. Components can call `t(key)`
 * anywhere; to react to locale changes, either use `useT()` inside a
 * component (returns a stable `t` and re-renders on change) or subscribe
 * via `onLocaleChange`.
 */
import { useSyncExternalStore } from "react";
import ptBR from "@/locales/pt-BR";
import en from "@/locales/en";
import es from "@/locales/es";
import fr from "@/locales/fr";
import it from "@/locales/it";

export type Locale = "pt-BR" | "en" | "es" | "fr" | "it";

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

type Dict = Record<string, string>;
const DICTS: Record<Locale, Dict> = { "pt-BR": ptBR, en, es, fr, it };

const STORAGE_KEY = "mab_locale";

let currentLocale: Locale = DEFAULT_LOCALE;
if (typeof window !== "undefined") {
  const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && DICTS[saved]) currentLocale = saved;
}

const listeners = new Set<() => void>();

export function setLocale(l: Locale) {
  if (!DICTS[l] || l === currentLocale) return;
  currentLocale = l;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, l);
    // Reflect on <html lang> for a11y / SEO.
    document.documentElement.setAttribute("lang", l);
  }
  listeners.forEach((fn) => fn());
}

export function getLocale(): Locale {
  return currentLocale;
}

export function onLocaleChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function t(key: string): string {
  return DICTS[currentLocale][key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
}

/** Reactive locale hook — subscribes so consumers re-render on switch. */
export function useLocale(): Locale {
  return useSyncExternalStore(
    (cb) => onLocaleChange(cb),
    () => currentLocale,
    () => DEFAULT_LOCALE,
  );
}

/** Convenience hook: returns a stable `t` bound to the current locale. */
export function useT(): (key: string) => string {
  useLocale();
  return t;
}

/**
 * Currency formatter that never renders "R$ NaN".
 * Invalid / missing values fall back to a commercial "Consultar" label.
 */
export function formatBRL(n: number | null | undefined, fallback = "Consultar"): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}
export function formatMiles(n: number | null | undefined, fallback = "—"): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return new Intl.NumberFormat("pt-BR").format(n);
}
