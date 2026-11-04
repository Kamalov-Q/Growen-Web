/**
 * The three payment brands, as wordmarks.
 *
 * Drawn here rather than loaded as images for the reason the icon set
 * gives: three small marks are a few hundred bytes of markup against a
 * network round trip each, and these inherit the page's font so they sit on
 * the same baseline as the text beside them.
 *
 * The COLOURS are each company's own and do not follow the theme — a brand
 * recoloured to match a site is a brand nobody recognises, which defeats
 * the point of showing it. They are painted on their own light chip so they
 * read on both themes.
 */

export function PaymeBrand() {
  return (
    <span className="inline-flex items-center rounded-[0.4rem] bg-white px-2 py-1 ring-1 ring-black/5">
      <span className="text-[15px] font-bold lowercase tracking-tight text-[#00BBC7]">
        payme
      </span>
    </span>
  );
}

export function ClickBrand() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[0.4rem] bg-white px-2 py-1 ring-1 ring-black/5">
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5">
        <circle cx="8" cy="8" r="7" fill="#0073FF" />
        <circle cx="8" cy="8" r="3.2" fill="#FFFFFF" />
      </svg>
      <span className="text-[15px] font-bold lowercase tracking-tight text-[#18181B]">
        click
      </span>
    </span>
  );
}

export function PaynetBrand() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[0.4rem] bg-white px-2 py-1 ring-1 ring-black/5">
      <span className="grid size-4 place-items-center rounded-[0.25rem] bg-[#F59E0B] text-[11px] font-extrabold text-white">
        P
      </span>
      <span className="text-[15px] font-bold lowercase tracking-tight text-[#18181B]">
        paynet
      </span>
    </span>
  );
}
