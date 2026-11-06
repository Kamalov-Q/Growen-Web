import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { SessionsList } from "@/src/features/auth/SessionsList";
import { LANGS, isLang } from "@/src/i18n/config";
import { tSessions } from "@/src/i18n/strings/sessions";

const PATH = "/account/sessions";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const metadata = { robots: { index: false, follow: false } };

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    // The heading is INSIDE the guard. It used to sit outside, so a signed
    // -out visitor read "Faol seanslar" and a description of their devices
    // before being bounced to the login screen.
    <Page lang={lang} path={PATH} title="">
      <RequireAuth lang={lang}>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink">
              {tSessions(lang, "sessions.title")}
            </h1>
            <p className="max-w-2xl text-[15px] leading-7 text-muted">
              {tSessions(lang, "sessions.lead")}
            </p>
          </header>

          <SessionsList lang={lang} />
        </div>
      </RequireAuth>
    </Page>
  );
}
