"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/src/i18n/config";

/**
 * The listing's location map — loaded only once somebody scrolls to it.
 *
 * ── Why this is not just `next/dynamic` ───────────────────────────────────
 *
 * It was, and `ssr: false` did its job: MapLibre stayed out of the server
 * render and out of every page that has no map. What it does NOT do is
 * wait. `dynamic()` starts fetching the moment the component renders, so
 * the 285 KB of MapLibre, its worker and its style were downloaded, parsed
 * and initialised during page load — for a map that sits below the
 * description, the specifications and the seller card, which most visitors
 * never reach.
 *
 * Lighthouse put a number on it: the listing page scored 60 with 3,010 ms
 * of Total Blocking Time, against the home page's 520 ms on the same
 * connection. The only structural difference between those two pages is
 * this map.
 *
 * So the import is now gated on an IntersectionObserver. Nothing is fetched
 * until the map is within 300px of the viewport, which on a phone is about
 * a screen of scrolling — early enough that it is drawn by the time it is
 * looked at, late enough that it costs the first paint nothing.
 *
 * ── The placeholder has to be the exact size of the map ───────────────────
 *
 * It did not used to be: the skeleton was a flat `h-72` while the map
 * itself is `h-72 sm:h-80 lg:h-96`, so on any screen above `sm` the box
 * grew by 32–96px the moment the map arrived, shoving everything below it
 * down. That is a layout shift, and the page measured 0.179. The sizes are
 * written once here and used by both states.
 */

const BOX = "h-72 w-full rounded-card sm:h-80 lg:h-96";

const LocationMap = dynamic(
  () => import("./LocationMap").then((m) => m.LocationMap),
  {
    ssr: false,
    // Between "in view" and "chunk arrived". Same box, so still no shift.
    loading: () => <div className={`animate-pulse bg-muted-bg ${BOX}`} />,
  },
);

export function LocationMapLoader(props: {
  centroid: [number, number] | null;
  ring: [number, number][] | null;
  lang: Lang;
  satellite?: boolean;
}) {
  const [near, setNear] = useState(false);
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = slot.current;
    if (!el) return;

    // No observer — an old browser, or a test environment. Show the map
    // rather than hiding it forever; a slow page beats a missing one.
    //
    // Through a timeout rather than a bare `setNear(true)`: a synchronous
    // setState in an effect body is the cascading render the compiler lint
    // rejects, and a tick's delay costs nothing on a path nothing takes.
    if (typeof IntersectionObserver === "undefined") {
      const id = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        // One-way latch: once loaded the map stays, and the observer has
        // nothing left to watch for.
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "300px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={slot}>
      {near ? (
        <LocationMap {...props} />
      ) : (
        <div className={`bg-muted-bg ${BOX}`} aria-hidden />
      )}
    </div>
  );
}
