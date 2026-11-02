"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

export type Currency = "AUTO" | "USD" | "UZS";

const CURRENCY_KEY = "growencity.currency";

/**
 * The stored currency, as an external store.
 *
 * `useSyncExternalStore` rather than `useState` + an effect. The value lives
 * in localStorage, which React does not own, and it affects RENDERED output
 * (every price on the page) — so the two naive options are both wrong: a
 * lazy initialiser reads storage during render and the server, which has no
 * storage, disagrees with the client; an effect that calls setState after
 * mount is the cascading render the compiler lint rejects.
 *
 * This hook is the API for exactly this case. `getServerSnapshot` returns
 * the default, so the server and the first client paint agree, and React
 * then switches to the stored value in the same commit rather than in a
 * second render pass.
 */
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  // `storage` fires in OTHER tabs, so changing the currency in one tab
  // updates the prices in the rest.
  const onStorage = (e: StorageEvent) => {
    if (e.key === CURRENCY_KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

function readCurrency(): Currency {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    return saved === "USD" || saved === "UZS" ? saved : "AUTO";
  } catch {
    return "AUTO";
  }
}

/** The server has no storage; everyone starts at the default there. */
const serverCurrency = (): Currency => "AUTO";

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** USD→UZS, or null until the rate arrives (or if it never does). */
  rate: number | null;
  rateUpdatedAt: string | null;
};

const PrefsCtx = createContext<Ctx | null>(null);

/**
 * Display preferences that are not the theme.
 *
 * Currency is a DISPLAY choice, not a data one: every offer is stored in the
 * currency the seller entered, and "AUTO" — the default — simply shows each
 * one as written. Picking USD or UZS converts for comparison, through the
 * server's own rate so the site and the app agree on the number.
 *
 * The rate is fetched once per page load and never blocks anything: if it
 * does not arrive, prices fall back to their own currency rather than
 * showing a converted figure computed from nothing.
 */
export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(
    subscribe,
    readCurrency,
    serverCurrency,
  );
  const [rate, setRate] = useState<number | null>(null);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/rates`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { usdToUzs?: number; updatedAt?: string } | null) => {
        if (!alive || !d?.usdToUzs) return;
        setRate(d.usdToUzs);
        setRateUpdatedAt(d.updatedAt ?? null);
      })
      .catch(() => {
        // No rate: prices stay in their own currency. Nothing to tell the
        // person — they did not ask for a conversion.
      });
    return () => {
      alive = false;
    };
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    try {
      if (next === "AUTO") localStorage.removeItem(CURRENCY_KEY);
      else localStorage.setItem(CURRENCY_KEY, next);
    } catch {
      // Private window: the choice cannot be remembered, and the store will
      // keep reporting the default. Nothing else to do — a currency
      // preference is not worth throwing for.
    }
    // `storage` does not fire in the tab that wrote it, so this tab is told
    // directly.
    listeners.forEach((fn) => fn());
  }, []);

  return (
    <PrefsCtx.Provider value={{ currency, setCurrency, rate, rateUpdatedAt }}>
      {children}
    </PrefsCtx.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsCtx);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
