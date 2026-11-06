import { api } from "@/src/lib/api";
import type { Listing } from "@/src/lib/listing-types";

/**
 * What people say about a listing, and what they report about it.
 *
 * Three features behind one file because they share a parent: all of them
 * hang off `/listings/:id`, all of them are read by anybody and written
 * only by a signed-in account, and keeping them together is what stops
 * three nearly-identical author shapes drifting apart.
 *
 * READS are public — a guest sees the same reviews and comments as anyone,
 * which is the point of having them on an indexed page. WRITES need a
 * session, and the three that other people have to live with (a review, a
 * report) also need a verified phone, which the server enforces.
 */

export interface SocialAuthor {
  id: string;
  name: string | null;
  surname: string | null;
  avatarThumbUrl: string | null;
}

// ---- reviews --------------------------------------------------------------

export interface Review {
  id: string;
  authorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  author: SocialAuthor | null;
}

export interface ReviewsPage {
  count: number;
  /**
   * The listing's stars — what the marketplace concluded, read from the row
   * RatingService wrote. It will NOT match the bars, and should not: those
   * are the plain mean of what people typed, this carries the prior, the
   * age of the reviews and any upheld report.
   */
  average: number;
  /** The plain mean, for anyone who wants the arithmetic. Null with none. */
  reviewAverage: number | null;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  /** The caller's own review, and it is also pinned first in `items`. */
  mine: Review | null;
  items: Review[];
}

export const getReviews = (listingId: string, limit = 20, offset = 0) =>
  api<ReviewsPage>(
    `/listings/${listingId}/reviews?limit=${limit}&offset=${offset}`,
  );

/**
 * Leave a review, or replace the one you left.
 *
 * A PUT, and idempotent on purpose: "review" and "edit my review" are one
 * action from the reader's side. The server refuses an owner reviewing
 * their own listing (403 `OWN_LISTING`).
 */
export const upsertReview = (
  listingId: string,
  input: { rating: number; comment?: string },
) =>
  api<Review>(`/listings/${listingId}/reviews/mine`, {
    method: "PUT",
    body: input,
  });

/** Idempotent — withdrawing a review you never left succeeds. */
export const deleteReview = (listingId: string) =>
  api<void>(`/listings/${listingId}/reviews/mine`, { method: "DELETE" });

// ---- comments -------------------------------------------------------------

export interface Comment {
  id: string;
  listingId: string;
  parentId: string | null;
  authorId: string;
  body: string | null;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  author: SocialAuthor | null;
}

/** A root comment carries the first few of its replies with it. */
export interface CommentThread extends Comment {
  replies: Comment[];
}

export interface CommentsPage {
  total: number;
  items: CommentThread[];
}

export const getComments = (listingId: string, limit = 20, offset = 0) =>
  api<CommentsPage>(
    `/listings/${listingId}/comments?limit=${limit}&offset=${offset}`,
  );

/** The rest of one comment's replies, oldest first. */
export const getReplies = (
  listingId: string,
  commentId: string,
  limit = 20,
  offset = 0,
) =>
  api<{ total: number; items: Comment[] }>(
    `/listings/${listingId}/comments/${commentId}/replies?limit=${limit}&offset=${offset}`,
  );

export const postComment = (
  listingId: string,
  input: { body: string; parentId?: string },
) =>
  api<Comment>(`/listings/${listingId}/comments`, {
    method: "POST",
    body: input,
  });

export const editComment = (
  listingId: string,
  commentId: string,
  body: string,
) =>
  api<Comment>(`/listings/${listingId}/comments/${commentId}`, {
    method: "PATCH",
    body: { body },
  });

export const deleteComment = (listingId: string, commentId: string) =>
  api<void>(`/listings/${listingId}/comments/${commentId}`, {
    method: "DELETE",
  });

/** Both idempotent, so a double click cannot error. */
export const likeComment = (listingId: string, commentId: string) =>
  api<{ liked: boolean; likeCount: number }>(
    `/listings/${listingId}/comments/${commentId}/like`,
    { method: "PUT" },
  );

export const unlikeComment = (listingId: string, commentId: string) =>
  api<{ liked: boolean; likeCount: number }>(
    `/listings/${listingId}/comments/${commentId}/like`,
    { method: "DELETE" },
  );

// ---- reports --------------------------------------------------------------

/** Mirrors REPORT_REASONS on the server. Labels live client-side. */
export const REPORT_REASONS = [
  "FRAUD",
  "WRONG_INFO",
  "ALREADY_SOLD",
  "WRONG_PRICE",
  "DUPLICATE",
  "INAPPROPRIATE",
  "OTHER",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** `comment` is required when the reason is OTHER, optional otherwise. */
export const reportListing = (
  listingId: string,
  input: { reason: ReportReason; comment?: string },
) =>
  api<{ id: string }>(`/listings/${listingId}/report`, {
    method: "POST",
    body: input,
  });

// ---- the person behind a comment, a review or a listing -------------------

/**
 * Somebody's public profile.
 *
 * NOT public to a crawler, despite the name: `GET /users/:id` sits behind
 * `JwtAccessGuard` on the whole controller, so this needs a session. That
 * is the server's call and the page respects it rather than working around
 * it — a signed-out visitor is shown the sign-in prompt, not an empty
 * profile.
 *
 * Age, gender and address are deliberately absent. They were asked for at
 * registration, not written to be published.
 */
export interface PublicProfile {
  id: string;
  fullName: string | null;
  name: string | null;
  surname: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  avatarThumbUrl: string | null;
  isVerifiedRealtor: boolean;
  isMember: boolean;
  bio: string | null;
  socialLinks: Record<string, string> | null;
  createdAt: string;
  /** The first unfiltered page of their live listings. */
  listings: Listing[];
  /** The real total, which `listings` is only the first page of. */
  listingCount: number;
  stats: { ratingAvg?: number; ratingCount?: number } & Record<string, unknown>;
  /**
   * What this person's filter can offer, counted: only the purposes and
   * categories they actually have live listings in. Built by the server
   * rather than inferred from the first page, so a filter never offers a
   * choice that returns nothing.
   */
  facets: {
    purposes: Record<string, number>;
    categories: Record<string, number>;
  };
}

export type OwnerSort = "newest" | "oldest" | "priceAsc" | "priceDesc";

export interface OwnerListingsQuery {
  purpose?: string;
  category?: string;
  sort?: OwnerSort;
}

export const getUserProfile = (userId: string) =>
  api<PublicProfile>(`/users/${userId}`);

export const getUserListings = (
  userId: string,
  limit = 20,
  offset = 0,
  query: OwnerListingsQuery = {},
) => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (query.purpose) params.set("purpose", query.purpose);
  if (query.category) params.set("category", query.category);
  // `newest` is the server's default; sending it only lengthens the URL.
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);

  return api<{ total: number; items: Listing[] }>(
    `/users/${userId}/listings?${params}`,
  );
};

// ---- views ----------------------------------------------------------------

const DEVICE_KEY = "growencity.device";

/**
 * This browser, as far as the view counter is concerned.
 *
 * One view per person: a signed-in caller is counted by user id and a guest
 * by this. It is a random id in `localStorage` and nothing else — not a
 * fingerprint, not shared with anything, and worth no more than "the same
 * browser as last time", which is all the counter needs.
 */
function deviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    // Blocked storage means this visit is counted as a new guest each
    // time, which is a worse count and not a broken page.
    return null;
  }
}

/**
 * Record that this person opened the listing.
 *
 * Idempotent per viewer — `counted` says whether the number actually moved
 * — and the server pushes the new total to everyone watching the listing's
 * room, which is how the other tabs find out.
 */
export const recordView = (listingId: string) => {
  const id = deviceId();
  return api<{ viewCount: number; counted: boolean }>(
    `/listings/${listingId}/view`,
    { method: "POST", headers: id ? { "X-Device-Id": id } : undefined },
  );
};
