import type { Lang } from "@/src/i18n/config";

/**
 * The heading block every account page shares.
 *
 * A SERVER component, but it is rendered inside `RequireAuth`, so its text
 * reaches the RSC payload of a signed-out visitor. That is fine for a page
 * title and a sentence of description, and is exactly the boundary
 * RequireAuth documents: labels may pass through, data may not.
 */
export function AccountScreen({
  title,
  lead,
  children,
}: {
  lang: Lang;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        <p className="max-w-2xl text-[15px] leading-7 text-muted">{lead}</p>
      </header>
      {children}
    </div>
  );
}
