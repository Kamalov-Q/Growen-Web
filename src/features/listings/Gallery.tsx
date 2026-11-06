"use client";

import Image from "next/image";
import { cdnSrc } from "@/src/lib/media";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import type { ListingImage } from "@/src/lib/listing-types";

/**
 * The listing's photos.
 *
 * ── Why this stopped being a CSS scroll strip ──────────────────────────────
 *
 * It used to be a server component with `overflow-x-auto` and scroll
 * snapping, and the reasoning in its old comment was sound as far as it
 * went: swipe for free, no JavaScript, no hydration. What it could not do
 * was show one photo at a time. Slides were `w-[85%] sm:w-[70%]`, so every
 * screen showed one and a half photographs and a scrollbar — on a 1000px
 * desktop that is the first thing a buyer sees of a flat.
 *
 * Autoplay, looping, dots and arrows cannot be built out of scroll snapping
 * either, and they are what people expect of a gallery. So this is a real
 * carousel now. It is still server-RENDERED, because a client component is,
 * which is what keeps every photograph in the HTML a crawler reads.
 *
 * ── How the loop works ─────────────────────────────────────────────────────
 *
 * The track carries a clone of the last slide in front and a clone of the
 * first behind: [Ln, L1 … Ln, L1]. Moving past either end lands on a clone,
 * and that transition's own `transitionend` jumps to the matching real slide
 * with the transition switched off. The jump is between two identical
 * pictures, so there is nothing to see.
 *
 * The alternative — snapping back to the start after the last photo — is a
 * rewind, and a rewind announces that the gallery has ended, which is the
 * one thing an infinite carousel exists not to say.
 *
 * ── What is deliberately NOT here ──────────────────────────────────────────
 *
 * No carousel library. Embla and Swiper both do this well and both are
 * bigger than the problem: the whole behaviour is one transform, one index
 * and a boundary jump.
 */

const AUTOPLAY_MS = 5000;

/** Past this the pointer has committed to a swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 50;

// `prefers-reduced-motion` as an external store, the same shape prefs.tsx
// uses. A lazy initialiser would read `matchMedia` during render, which the
// server cannot do; an effect that calls setState after mount is the
// cascading render the compiler lint rejects.
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void): () => void {
  const list = window.matchMedia(MOTION_QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

const readMotion = () => window.matchMedia(MOTION_QUERY).matches;
/** The server cannot know, and "animate" is the safe assumption to hydrate. */
const serverMotion = () => false;

export function Gallery({
  images,
  alt,
  lang,
}: {
  images: ListingImage[];
  alt: string;
  lang: Lang;
}) {
  // Primary first, then by position — the primary photo is what every list
  // shows, so the detail page opens on the same one.
  const ordered = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.position - b.position;
  });

  const count = ordered.length;

  const reduceMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );

  /** Position on the EXTENDED track; 1 is the first real slide. */
  const [index, setIndex] = useState(1);
  /** Off only for the instant of a boundary jump. */
  const [animate, setAnimate] = useState(true);
  /**
   * Read from `document.hidden`, not started at false.
   *
   * `visibilitychange` only fires on a CHANGE, so a page opened in a
   * background tab — the second result of a middle click, a restored
   * session — had nothing to tell it the tab was hidden, and autoplay ran
   * there. That is half of how the stage ended up blank; see the tick.
   *
   * It gates a timer and nothing rendered, so reading `document` in the
   * initialiser cannot make the server and the client disagree about any
   * markup.
   */
  const [paused, setPaused] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dragStart = useRef<number | null>(null);
  /** The live index, for callbacks that must not re-subscribe to read it. */
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  /**
   * Put a stranded track back on a real slide, instantly.
   *
   * The loop normally leaves a clone through `transitionend` — and a
   * background tab runs no transitions, so that event never arrives. The
   * index then sits on a clone, and the next advance walks PAST the end of
   * the track into empty space: a blank stage, with a counter still
   * reading a plausible "4 / 4" because it is computed modulo the count.
   */
  const snapHome = useCallback(() => {
    setAnimate(false);
    setIndex(1);
  }, []);

  const go = useCallback((next: number) => {
    setAnimate(true);
    setIndex(next);
  }, []);

  const goPrev = useCallback(() => setIndex((i) => i - 1), []);
  const goNext = useCallback(() => setIndex((i) => i + 1), []);

  /** Which real photo is showing, 0-based — what the dots and counter read. */
  const real = count > 0 ? (((index - 1) % count) + count) % count : 0;

  // Autoplay. Off for a single photo, off when the pointer or focus is
  // inside, off while dragging, and off entirely for anyone who asked for
  // less motion — an advert that animates itself is what that setting is
  // about.
  useEffect(() => {
    if (count < 2 || paused || dragging || reduceMotion) return;
    const id = setInterval(() => {
      const i = indexRef.current;
      // Stranded on (or past) a clone: recover rather than walking further
      // off the end. Never reached while transitions are running.
      if (i < 1 || i > count) {
        snapHome();
        return;
      }
      setAnimate(true);
      setIndex(i + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused, dragging, reduceMotion, snapHome]);

  // A background tab should not keep advancing. Without this you come back
  // to the page and the gallery is somewhere else entirely.
  useEffect(() => {
    const onVisibility = () => {
      setPaused(document.hidden);
      // Returning to the tab: if the track was left on a clone while it
      // was hidden, put it right now rather than at the next tick.
      if (!document.hidden) {
        const i = indexRef.current;
        if (i < 1 || i > count) snapHome();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [count, snapHome]);

  // Re-arm the transition one frame AFTER the jump has painted. Doing it in
  // the same frame means the browser never observes the jumped position
  // without a transition, and animates the track back across every slide.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // The track's OWN transform, nothing bubbling up from a slide and no
    // other property: a stray `transitionend` from a child would jump the
    // loop at a moment the track is not at a boundary.
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;

    if (index === 0) {
      setAnimate(false);
      setIndex(count);
    } else if (index === count + 1) {
      setAnimate(false);
      setIndex(1);
    }
  };

  // ---- pointer swipe ------------------------------------------------------
  //
  // Pointer events rather than touch events: one code path covers a finger,
  // a pen and a mouse drag. This is what the scroll strip gave for free and
  // what a transform-based track has to put back by hand.

  const onPointerDown = (e: React.PointerEvent) => {
    if (count < 2 || e.button !== 0) return;
    dragStart.current = e.clientX;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    setDrag(e.clientX - dragStart.current);
  };

  const endDrag = () => {
    if (dragStart.current === null) return;
    const moved = drag;
    dragStart.current = null;
    setDrag(0);
    setDragging(false);
    if (moved <= -SWIPE_THRESHOLD_PX) goNext();
    else if (moved >= SWIPE_THRESHOLD_PX) goPrev();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

  // ---- the empty and single cases ----------------------------------------

  if (count === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-card bg-muted-bg sm:aspect-[16/9]" />
    );
  }

  if (count === 1) {
    const only = ordered[0]!;
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-muted-bg sm:aspect-[16/9]">
        <Image
          src={cdnSrc(only.url)}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1000px"
          className="object-cover"
        />
      </div>
    );
  }

  // ---- the carousel -------------------------------------------------------

  // A clone at each end is what makes the loop seamless. They carry no alt
  // and are hidden from assistive tech: the same photograph twice running is
  // noise to a screen reader and duplicate content to a crawler.
  const track = [ordered[count - 1]!, ...ordered, ordered[0]!];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={alt}
      className="flex flex-col gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-card bg-muted-bg sm:aspect-[16/9]"
        tabIndex={0}
        role="group"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        // `pan-y` so a vertical flick still scrolls the page: a gallery that
        // eats downward swipes traps the reader on it.
        style={{ touchAction: "pan-y" }}
      >
        <div
          className={`flex h-full ${
            animate && !dragging
              ? "transition-transform duration-500 ease-out"
              : ""
          }`}
          style={{
            transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {track.map((image, i) => {
            const clone = i === 0 || i === track.length - 1;
            return (
              <div
                key={`${image.id}-${i}`}
                className="relative h-full w-full shrink-0"
                aria-hidden={clone || undefined}
              >
                <Image
                  src={cdnSrc(image.url)}
                  alt={clone ? "" : `${alt} — ${i}/${count}`}
                  fill
                  // Only the first real photo is eager: it is the largest
                  // element above the fold, so it IS the Largest Contentful
                  // Paint. The rest sit outside `overflow-hidden`, so the
                  // browser's own lazy loading holds them until they move
                  // into view. That is the optimisation — not a trick.
                  priority={i === 1}
                  loading={i === 1 ? "eager" : "lazy"}
                  sizes="(max-width: 1024px) 100vw, 1000px"
                  className="pointer-events-none select-none object-cover"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* Arrows. Always in the DOM for a keyboard and a screen reader; they
            fade in on hover for a mouse, and stay put below `sm` where there
            is no hover to reveal them. */}
        <button
          type="button"
          onClick={goPrev}
          aria-label={t(lang, "gallery.prev")}
          className="absolute start-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-surface/80 text-ink opacity-0 shadow-card backdrop-blur transition hover:bg-surface focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={t(lang, "gallery.next")}
          className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-surface/80 text-ink opacity-0 shadow-card backdrop-blur transition hover:bg-surface focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* The counter works at every size and at any number of photos. Dots
            stop being countable somewhere around eight. */}
        <p className="nums pointer-events-none absolute end-3 top-3 rounded-full bg-ink/65 px-2.5 py-1 text-[12px] font-semibold text-surface">
          {real + 1} / {count}
        </p>

        {/* Dots sit ON the photo below `sm`, where vertical space is the
            scarce thing and the thumbnail strip is hidden. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
          {ordered.map((image, i) => (
            <span
              key={image.id}
              className={`h-1.5 rounded-full transition-all ${
                i === real ? "w-5 bg-surface" : "w-1.5 bg-surface/55"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails, from `sm` up. On a big screen the gallery finally has
          room to answer the question a buyer actually has — what else is
          there to see. Scrolls rather than wraps: twenty photos must not
          become four rows above the price. */}
      <ul className="no-scrollbar -mx-4 hidden gap-2 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:flex sm:px-0">
        {ordered.map((image, i) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label={`${alt} — ${i + 1}/${count}`}
              aria-current={i === real ? "true" : undefined}
              className={`relative block h-16 w-24 shrink-0 overflow-hidden rounded-control bg-muted-bg ring-2 transition ${
                i === real
                  ? "ring-brand"
                  : "ring-transparent hover:ring-line-strong"
              }`}
            >
              <Image
                /**
                 * `thumbUrl`, not `url`, and NOT optimized — the same call
                 * `ListingCard` makes, for the same reasons plus one more.
                 *
                 * This strip is 96×64. Routing it through the optimizer
                 * asked the server to downscale a 1600px original to 96px
                 * and then store three width variants of the result, per
                 * photo, per listing — billed work on Vercel and one more
                 * thing that can time out against a slow origin.
                 *
                 * The extra reason: `thumbUrl` is the exact URL the card
                 * this visitor just clicked already loaded, so it is
                 * normally served from their browser cache with no request
                 * at all.
                 */
                src={cdnSrc(image.thumbUrl)}
                alt=""
                fill
                loading="lazy"
                sizes="96px"
                unoptimized
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
