import { notFound } from "next/navigation";
import { Page } from "@/src/components/Page";
import { RequireAuth } from "@/src/features/auth/RequireAuth";
import { UserProfilePanel } from "@/src/features/listings/UserProfilePanel";
import { isLang, type Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { pageMetadata } from "@/src/lib/metadata";

/**
 * Somebody else's profile.
 *
 * No `generateStaticParams` and no indexing: `GET /users/:id` sits behind
 * the access guard, so there is nothing a crawler could read here even if
 * it were invited. The listings themselves are indexed on their own pages,
 * which is where that value belongs.
 */
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
      path: "/users",
      title: t(lang, "userProfile.title"),
      description: t(lang, "userProfile.ads"),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function UserProfile({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();


  return (
    <Page lang={lang} path={`/users/${id}`} title="">
      <div className="mx-auto w-full max-w-3xl">
        <RequireAuth lang={lang as Lang}>
          <UserProfilePanel lang={lang as Lang} userId={id} />
        </RequireAuth>
      </div>
    </Page>
  );
}
