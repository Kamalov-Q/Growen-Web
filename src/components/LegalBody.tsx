import type { LegalBlock, LegalDocument } from "@/src/content/types";

/**
 * Renders a legal document. A server component with no interactivity, so
 * these pages ship zero JavaScript — the whole reason the content is data
 * rather than JSX.
 *
 * Headings carry their section id so every clause is linkable. That is not
 * decoration: support replies and store reviewers both need to point at one
 * specific paragraph, and "see the retention section" is worse than a URL.
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
          className="rounded-control border border-line bg-muted-bg px-4 py-3 text-[15px] leading-7"
          // Not decorative: it is usually the sentence a reader most needs,
          // and a screen reader should announce it as its own region.
          role="note"
        >
          {block.text}
        </aside>
      );

    case "table":
      return (
        // Horizontally scrollable on a phone rather than squeezed: a
        // retention table with a wrapped two-word column is unreadable.
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[22rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-line">
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="py-2 pr-4 font-semibold text-ink"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map(([a, b]) => (
                <tr key={a} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-4 align-top text-ink-soft">{a}</td>
                  <td className="py-2 align-top text-muted">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LegalBody({ doc }: { doc: LegalDocument }) {
  return (
    <div className="flex flex-col gap-10">
      {/* A table of contents, because these documents are reference material.
          Nobody reads a privacy policy start to finish; they arrive looking
          for one answer. */}
      <nav
        aria-label={doc.title}
        className="rounded-control border border-line bg-muted-bg p-4"
      >
        <ol className="flex flex-col gap-1.5 text-[15px]">
          {doc.sections.map((section, i) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-muted underline-offset-4 hover:text-brand hover:underline"
              >
                <span className="tabular-nums">{i + 1}.</span> {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {doc.sections.map((section) => (
        <section key={section.id} id={section.id} className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {section.heading}
          </h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
