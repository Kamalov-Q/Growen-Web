import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { LEGAL_UPDATED } from "@/src/lib/site";
import type { LegalBlock, LegalDocument } from "@/src/content/types";

/**
 * Renders a legal document. A server component with no interactivity, so
 * these pages ship zero JavaScript — the whole reason the content is data
 * rather than JSX.
 *
 * ── Who actually reads these ───────────────────────────────────────────────
 *
 * Two audiences, and neither reads start to finish.
 *
 * A store reviewer arrives with a checklist — is there a deletion path, what
 * is retained, for how long — and has minutes. A user arrives with one
 * question, usually after something went wrong. Both are SCANNING, which is
 * why the contents list is a fixed sidebar on a wide screen rather than a
 * box at the top that scrolls away the moment you start reading, and why
 * every heading is its own anchor.
 *
 * That matters commercially: Google Play requires a privacy policy URL and,
 * for any app with accounts, a working account-deletion URL. A reviewer who
 * cannot find the answer rejects the submission.
 */
function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="text-[15px] leading-7 text-ink-soft">{block.text}</p>;

    case "ul":
      return (
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-7 text-ink-soft marker:text-brand">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );

    case "note":
      return (
        <aside
          // Not decorative: it is usually the sentence a reader most needs,
          // and a screen reader should announce it as its own region.
          role="note"
          className="flex gap-3 rounded-card bg-brand-soft px-4 py-3.5 text-[15px] leading-7 text-ink ring-1 ring-brand-line"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="mt-1 size-5 shrink-0 text-brand"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16.5v-5M12 8v.2" />
          </svg>
          <span>{block.text}</span>
        </aside>
      );

    case "table":
      return (
        // Horizontally scrollable on a phone rather than squeezed: a
        // retention table with a wrapped two-word column is unreadable.
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[22rem] overflow-hidden rounded-card text-left text-[15px] ring-1 ring-line">
            <thead>
              <tr className="bg-muted-bg">
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-faint"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map(([a, b]) => (
                <tr
                  key={a}
                  className="border-t border-line bg-surface align-top"
                >
                  <td className="px-4 py-3 font-medium text-ink">{a}</td>
                  <td className="px-4 py-3 text-muted">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LegalBody({ doc, lang }: { doc: LegalDocument; lang: Lang }) {
  const contents = (
    <ol className="flex flex-col gap-0.5 text-[14px]">
      {doc.sections.map((section, i) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="flex gap-2.5 rounded-control px-3 py-2 text-muted transition hover:bg-muted-bg hover:text-ink"
          >
            <span className="nums w-4 shrink-0 text-faint">{i + 1}</span>
            <span>{section.heading}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,44rem)_15rem] lg:items-start lg:gap-14">
      <article className="flex min-w-0 flex-col gap-11 lg:col-start-1">
        {doc.sections.map((section, i) => (
          <section
            key={section.id}
            id={section.id}
            /* `scroll-mt` clears the sticky header. Without it a jump from
               the contents list lands the heading underneath the bar and the
               reader thinks the link went to the wrong place. */
            className="flex scroll-mt-28 flex-col gap-4"
          >
            <h2 className="group flex items-baseline gap-3 text-[1.2rem] font-bold tracking-tight text-ink">
              <span className="nums text-[0.95rem] font-semibold text-brand">
                {i + 1}
              </span>
              <span>{section.heading}</span>
              {/* A permalink per clause. Support replies and store reviewers
                  both need to point at one paragraph, and "see the retention
                  section" is worse than a URL. Hidden until hover or focus so
                  it does not clutter the reading. */}
              <a
                href={`#${section.id}`}
                aria-label={section.heading}
                className="text-faint opacity-0 transition hover:text-brand focus-visible:opacity-100 group-hover:opacity-100"
              >
                #
              </a>
            </h2>
            {section.blocks.map((block, bi) => (
              <Block key={bi} block={block} />
            ))}
          </section>
        ))}
      </article>

      {/* The contents.
          On a wide screen it sticks beside the text, because the reader is
          looking for one answer and should be able to jump again without
          scrolling back up. Below `lg` it sits ABOVE the document — a
          scanning reader needs to see the shape of it before committing,
          and a phone has no room for a column. */}
      <nav
        aria-label={doc.title}
        className="row-start-1 flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-line lg:sticky lg:top-24 lg:col-start-2"
      >
        <p className="px-3 text-[12px] font-semibold uppercase tracking-wide text-faint">
          {t(lang, "legal.contents")}
        </p>
        {contents}
        <p className="nums border-t border-line px-3 pt-3 text-[12px] text-faint">
          {t(lang, "footer.updated")} {LEGAL_UPDATED}
        </p>
      </nav>
    </div>
  );
}
