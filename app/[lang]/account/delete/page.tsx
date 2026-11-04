import { notFound } from "next/navigation";
import Link from "next/link";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { DeleteAccountPanel } from "@/src/features/account/DeleteAccountPanel";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/account/delete";

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
      title: t(lang, "deleteAccount.title"),
      description: t(lang, "deleteAccount.intro"),
    }),
    /**
     * Not indexed — but /account-deletion, the published POLICY, is, and
     * deliberately so: that is the page the stores require to be findable
     * without an account. This one performs the deletion and needs a
     * session, so a crawler has nothing to read here.
     */
    robots: { index: false, follow: false },
  };
}

export default async function DeleteAccount({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title={t(lang, "deleteAccount.title")}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <RequireAuth lang={lang as Lang}>
          <DeleteAccountPanel lang={lang as Lang} />
        </RequireAuth>

        {/* The policy, for anybody who wants the whole text rather than the
            summary above it. Outside the guard: it is public. */}
        <p className="text-center text-[13px]">
          <Link
            href={`/${lang}/account-deletion`}
            className="text-muted underline underline-offset-4 transition hover:text-brand"
          >
            {t(lang, "deleteAccount.policy")}
          </Link>
        </p>
      </div>
    </Page>
  );
}
