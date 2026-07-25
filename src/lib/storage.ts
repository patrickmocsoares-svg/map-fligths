import { useEffect, useState } from "react";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setValue(read<T>(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, hydrated]);
  return [value, setValue, hydrated] as const;
}

export type SavedRoute = {
  id: string;
  origin: string;
  destination: string;
  createdAt: string;
};

export type PriceAlert = {
  id: string;
  origin: string;
  destination: string;
  targetPriceBRL: number;
  createdAt: string;
};

export const KEYS = {
  saved: "mab_saved_routes",
  alerts: "mab_price_alerts",
};
