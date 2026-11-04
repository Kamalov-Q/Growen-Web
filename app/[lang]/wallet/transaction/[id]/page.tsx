import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { TransactionPanel } from "@/src/features/wallet/TransactionPanel";
import { isLang, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

/**
 * One operation.
 *
 * No `generateStaticParams`: the ids belong to one account's ledger and
 * there is nothing to prerender — every visit is a signed-in fetch.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    ...pageMetadata({
      lang,
      path: "/wallet/history",
      title: t(lang, "wallet.txDetailsTitle"),
      description: t(lang, "wallet.transactions"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function Transaction({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page
      lang={lang}
      path={`/wallet/transaction/${id}`}
      title={t(lang, "wallet.txDetailsTitle")}
    >
      <div className="mx-auto w-full max-w-2xl">
        <RequireAuth lang={lang as Lang}>
          <TransactionPanel lang={lang as Lang} id={id} />
        </RequireAuth>
      </div>
    </Page>
  );
}
