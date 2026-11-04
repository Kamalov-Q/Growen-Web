import { api } from "@/src/lib/api";

/**
 * Your own trail: what you said, what you liked, what you were offered, and
 * who you shut out.
 *
 * Everything here is keyed by the SESSION — there is no id in any path, and
 * so no way to ask for somebody else's. That is the app's rule for these
 * endpoints (`/me/...`) and it is the reason this file can be this short:
 * the server decides whose activity this is, not the caller.
 */

/** Mirrors ACTIVITY_PAGE in the app. */
export const ACTIVITY_PAGE = 20;

export interface ActivityPage<T> {
  total: number;
  items: T[];
}

/** Just enough of a listing to render a row and navigate back into it. */
export interface ActivityListing {
  id: string;
  title: string | null;
  thumbUrl: string | null;
}

export interface ActivityComment {
  id: string;
  body: string | null;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  createdAt: string;
  listing: ActivityListing | null;
  /** A reply rather than a top-level comment. */
  isReply: boolean;
}

export interface ActivityReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  listing: ActivityListing | null;
}

const page = (limit: number, offset: number) =>
  `limit=${limit}&offset=${offset}`;

export const myComments = (limit = ACTIVITY_PAGE, offset = 0) =>
  api<ActivityPage<ActivityComment>>(`/me/comments?${page(limit, offset)}`);

export const myLikedComments = (limit = ACTIVITY_PAGE, offset = 0) =>
  api<ActivityPage<ActivityComment>>(
    `/me/comment-likes?${page(limit, offset)}`,
  );

export const myReviews = (limit = ACTIVITY_PAGE, offset = 0) =>
  api<ActivityPage<ActivityReview>>(`/me/reviews?${page(limit, offset)}`);

// ---- price offers ---------------------------------------------------------

export type PriceBidStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "COUNTERED"
  | "WITHDRAWN"
  | "EXPIRED";

/** Who put the number on the table — the buyer, or the seller countering. */
export type PriceBidDirection = "BUYER" | "SELLER";

export interface MyPriceBid {
  id: string;
  listingId: string;
  /** The buyer, on both directions — the pair identifies the negotiation. */
  bidderId: string;
  ownerId: string;
  /** Who made THIS number. */
  authorId: string;
  direction: PriceBidDirection;
  status: PriceBidStatus;
  amount: number;
  currency: string;
  /** What was being asked when the offer was made. Null on older rows. */
  askingAmount: number | null;
  askingCurrency: string | null;
  expiresAt: string;
  createdAt: string;
  /** Null when the advert has since been deleted outright. */
  listing: { id: string; title: string | null; status: string } | null;
}

export const myBids = (limit = ACTIVITY_PAGE, offset = 0) =>
  api<ActivityPage<MyPriceBid>>(`/me/bids?${page(limit, offset)}`);

// ---- notifications --------------------------------------------------------

export interface NotificationActor {
  id: string;
  name: string | null;
  surname: string | null;
  avatarThumbUrl: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  /** Null when the platform is the actor — a video of yours going live. */
  actor: NotificationActor | null;
  listing: { id: string; title: string | null; thumbUrl?: string | null } | null;
  video: { id: string; thumbUrl?: string | null } | null;
  meta: Record<string, unknown> | null;
}

export const myNotifications = (limit = ACTIVITY_PAGE, offset = 0) =>
  api<ActivityPage<AppNotification>>(`/me/notifications?${page(limit, offset)}`);

export const unreadCount = () =>
  api<{ count: number }>("/me/notifications/unread-count");

/** Marks everything read. The server answers with how many it changed. */
export const markAllRead = () =>
  api<{ read: number }>("/me/notifications/read", {
    method: "POST",
    body: {},
  });

// ---- blocked people -------------------------------------------------------

export interface BlockedPerson {
  id: string;
  name: string | null;
  surname: string | null;
  avatarThumbUrl: string | null;
  blockedAt: string;
}

export const myBlocks = () => api<BlockedPerson[]>("/me/blocks");

/** Idempotent, so a double click can never error. */
export const unblock = (userId: string) =>
  api<{ blocked: boolean }>(`/users/${userId}/block`, { method: "DELETE" });
