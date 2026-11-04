import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { MyCommentsPanel } from "@/src/features/activity/panels";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/activity/comments";

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
      title: t(lang, "activity.comments"),
      description: t(lang, "activity.commentsHint"),
    }),
    // Somebody's own trail. Never indexed, and never followed.
    robots: { index: false, follow: false },
  };
}

export default async function CommentsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title={t(lang, "activity.comments")}>
      <div className="mx-auto w-full max-w-2xl">
        <RequireAuth lang={lang as Lang}>
          <MyCommentsPanel lang={lang as Lang} />
        </RequireAuth>
      </div>
    </Page>
  );
}
