"use client";

import { useCallback, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { groupDigits } from "./format";
import type { OfferPurpose } from "./api";

/**
 * Two-handle price range, with the exact fields underneath for anyone who
 * already knows their number.
 *
 * A straight port of the app's PriceRangeSlider
 * (mobile/src/components/ui/PriceRangeSlider.tsx) — the same track maxima,
 * the same curve, the same rounding. Two slightly different price filters
 * across two clients is the kind of difference nobody reports and everybody
 * notices: you drag to "about 90 000" on the phone, do the same on the web,
 * and get a different set of flats.
 *
 * Reimplemented rather than shared because the app's version is Reanimated
 * worklets and gesture handlers all the way down. What had to come across is
 * the ARITHMETIC, and that is copied line for line.
 */

type PriceCurrency = "USD" | "UZS";

/**
 * Top of the track per purpose, in USD. Past it the handle reads "N+" and
 * means "no upper bound" — a sale track running to $100M would spend its
 * whole width on prices nobody filters by.
 */
const TRACK_MAX_USD: Record<OfferPurpose, number> = {
  SALE: 500_000,
  RENT_MONTHLY: 5_000,
  RENT_DAILY: 500,
};

/**
 * A round multiplier rather than the live rate: the end of the track only
 * has to be a sensible ceiling, and it must not shift under the thumb when
 * the exchange rate updates.
 */
const UZS_PER_USD = 12_000;

/** 123456 → 120000: two significant digits, so a dragged value reads as a price someone would type. */
function niceRound(v: number): number {
  if (v <= 0) return 0;
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1));
  return Math.round(v / mag) * mag;
}

/**
 * Position ⇄ price on a squared curve: the first half of the track covers
 * the bottom quarter of prices, which is where most listings — and most
 * filtering — sit. A linear track put every flat under $100k in its first
 * fifth.
 */
const toPrice = (t: number, max: number) => niceRound(t * t * max);
const toPosition = (price: number, max: number) =>
  Math.min(1, Math.max(0, Math.sqrt(price / max)));

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

export function PriceRange({
  lang,
  purpose,
  currency = "USD",
  min,
  max,
  onChangeMin,
  onChangeMax,
}: {
  lang: Lang;
  purpose: OfferPurpose;
  currency?: PriceCurrency;
  /** Empty string is "no bound" — the callers filter on exactly that. */
  min: string;
  max: string;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
}) {
  const trackMax =
    TRACK_MAX_USD[purpose] * (currency === "UZS" ? UZS_PER_USD : 1);
  // Same literal as format.ts's `unitFor`, so the slider and the cards
  // spell the unit the same way.
  const symbol = currency === "USD" ? "$" : "so'm";

  const track = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"lo" | "hi" | null>(null);

  const lo = min ? toPosition(Number(min), trackMax) : 0;
  const hi = max ? toPosition(Number(max), trackMax) : 1;

  /** Pointer x → 0..1 along the track. */
  const positionFrom = useCallback((clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - box.left) / box.width));
  }, []);

  const commit = useCallback(
    (handle: "lo" | "hi", position: number) => {
      if (handle === "lo") {
        // Dragged to the very start is "no lower bound", not "0".
        onChangeMin(position <= 0.001 ? "" : String(toPrice(position, trackMax)));
      } else {
        // Dragged to the very end is "no upper bound" — the handle reads "N+".
        onChangeMax(position >= 0.999 ? "" : String(toPrice(position, trackMax)));
      }
    },
    [onChangeMax, onChangeMin, trackMax],
  );

  const onPointerDown = (handle: "lo" | "hi") => (e: React.PointerEvent) => {
    e.preventDefault();
    // Capture, so a drag that leaves the track keeps steering the handle
    // rather than stopping dead at the edge.
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(handle);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const position = positionFrom(e.clientX);
    // The handles cannot cross: a range whose bottom is above its top is not
    // a range, and the API would answer it with nothing.
    if (dragging === "lo") commit("lo", Math.min(position, hi));
    else commit("hi", Math.max(position, lo));
  };

  const endDrag = () => setDragging(null);

  /** Arrow keys, because a slider nobody can reach by keyboard is not a control. */
  const onKeyDown = (handle: "lo" | "hi") => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const current = handle === "lo" ? lo : hi;
    let next: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    if (next === null) return;

    e.preventDefault();
    const clamped = Math.min(1, Math.max(0, next));
    if (handle === "lo") commit("lo", Math.min(clamped, hi));
    else commit("hi", Math.max(clamped, lo));
  };

  const label = (value: string, atEnd: boolean) => {
    if (!value) return atEnd ? `${groupDigits(trackMax)}+` : "0";
    return groupDigits(Number(value));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* The read-out, above the track where a dragging thumb does not hide
          it under a finger. */}
      <div className="flex items-center justify-between text-[15px] font-semibold text-ink">
        <span className="nums">
          {label(min, false)} {symbol}
        </span>
        <span className="nums">
          {label(max, true)} {symbol}
        </span>
      </div>

      <div
        ref={track}
        className="relative h-11 touch-none select-none"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* The rail */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted-bg" />
        {/* The selected span */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${lo * 100}%`, right: `${(1 - hi) * 100}%` }}
        />

        {(["lo", "hi"] as const).map((handle) => {
          const at = handle === "lo" ? lo : hi;
          return (
            <button
              key={handle}
              type="button"
              role="slider"
              aria-label={t(
                lang,
                handle === "lo" ? "filters.priceMin" : "filters.priceMax",
              )}
              aria-valuemin={0}
              aria-valuemax={trackMax}
              aria-valuenow={
                handle === "lo"
                  ? Number(min || 0)
                  : Number(max || trackMax)
              }
              aria-valuetext={`${label(handle === "lo" ? min : max, handle === "hi")} ${symbol}`}
              onPointerDown={onPointerDown(handle)}
              onKeyDown={onKeyDown(handle)}
              className={`absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand shadow-card transition-[box-shadow,scale] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                dragging === handle ? "scale-110" : ""
              }`}
              style={{ left: `${at * 100}%` }}
            />
          );
        })}
      </div>

      {/* The exact fields. Same two strings as the track — somebody who
          knows they want 85 000 should not have to find it by dragging. */}
      <div className="flex items-center gap-3">
        <input
          inputMode="numeric"
          value={min ? groupDigits(Number(min)) : ""}
          onChange={(e) => onChangeMin(digitsOnly(e.target.value))}
          placeholder={t(lang, "filters.priceMin")}
          aria-label={t(lang, "filters.priceMin")}
          className="nums h-12 w-full rounded-control bg-raised px-3.5 text-[15px] text-ink outline-none ring-1 ring-line transition placeholder:text-faint focus:ring-2 focus:ring-brand"
        />
        <span aria-hidden className="text-faint">
          —
        </span>
        <input
          inputMode="numeric"
          value={max ? groupDigits(Number(max)) : ""}
          onChange={(e) => onChangeMax(digitsOnly(e.target.value))}
          placeholder={t(lang, "filters.priceMax")}
          aria-label={t(lang, "filters.priceMax")}
          className="nums h-12 w-full rounded-control bg-raised px-3.5 text-[15px] text-ink outline-none ring-1 ring-line transition placeholder:text-faint focus:ring-2 focus:ring-brand"
        />
      </div>
    </div>
  );
}
