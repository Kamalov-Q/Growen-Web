"use client";

import { useEffect, useId, useRef } from "react";

/**
 * A confirmation before something that cannot be undone, or that a person
 * would not want to trigger by accident.
 *
 * A real `<dialog>` with `showModal()`, so the browser supplies the focus
 * trap, the inert background, Escape and the top layer — all things a
 * hand-rolled overlay gets subtly wrong for keyboard and screen-reader
 * users.
 *
 * Focus moves to the CANCEL button on open, not the confirm one. The
 * dangerous action should never be one stray Enter away.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      cancelRef.current?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onCancel}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card bg-surface p-0 text-ink shadow-lift ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-3 p-6">
        <h2 id={titleId} className="text-[1.1rem] font-bold tracking-tight">
          {title}
        </h2>
        {body ? (
          <p className="text-[15px] leading-6 text-muted">{body}</p>
        ) : null}

        <div className="mt-2 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-control text-[15px] font-semibold text-ink ring-1 ring-line transition hover:bg-muted-bg"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 flex-1 rounded-control text-[15px] font-bold transition disabled:opacity-60 ${
              danger
                ? "bg-danger text-white hover:opacity-90"
                : "bg-brand text-brand-ink hover:bg-brand-hover"
            }`}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
