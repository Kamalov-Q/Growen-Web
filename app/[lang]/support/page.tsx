import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { LANGS, isLang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { CONTACT } from "@/src/lib/site";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/support";

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
  return pageMetadata({
    lang,
    path: PATH,
    title: t(lang, "support.title"),
    description: t(lang, "support.lead"),
  });
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const rows = [
    {
      label: t(lang, "support.inApp"),
      value: t(lang, "support.inAppHint"),
      href: null,
    },
    // The phone goes ABOVE the written channels: somebody on a support page
    // usually wants an answer now, and a number is the only one of these
    // that gives them one.
    {
      label: t(lang, "support.phone"),
      value: CONTACT.phone,
      hint: t(lang, "support.phoneHint"),
      href: CONTACT.phoneHref,
    },
    { label: t(lang, "support.email"), value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { label: t(lang, "support.telegram"), value: "@growencity", href: CONTACT.telegram },
    {
      label: t(lang, "support.privacyNote"),
      value: CONTACT.privacyEmail,
      href: `mailto:${CONTACT.privacyEmail}`,
    },
  ];

  return (
    <Page
      lang={lang}
      path={PATH}
      title={t(lang, "support.title")}
      lead={t(lang, "support.lead")}
    >
      <dl className="flex flex-col gap-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-control border border-line bg-muted-bg p-4"
          >
            <dt className="text-sm font-medium text-muted">{row.label}</dt>
            <dd className="mt-1 text-[15px] leading-7 text-ink">
              {row.href ? (
                <a
                  href={row.href}
                  className="text-brand underline-offset-4 hover:underline"
                  {...(row.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {row.value}
                </a>
              ) : (
                row.value
              )}
              {"hint" in row && row.hint ? (
                <span className="block text-[13px] text-muted">{row.hint}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </Page>
  );
}
