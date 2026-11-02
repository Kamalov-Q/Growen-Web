import type { Lang } from "@/src/i18n/config";
import { SITE_NAME, SITE_URL } from "@/src/lib/site";
import { num, type ListingDetail } from "@/src/lib/listing-types";
import { primaryOffer } from "./format";

/**
 * Structured data, so Google can show this as a rich result rather than a
 * blue link.
 *
 * `Product` with an `Offer`, not `RealEstateListing`. The latter is the more
 * precise vocabulary and Google does not currently build rich results from
 * it; Product/Offer is what actually renders a price in search. The types
 * are not mutually exclusive, so the `additionalType` points at the real
 * one for anything that does understand it.
 *
 * Only ACTIVE listings get an `InStock` offer — marking a sold property as
 * available is the kind of mismatch that gets structured data ignored
 * site-wide, not just on one page.
 */
export function ListingJsonLd({
  listing,
  lang,
}: {
  listing: ListingDetail;
  lang: Lang;
}) {
  const offer = primaryOffer(listing);
  const price = offer ? num(offer.price) : null;
  const url = `${SITE_URL}/${lang}/listing/${listing.id}`;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    additionalType: "https://schema.org/Accommodation",
    "@id": url,
    url,
    name: listing.title ?? undefined,
    description: listing.descriptionText?.slice(0, 500) ?? undefined,
    image: listing.images.slice(0, 5).map((i) => i.url),
    ...(listing.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: listing.address,
            addressCountry: "UZ",
          },
        }
      : {}),
    ...(listing.centroid
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: listing.centroid.coordinates[1],
            longitude: listing.centroid.coordinates[0],
          },
        }
      : {}),
    ...(price !== null && offer
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: offer.currency,
            availability:
              listing.status === "ACTIVE"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            url,
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {}),
    ...(listing.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.ratingAvg,
            reviewCount: listing.ratingCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      // The only safe use of this prop: the argument is JSON.stringify of an
      // object we built, not anything a user typed.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
