"use client";

/**
 * A checkbox that is actually styleable.
 *
 * `appearance-none` plus a drawn tick, rather than the native control: a
 * native checkbox cannot be sized or coloured consistently across browsers,
 * and at the size the rest of this form uses it looks like a mistake.
 *
 * It is still a real `<input type="checkbox">` underneath, so it keeps the
 * keyboard behaviour, the label association and the screen-reader semantics
 * that a div-with-a-click-handler throws away.
 */
export function Checkbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`peer size-5 cursor-pointer appearance-none rounded-[0.4rem] ring-1 transition ${
            checked ? "bg-brand ring-brand" : "bg-surface ring-line-strong"
          }`}
        />
        {/* `pointer-events-none` so the tick never eats the click meant for
            the input underneath it. */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`pointer-events-none absolute size-3.5 text-brand-ink transition ${
            checked ? "opacity-100" : "opacity-0"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>

      <label
        htmlFor={id}
        className="cursor-pointer text-[13px] leading-5 text-muted"
      >
        {children}
      </label>
    </div>
  );
}
