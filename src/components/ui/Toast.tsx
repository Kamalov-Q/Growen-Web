"use client";

import { useSyncExternalStore } from "react";

/**
 * The one-line confirmation: "link copied", and whatever else earns one.
 *
 * ── Why a store and not a context ─────────────────────────────────────────
 *
 * `toast()` is called from event handlers, promise callbacks and plain
 * functions that are nowhere near a component. A context would mean every
 * one of them taking a hook and a provider they otherwise have no use for.
 * This is a module-level store read through `useSyncExternalStore`, the
 * same shape `prefs` and the pending top-up use, so the only component
 * that knows about it is the one that draws it.
 *
 * ── What it is NOT for ────────────────────────────────────────────────────
 *
 * Errors you can act on. A toast is gone in three seconds and cannot be
 * re-read, so anything somebody has to respond to — a rejected payment, a
 * form that would not save — belongs on the page beside the thing that
 * failed. This is for confirming something that already worked.
 */

const DURATION_MS = 2600;

interface Toast {
  id: number;
  message: string;
}

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function toast(message: string): void {
  if (timer) clearTimeout(timer);
  // A new id even for the same text, so repeating an action restarts the
  // animation instead of looking like nothing happened.
  current = { id: Date.now(), message };
  emit();

  timer = setTimeout(() => {
    current = null;
    timer = null;
    emit();
  }, DURATION_MS);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const getSnapshot = () => current;
/** Nothing is ever toasting on the server. */
const getServerSnapshot = () => null;

/**
 * Mounted once, in the language layout.
 *
 * `role="status"` with `aria-live="polite"`: a confirmation is announced
 * after whatever the reader is doing, never interrupting it. The region
 * stays in the DOM when empty — a live region added at the same moment as
 * its text is frequently not announced at all.
 */
export function Toaster() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="status"
      aria-live="polite"
      /* Above the mobile tab bar, clear of the home indicator, and
         `pointer-events-none` so a toast over a button never eats the
         press that follows it. */
      className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-6"
    >
      {active ? (
        <span
          key={active.id}
          className="motion-safe:animate-[toast-in_180ms_ease-out] rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-page shadow-lift"
        >
          {active.message}
        </span>
      ) : null}
    </div>
  );
}
