import { notFound } from "next/navigation";
import { LegalBody } from "@/src/components/LegalBody";
import { Page } from "@/src/components/Page";
import { getLegalDocument } from "@/src/content";
import { LANGS, isLang } from "@/src/i18n/config";
import { pageMetadata } from "@/src/lib/metadata";

const SLUG = "terms" as const;
const PATH = "/terms";

/** Static at build time: prose that changes a few times a year. */
export const dynamic = "force-static";

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
  const doc = getLegalDocument(SLUG, lang);
  return pageMetadata({
    lang,
    path: PATH,
    title: doc.title,
    description: doc.summary,
  });
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const doc = getLegalDocument(SLUG, lang);

  return (
    <Page lang={lang} path={PATH} title={doc.title} lead={doc.summary}>
      <LegalBody doc={doc} />
    </Page>
  );
}
