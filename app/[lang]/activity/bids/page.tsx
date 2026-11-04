import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { MyBidsPanel } from "@/src/features/activity/panels";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/activity/bids";

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
      title: t(lang, "bids.myTitle"),
      description: t(lang, "bids.myHint"),
    }),
    // Somebody's own trail. Never indexed, and never followed.
    robots: { index: false, follow: false },
  };
}

export default async function BidsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title={t(lang, "bids.myTitle")}>
      <div className="mx-auto w-full max-w-2xl">
        <RequireAuth lang={lang as Lang}>
          <MyBidsPanel lang={lang as Lang} />
        </RequireAuth>
      </div>
    </Page>
  );
}
