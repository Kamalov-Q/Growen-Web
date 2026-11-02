import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { ProfileCard } from "@/src/features/settings/ProfileCard";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/profile";

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
      title: t(lang, "profile.title"),
      description: t(lang, "profile.lead"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function Profile({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title="">
      <div className="mx-auto w-full max-w-2xl">
        {/* Everything is inside the guard, heading included — see
            RequireAuth: nothing passed as children should be assumed
            private, and the account's own data is fetched by the client
            component from the session rather than rendered here. */}
        <RequireAuth lang={lang as Lang}>
          <ProfileCard lang={lang as Lang} />
        </RequireAuth>
      </div>
    </Page>
  );
}
