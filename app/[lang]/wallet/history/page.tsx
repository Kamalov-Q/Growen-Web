import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { AccountScreen } from "@/src/features/account/AccountScreen";
import { HistoryPanel } from "@/src/features/wallet/HistoryPanel";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/wallet/history";

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
      title: t(lang, "wallet.historyTitle"),
      description: t(lang, "wallet.lead"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function WalletHistoryPage({
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
          title={t(lang, "wallet.historyTitle")}
          lead={t(lang, "wallet.history")}
        >
          <HistoryPanel lang={lang as Lang} />
        </AccountScreen>
      </RequireAuth>
    </Page>
  );
}
