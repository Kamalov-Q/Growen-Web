import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { AccountList } from "@/src/features/account/AccountList";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";
import { AccountScreen } from "@/src/features/account/AccountScreen";

const PATH = "/saved";

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
      title: t(lang, "saved.title"),
      description: t(lang, "saved.lead"),
    }),
    // Somebody's own account data — nothing for a search engine to rank,
    // and an indexed page every visitor is bounced off is a bad result.
    robots: { index: false, follow: false },
  };
}

export default async function Saved({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title="">
      <RequireAuth lang={lang as Lang}>
        <AccountScreen
          lang={lang as Lang}
          title={t(lang, "saved.title")}
          lead={t(lang, "saved.lead")}
        >
          <AccountList
            lang={lang as Lang}
            source="saved"
            empty={t(lang, "saved.empty")}
          />
        </AccountScreen>
      </RequireAuth>
    </Page>
  );
}
