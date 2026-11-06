import type { Lang } from "@/src/i18n/config";
import { t, type TParams, type UiKey } from "@/src/i18n/dictionary";
import { tBids, type BidsKey } from "@/src/i18n/strings/bids";
import { tComments, type CommentsKey } from "@/src/i18n/strings/comments";
import {
  tNotifications,
  type NotificationsKey,
} from "@/src/i18n/strings/notifications";
import { tReviews, type ReviewsKey } from "@/src/i18n/strings/reviews";

/**
 * One `t` for the activity hub, which is the one screen that indexes other
 * screens.
 *
 * Its rows are tables of keys — a notification label here, a bid status
 * there, the empty state of the reviews list — so a single namespace type
 * cannot describe them, and a row cannot know which module its key came
 * from. This resolves that at the one place where the mixing happens,
 * leaving every other screen on its own namespace.
 *
 * The dispatch is on the key's own prefix, which is the thing that was
 * already true of every key in the app; nothing here invents a convention.
 * It also means the activity feature — and only it — pulls all four of
 * these namespaces into its chunk, which is correct: it is the screen that
 * genuinely shows all four.
 */
export type ActivityKey =
  UiKey | BidsKey | CommentsKey | NotificationsKey | ReviewsKey;

export function tLabel(lang: Lang, key: ActivityKey, params?: TParams): string {
  if (key.startsWith("bids.")) return tBids(lang, key as BidsKey, params);
  if (key.startsWith("comments."))
    return tComments(lang, key as CommentsKey, params);
  if (key.startsWith("notifications."))
    return tNotifications(lang, key as NotificationsKey, params);
  if (key.startsWith("reviews."))
    return tReviews(lang, key as ReviewsKey, params);
  return t(lang, key as UiKey, params);
}
