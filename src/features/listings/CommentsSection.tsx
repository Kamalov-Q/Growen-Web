"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/src/i18n/config";
import { t } from "@/src/i18n/dictionary";
import { Avatar } from "@/src/components/ui/Avatar";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { useSession } from "@/src/features/auth/session";
import { ApiError } from "@/src/lib/api";
import { absoluteTime, relativeTime } from "@/src/lib/time";
import {
  deleteComment,
  editComment,
  getComments,
  getReplies,
  likeComment,
  postComment,
  unlikeComment,
  type Comment,
  type CommentThread,
} from "./social-api";

/**
 * The questions people ask under a listing, and the seller's answers.
 *
 * One level of nesting and no more, which is the server's shape too: a
 * reply carries a `parentId` pointing at a ROOT comment, and replying to a
 * reply attaches to the same root. Threads that nest indefinitely are
 * unreadable on a phone and need a width nobody has.
 *
 * Reads are public — the comments are part of what makes this page worth
 * indexing. Posting needs a session, and the sign-in link carries `next`
 * so somebody who came to ask a question comes back to the listing they
 * were asking about.
 */
export function CommentsSection({
  lang,
  listingId,
}: {
  lang: Lang;
  listingId: string;
}) {
  const { user, status } = useSession();
  const [items, setItems] = useState<CommentThread[] | null>(null);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState<Comment | null>(null);

  useEffect(() => {
    let alive = true;
    getComments(listingId)
      .then((page) => {
        if (!alive) return;
        setItems(page.items);
        setTotal(page.total);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [listingId]);

  async function reload() {
    try {
      const page = await getComments(listingId);
      setItems(page.items);
      setTotal(page.total);
    } catch {
      setFailed(true);
    }
  }

  async function remove() {
    const target = deleting;
    setDeleting(null);
    if (!target) return;
    try {
      await deleteComment(listingId, target.id);
      await reload();
    } catch {
      setFailed(true);
    }
  }

  if (failed && !items) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-tight text-ink">
        {t(lang, "comments.title")}
        {total ? (
          <span className="nums rounded-full bg-muted-bg px-2 py-0.5 text-[12px] font-semibold text-muted">
            {total}
          </span>
        ) : null}
      </h2>

      {status === "authenticated" ? (
        <Composer
          lang={lang}
          listingId={listingId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onPosted={async () => {
            setReplyTo(null);
            await reload();
          }}
        />
      ) : (
        <Link
          href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/listing/${listingId}`)}`}
          className="rounded-card bg-surface p-4 text-center text-[14px] font-semibold text-brand shadow-card ring-1 ring-line transition hover:ring-brand-line"
        >
          {t(lang, "comments.signInToPost")}
        </Link>
      )}

      {items === null ? (
        <div className="h-28 animate-pulse rounded-card bg-muted-bg" />
      ) : !items.length ? (
        <div className="rounded-card bg-surface px-6 py-10 text-center shadow-card ring-1 ring-line">
          <p className="text-[15px] font-semibold text-ink">
            {t(lang, "comments.emptyTitle")}
          </p>
          <p className="mt-1 text-[14px] text-muted">
            {t(lang, "comments.emptyHint")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((thread) => (
            <li
              key={thread.id}
              className="rounded-card bg-surface p-4 shadow-card ring-1 ring-line transition hover:ring-line-strong"
            >
              <Bubble
                lang={lang}
                listingId={listingId}
                comment={thread}
                viewerId={user?.id ?? null}
                onReply={() => setReplyTo(thread)}
                onDelete={() => setDeleting(thread)}
                /* Patched in place rather than refetched: the thread is
                   already here and the server told us what it saved, so a
                   round trip would only redraw the same list. */
                onEdited={(body) =>
                  setItems((prev) =>
                    (prev ?? []).map((row) =>
                      row.id === thread.id
                        ? { ...row, body, updatedAt: new Date().toISOString() }
                        : row,
                    ),
                  )
                }
              />
              <Replies
                lang={lang}
                listingId={listingId}
                thread={thread}
                viewerId={user?.id ?? null}
                onReply={() => setReplyTo(thread)}
                onDelete={setDeleting}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t(lang, "comments.deleteTitle")}
        body={t(
          lang,
          deleting && deleting.replyCount > 0
            ? "comments.deleteThreadMessage"
            : "comments.deleteMessage",
        )}
        confirmLabel={t(lang, "common.delete")}
        cancelLabel={t(lang, "common.cancel")}
        danger
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}

/** The box at the top. It doubles as the reply box, with a header saying so. */
function Composer({
  lang,
  listingId,
  replyTo,
  onCancelReply,
  onPosted,
}: {
  lang: Lang;
  listingId: string;
  replyTo: Comment | null;
  onCancelReply: () => void;
  onPosted: () => void | Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replyName =
    [replyTo?.author?.name, replyTo?.author?.surname]
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  async function send() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      await postComment(listingId, {
        body: text,
        parentId: replyTo?.id,
      });
      setBody("");
      await onPosted();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t(lang, "auth.genericError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card ring-1 ring-line">
      {replyTo ? (
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <span className="min-w-0 flex-1 truncate">
            {t(lang, "comments.replyingTo", {
              name: replyName ?? t(lang, "detail.seller"),
            })}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label={t(lang, "common.cancel")}
            className="text-muted transition hover:text-ink"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="rounded-control bg-raised px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(lang, "comments.placeholder")}
          rows={2}
          maxLength={2000}
          className="w-full resize-y bg-transparent py-2.5 text-[15px] leading-6 text-ink outline-none placeholder:text-faint"
        />
      </div>

      {error ? (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void send()}
          disabled={!body.trim() || busy}
          className="rounded-control bg-brand px-4 py-2 text-[14px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-50"
        >
          {t(lang, "comments.send")}
        </button>
      </div>
    </div>
  );
}

/**
 * A root's replies: the few the list came with, and the rest on demand.
 *
 * The server sends a preview with each root (`replies`) and `replyCount`
 * says how many there are in all — so "show N more" asks for the remainder
 * rather than re-fetching what is already on screen.
 */
function Replies({
  lang,
  listingId,
  thread,
  viewerId,
  onReply,
  onDelete,
}: {
  lang: Lang;
  listingId: string;
  thread: CommentThread;
  viewerId: string | null;
  onReply: () => void;
  onDelete: (comment: Comment) => void;
}) {
  const [extra, setExtra] = useState<Comment[] | null>(null);
  const [busy, setBusy] = useState(false);
  /** Bodies saved in this sitting, by comment id — see `onEdited`. */
  const [edits, setEdits] = useState<Record<string, string>>({});

  const shown = (extra ?? thread.replies).map((reply) =>
    edits[reply.id] !== undefined
      ? { ...reply, body: edits[reply.id] ?? reply.body, updatedAt: new Date().toISOString() }
      : reply,
  );
  const hidden = thread.replyCount - shown.length;

  async function expand() {
    setBusy(true);
    try {
      const page = await getReplies(listingId, thread.id, 50, 0);
      setExtra(page.items);
    } catch {
      // The preview stays on screen; nothing is lost by a failed expand.
    } finally {
      setBusy(false);
    }
  }

  if (!shown.length && hidden <= 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-3 border-s border-line ps-4">
      {shown.map((reply) => (
        <Bubble
          key={reply.id}
          lang={lang}
          listingId={listingId}
          comment={reply}
          viewerId={viewerId}
          onReply={onReply}
          onDelete={() => onDelete(reply)}
          onEdited={(body) =>
            setEdits((prev) => ({ ...prev, [reply.id]: body }))
          }
        />
      ))}

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => void expand()}
          disabled={busy}
          className="self-start text-[13px] font-semibold text-brand transition hover:underline disabled:opacity-50"
        >
          {t(lang, "comments.showReplies", { count: hidden })}
        </button>
      ) : null}
    </div>
  );
}

/** One comment: who, what, when, and what you can do about it. */
function Bubble({
  lang,
  listingId,
  comment,
  viewerId,
  onReply,
  onDelete,
  onEdited,
}: {
  lang: Lang;
  listingId: string;
  comment: Comment;
  viewerId: string | null;
  onReply: () => void;
  onDelete: () => void;
  /** The saved body, so the row updates without refetching the thread. */
  onEdited: (body: string) => void;
}) {
  /**
   * The like is optimistic.
   *
   * The endpoints are idempotent and the count comes back with the answer,
   * so the worst case of a failed call is a number that corrects itself on
   * the next load — against a heart that would otherwise take a round trip
   * to light up.
   */
  const [liked, setLiked] = useState(comment.likedByMe);
  const [count, setCount] = useState(comment.likeCount);

  /** Editing happens in place: the body becomes the box it is typed in. */
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body ?? "");
  const [saving, setSaving] = useState(false);

  const name =
    [comment.author?.name, comment.author?.surname]
      .filter(Boolean)
      .join(" ")
      .trim() || null;
  const isMine = viewerId !== null && comment.authorId === viewerId;

  async function save() {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const updated = await editComment(listingId, comment.id, text);
      onEdited(updated.body ?? text);
      setEditing(false);
    } catch {
      // Left open with the text intact: a save that failed should not also
      // lose what was typed.
    } finally {
      setSaving(false);
    }
  }

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setCount((n) => n + (next ? 1 : -1));
    try {
      const res = next
        ? await likeComment(listingId, comment.id)
        : await unlikeComment(listingId, comment.id);
      setLiked(res.liked);
      setCount(res.likeCount);
    } catch {
      setLiked(!next);
      setCount((n) => n + (next ? -1 : 1));
    }
  }

  return (
    <article className="flex gap-3">
      <Link href={`/${lang}/users/${comment.authorId}`} className="shrink-0">
        <Avatar uri={comment.author?.avatarThumbUrl} name={name} size={36} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <Link
            href={`/${lang}/users/${comment.authorId}`}
            className="text-[14px] font-semibold text-ink transition hover:text-brand"
          >
            {name ?? t(lang, "detail.seller")}
          </Link>
          <span
            className="text-[12px] text-faint"
            title={absoluteTime(new Date(comment.createdAt))}
          >
            {relativeTime(comment.createdAt, lang)}
          </span>
          {/* Dirty, in the server's terms: it stamps `updatedAt` on an
              edit, so the two timestamps differing IS the edit. */}
          {comment.updatedAt !== comment.createdAt ? (
            <span className="rounded-full bg-muted-bg px-1.5 py-0.5 text-[11px] font-medium text-faint">
              {t(lang, "comments.edited")}
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <div className="rounded-control bg-raised px-3 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                maxLength={2000}
                autoFocus
                className="w-full resize-y bg-transparent py-2 text-[14px] leading-6 text-ink outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={!draft.trim() || saving}
                className="rounded-control bg-brand px-3 py-1.5 text-[13px] font-bold text-brand-ink transition hover:bg-brand-hover disabled:opacity-50"
              >
                {t(lang, "comments.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.body ?? "");
                  setEditing(false);
                }}
                className="rounded-control px-3 py-1.5 text-[13px] font-semibold text-muted transition hover:text-ink"
              >
                {t(lang, "common.cancel")}
              </button>
            </div>
          </div>
        ) : comment.body ? (
          <p className="whitespace-pre-line text-[14px] leading-6 text-ink-soft">
            {comment.body}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 pt-0.5">
          <button
            type="button"
            onClick={() => void toggleLike()}
            aria-pressed={liked}
            aria-label={t(lang, "comments.like")}
            className={`flex items-center gap-1.5 text-[13px] font-semibold transition ${
              liked ? "text-danger" : "text-muted hover:text-ink"
            }`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            >
              <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z" />
            </svg>
            {count > 0 ? <span className="nums">{count}</span> : null}
          </button>

          <button
            type="button"
            onClick={onReply}
            className="text-[13px] font-semibold text-muted transition hover:text-ink"
          >
            {t(lang, "comments.reply")}
          </button>

          {isMine && !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[13px] font-semibold text-muted transition hover:text-ink"
            >
              {t(lang, "comments.edit")}
            </button>
          ) : null}

          {isMine ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-[13px] font-semibold text-muted transition hover:text-danger"
            >
              {t(lang, "common.delete")}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
