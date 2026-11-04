import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { ActivityHub } from "@/src/features/activity/ActivityHub";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/activity";

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
      title: t(lang, "activity.title"),
      description: t(lang, "activity.intro"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function Activity({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title={t(lang, "activity.title")}>
      <div className="mx-auto w-full max-w-2xl">
        <RequireAuth lang={lang as Lang}>
          <ActivityHub lang={lang as Lang} />
        </RequireAuth>
      </div>
    </Page>
  );
}
