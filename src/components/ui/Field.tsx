"use client";

import { forwardRef } from "react";

/**
 * One text field, styled like the app's.
 *
 * `prefix` is for the fixed "+998" that sits outside the editable area on
 * the phone screen — the country code is not something to type, mistype or
 * paste twice.
 */
export const Field = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    prefix?: string;
  }
>(function Field({ label, error, prefix, id, className = "", ...props }, ref) {
  const inputId = id ?? props.name ?? label;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-semibold text-muted">
        {label}
      </label>

      {/* The ring belongs on this box — it is what a person reads as "the
          field", prefix included. The control inside is stopped from
          drawing its own by an element-scoped rule in globals.css. */}
      <div
        className={`flex items-center gap-2 rounded-control bg-surface px-3.5 ring-1 transition ${
          error
            ? "ring-danger"
            : "ring-line focus-within:ring-2 focus-within:ring-brand"
        }`}
      >
        {prefix ? (
          <span className="select-none border-e border-line py-3 pe-3 text-[15px] font-medium text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint ${className}`}
        />
      </div>

      {/* `role="alert"` so a screen reader announces a validation failure
          instead of leaving it to be discovered visually. */}
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
