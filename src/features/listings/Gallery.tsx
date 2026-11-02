import Image from "next/image";
import type { ListingImage } from "@/src/lib/listing-types";

/**
 * The photos, as a scrollable strip.
 *
 * A SERVER component with no JavaScript: `overflow-x-auto` plus CSS scroll
 * snapping gives swipe on a phone and a drag-scroll on a desktop, which is
 * the whole of what a carousel does here. A JS carousel would add a
 * dependency, a hydration cost and a layout shift to achieve the same thing.
 *
 * The first photo is `priority` — it is the largest element above the fold,
 * so it IS the Largest Contentful Paint. Lazy-loading it would mean
 * measuring LCP from the moment the browser got round to it.
 */
export function Gallery({
  images,
  alt,
}: {
  images: ListingImage[];
  alt: string;
}) {
  if (!images.length) {
    return (
      <div className="aspect-[16/10] w-full rounded-control bg-muted-bg" />
    );
  }

  const ordered = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.position - b.position;
  });

  if (ordered.length === 1) {
    const only = ordered[0]!;
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-control bg-muted-bg">
        <Image
          src={only.url}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      // Announced as a group so a screen reader says how many photos there
      // are rather than reading each as a loose image.
      role="group"
      aria-label={alt}
    >
      {ordered.map((image, i) => (
        <div
          key={image.id}
          className="relative aspect-[16/10] w-[85%] shrink-0 snap-center overflow-hidden rounded-control bg-muted-bg sm:w-[70%]"
        >
          <Image
            src={image.url}
            alt={`${alt} — ${i + 1}`}
            fill
            priority={i === 0}
            sizes="(max-width: 768px) 85vw, 540px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
