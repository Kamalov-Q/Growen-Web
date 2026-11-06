import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { ResultPanel } from "@/src/features/wallet/ResultPanel";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { tw } from "@/src/i18n/strings/wallet";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/wallet/result";

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
      title: tw(lang, "wallet.resultChecking"),
      description: tw(lang, "wallet.resultCheckingBody"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function TopupResult({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title="">
      <div className="mx-auto w-full max-w-2xl">
        <RequireAuth lang={lang as Lang}>
          {/* Suspense is REQUIRED: ResultPanel reads `useSearchParams`,
              which opts everything up to the nearest boundary out of static
              rendering — without one this route fails to build at all. */}
          <Suspense fallback={null}>
            <ResultPanel lang={lang as Lang} />
          </Suspense>
        </RequireAuth>
      </div>
    </Page>
  );
}
