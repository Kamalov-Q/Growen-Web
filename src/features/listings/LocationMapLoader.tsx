"use client";

import dynamic from "next/dynamic";

/**
 * A client boundary whose only job is to hold the `ssr: false` import.
 *
 * Next forbids `ssr: false` inside a Server Component — reasonably, since a
 * server component has no client to opt out on behalf of. The import has to
 * live behind a `"use client"` boundary, so this file is that boundary and
 * nothing else.
 *
 * The map is still kept out of the server render and out of the bundle of
 * any page that does not use it, which is the point.
 */
const LocationMap = dynamic(
  () => import("./LocationMap").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-card bg-muted-bg" />
    ),
  },
);

export function LocationMapLoader(props: {
  centroid: [number, number] | null;
  ring: [number, number][] | null;
  satellite?: boolean;
}) {
  return <LocationMap {...props} />;
}
