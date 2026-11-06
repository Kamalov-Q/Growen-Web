import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { VerifyPanel } from "@/src/features/verification/VerifyPanel";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { tVerify } from "@/src/i18n/strings/verify";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/verify";

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
      title: tVerify(lang, "verify.title"),
      description: tVerify(lang, "verify.intro"),
    }),
    // An application for a badge, with passport scans in it. Not a page for
    // an index, and not one a crawler should keep a copy of.
    robots: { index: false, follow: false },
  };
}

export default async function Verify({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title={tVerify(lang, "verify.title")}>
      <div className="mx-auto w-full max-w-2xl">
        {/* Everything inside the guard — see RequireAuth. The panel asks the
            server where this account stands; nothing about it is rendered
            here, and the documents are never sent back by the API at all. */}
        <RequireAuth lang={lang as Lang}>
          <VerifyPanel lang={lang as Lang} />
        </RequireAuth>
      </div>
    </Page>
  );
}
