import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { EditProfileForm } from "@/src/features/account/EditProfileForm";
import { isLang, LANGS, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

const PATH = "/profile/edit";

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
      title: t(lang, "profile.edit"),
      description: t(lang, "profile.editLead"),
    }),
    // Nobody's account page belongs in an index, this one least of all.
    robots: { index: false, follow: false },
  };
}

export default async function EditProfile({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <Page
      lang={lang}
      path={PATH}
      title={t(lang, "profile.edit")}
      lead={t(lang, "profile.editLead")}
    >
      <div className="mx-auto w-full max-w-2xl">
        {/* Everything inside the guard — see RequireAuth. The form fetches
            the account's own data itself; none of it is rendered here. */}
        <RequireAuth lang={lang as Lang}>
          <EditProfileForm lang={lang as Lang} />
        </RequireAuth>
      </div>
    </Page>
  );
}
