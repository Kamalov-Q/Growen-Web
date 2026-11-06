import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";

/**
 * What stands in for the feed while the API is answering.
 *
 * Not a spinner: a spinner says "wait" and says nothing about what is
 * coming. This is the shape of the page that is about to arrive — the view
 * bar, the two chip rows, the result line and a grid of cards at the real
 * aspect ratio — so the layout is already settled when the listings land
 * and nothing jumps. Every box here matches the size of the thing that
 * replaces it; that is the whole job.
 *
 * It renders the GRID, because grid is the default and the overwhelming
 * majority of loads. Reading `?view=` to decide would mean touching
 * `searchParams` in the page shell, which is the one thing that would stop
 * the shell being servable before the request is even looked at.
 *
 * `aria-hidden` with a `busy` region around it: a screen reader should hear
 * "loading", once, not twelve empty cards.
 */
export function FeedSkeleton({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span role="status" className="sr-only">
        {t(lang, "common.loading")}
      </span>

      <div aria-hidden className="flex flex-col gap-5">
        {/* The view bar: two square tabs, the map button, Фильтры. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Box className="h-[2.75rem] w-[5.5rem] rounded-control" />
            <Box className="h-11 w-28 rounded-control" />
          </div>
          <Box className="h-11 w-32 rounded-control" />
        </div>

        {/* Purpose tabs, then category chips. */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Box className="h-9 w-24 rounded-full" />
            <Box className="h-9 w-28 rounded-full" />
            <Box className="h-9 w-24 rounded-full" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[80, 96, 64, 112, 80, 96].map((w, i) => (
              /* Uneven, like real category names. A row of identical pills
                 reads as a widget rather than as content on its way. */
              <Box key={i} className="h-8 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* The result count and the sort pills. */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <Box className="h-7 w-24 rounded-control" />
            <Box className="h-3.5 w-16 rounded-control" />
          </div>
          <Box className="h-9 w-56 rounded-control" />
        </div>

        {/* The cards. Ten is two rows on a phone and two on a desktop —
            enough to fill the fold at every breakpoint and no more. */}
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i}>
              <Box className="aspect-[4/5] w-full rounded-card sm:aspect-[3/4]" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** One grey block. `animate-pulse` is motion-safe by Tailwind's own reset. */
function Box({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className={`animate-pulse bg-muted-bg ${className}`} />
  );
}
