import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { tCreate } from "@/src/i18n/strings/create";
import { pageMetadata } from "@/src/lib/metadata";
import { CreateListingForm } from "@/src/features/listings/CreateListingForm";
import { fetchAmenities, fetchCategories } from "@/src/features/listings/api";

const PATH = "/add";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    ...pageMetadata({
      lang,
      path: PATH,
      title: tCreate(lang, "create.title"),
      description: tCreate(lang, "create.lead"),
    }),
    // Behind a sign-in and not a landing page: there is nothing here for a
    // search engine to rank, and an indexed page that every visitor is
    // bounced off is a bad result for them and for us.
    robots: { index: false, follow: false },
  };
}

/**
 * Posting a listing.
 *
 * The categories are fetched on the SERVER and handed to the form, so the
 * chips are there in the first paint rather than after a second round trip
 * the person watches.
 */
export default async function AddListing({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  // `.catch(() => [])` rather than a throw: the category list being
  // unavailable should not take the page down, and the form still shows
  // everything else.
  // Both in parallel: they are independent reads and waiting for one before
  // asking for the other adds a round trip to every page load.
  const [categories, amenities] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchAmenities().catch(() => []),
  ]);

  return (
    <Page lang={lang} path={PATH} title="">
      <div className="mx-auto w-full max-w-2xl">
        <RequireAuth lang={lang as Lang}>
          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-2">
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink">
                {tCreate(lang, "create.title")}
              </h1>
              <p className="text-[15px] leading-7 text-muted">
                {tCreate(lang, "create.lead")}
              </p>
            </header>

            <CreateListingForm
              lang={lang as Lang}
              categories={categories}
              amenities={amenities}
            />
          </div>
        </RequireAuth>
      </div>
    </Page>
  );
}
