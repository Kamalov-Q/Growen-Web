import { notFound } from "next/navigation";
import { LegalBody } from "@/src/components/LegalBody";
import { Page } from "@/src/components/Page";
import { getLegalDocument } from "@/src/content";
import { LANGS, isLang } from "@/src/i18n/config";
import { pageMetadata } from "@/src/lib/metadata";
import { t } from "@/src/i18n/dictionary";
import { CONTACT } from "@/src/lib/site";

const SLUG = "account-deletion" as const;
const PATH = "/account-deletion";

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
    /* `wide`, so the contents list has a column of its own beside the
       text. The ARTICLE keeps a prose measure — see LegalBody's grid — so
       the lines do not stretch with the container. */
    <Page lang={lang} path={PATH} title={doc.title} lead={doc.summary} width="wide">
      {/* Both routes to deletion, above the prose.
          Google Play requires a working account-deletion URL and a reviewer
          arrives with a checklist and minutes. The document below answers
          everything, but it answers it in six sections — and the body text
          promises "the address is at the end of this page", which is a
          promise worth keeping where somebody can see it.

          A plain mailto with the subject prefilled: anything cleverer is a
          form that can fail silently, on the one page where failing
          silently means a person cannot delete their account. */}
      <div className="mb-12 flex flex-col gap-3">
        <h2 className="text-[1.05rem] font-bold tracking-tight text-ink">
          {t(lang, "deletion.howTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-card ring-1 ring-line">
            <span className="text-[15px] font-semibold text-ink">
              {t(lang, "deletion.inApp")}
            </span>
            <span className="text-[14px] leading-6 text-muted">
              {t(lang, "deletion.inAppHint")}
            </span>
          </div>

          <a
            href={`mailto:${CONTACT.privacyEmail}?subject=${encodeURIComponent("Account deletion")}`}
            className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-card ring-1 ring-line transition hover:ring-brand"
          >
            <span className="text-[15px] font-semibold text-ink">
              {t(lang, "deletion.byMail")}
            </span>
            <span className="text-[14px] leading-6 text-muted">
              {t(lang, "deletion.byMailHint")}
            </span>
            <span className="mt-1 text-[14px] font-semibold text-brand">
              {CONTACT.privacyEmail}
            </span>
          </a>
        </div>
      </div>

      <LegalBody doc={doc} lang={lang} />
    </Page>
  );
}
