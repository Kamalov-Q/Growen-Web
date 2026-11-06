import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { AccountScreen } from "@/src/features/account/AccountScreen";
import { TopupPanel } from "@/src/features/wallet/TopupPanel";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { tw } from "@/src/i18n/strings/wallet";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/wallet";

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
      title: tw(lang, "wallet.title"),
      description: tw(lang, "wallet.lead"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function WalletPage({
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
          title={tw(lang, "wallet.topupTitle")}
          lead={tw(lang, "wallet.lead")}
        >
          <TopupPanel lang={lang as Lang} />
        </AccountScreen>
      </RequireAuth>
    </Page>
  );
}
