import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthShell } from "@/src/components/AuthShell";
import { SignInForm } from "@/src/features/auth/SignInForm";
import { LANGS, isLang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/login";

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
      title: t(lang, "auth.title"),
      description: t(lang, "auth.lead"),
    }),
    // Nothing to index on a sign-in form, and a login page competing in
    // search results for the brand name is worse than no result at all.
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  // The shell is a server component; only the form inside is client, so the
  // page is still prerendered — what hydrates is the form, not the page.
  return (
    <AuthShell lang={lang} path={PATH}>
      {/* `useSearchParams()` inside the form reads `?next=`, and Next
          refuses to prerender a page that calls it without a boundary —
          the whole static page would otherwise have to become dynamic.
          The fallback matches the form's own height so the card does not
          resize as it hydrates. */}
      <Suspense fallback={<div className="h-[22rem]" />}>
        <SignInForm lang={lang} />
      </Suspense>
    </AuthShell>
  );
}
