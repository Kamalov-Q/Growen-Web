"use client";

export function Button({
  loading,
  variant = "primary",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-control px-4 text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45";
  const look =
    variant === "primary"
      ? "bg-brand text-brand-ink shadow-card hover:bg-brand-hover"
      : "text-ink ring-1 ring-line hover:bg-muted-bg";

  return (
    <button
      {...props}
      // A loading button that is still clickable submits twice. On the OTP
      // screen that is two SMS messages and a wasted rate-limit slot.
      disabled={props.disabled || loading}
      className={`${base} ${look} ${className}`}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
