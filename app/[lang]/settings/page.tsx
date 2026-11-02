import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { SettingsPanel } from "@/src/features/settings/SettingsPanel";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/settings";

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
      title: t(lang, "settings.title"),
      description: t(lang, "settings.lead"),
    }),
    // Personal preferences — nothing for a search engine to rank.
    robots: { index: false, follow: false },
  };
}

/**
 * Settings.
 *
 * NOT behind a sign-in, unlike the profile: appearance, language and
 * currency are preferences of the BROWSER, and a signed-out visitor who
 * wants the site in dark Russian with prices in so'm is entitled to that.
 * The rows that do need an account say so and link to sign-in.
 */
export default async function Settings({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page lang={lang} path={PATH} title="">
      <div className="mx-auto w-full max-w-2xl">
        <SettingsPanel lang={lang as Lang} />
      </div>
    </Page>
  );
}
