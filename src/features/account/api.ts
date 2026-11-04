import { api, getAccessToken, refreshSession } from "@/src/lib/api";
import { API_URL } from "@/src/lib/site";
import type { Listing } from "@/src/lib/listing-types";
import type { SocialLinks } from "./social";

/**
 * The signed-in account's own data.
 *
 * All of it goes through `api()`, which attaches the access token and
 * refreshes it once on a 401 — these endpoints are not public and must not
 * be reached any other way.
 */

/** The account page's three totals. The lists paginate; the counts do not. */
export interface AccountCounts {
  mine: number;
  mineActive: number;
  saved: number;
}

export const getCounts = () => api<AccountCounts>("/listings/counts");

/**
 * The owner's own profile — the half of an account the SESSION does not
 * carry.
 *
 * The session user is minted at sign-in and holds a name, a phone and an
 * avatar. Everything a profile is actually read for — the bio, the social
 * accounts, how long the account has existed — lives only here, and so does
 * a fresher `isVerifiedRealtor`: the session copy still says no for
 * somebody approved this morning.
 *
 * Mirrors the server's ProfileResponse and the app's `Profile`.
 */
export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  surname: string | null;
  avatarUrl: string | null;
  avatarThumbUrl: string | null;
  phoneNumber: string | null;
  language: "uz" | "ru";
  isVerifiedRealtor: boolean;
  /** Only ever on your OWN profile. */
  birthDate: string | null;
  age: number | null;
  gender: "MALE" | "FEMALE" | null;
  address: string | null;
  bio: string | null;
  socialLinks: SocialLinks | null;
  createdAt: string;
}

export const getProfile = () => api<Profile>("/profile");

/**
 * Everything the owner can change about themselves.
 *
 * A PATCH: anything left out is untouched, which is what lets the form send
 * only the fields somebody actually edited. `null` clears an optional
 * answer — an empty string is refused by the server, so taking an answer
 * back has to be explicit.
 *
 * Phone and email are absent on purpose: each is owned by the sign-in
 * method that verified it.
 */
export interface UpdateProfileInput {
  name?: string;
  /**
   * `null` clears it. The DTO's validators are skipped for null (class
   * -validator's `@IsOptional` ignores null as well as undefined) and the
   * service writes it straight through, which is the only way to take a
   * surname back — an empty string is refused by `@Length(2, 64)`.
   */
  surname?: string | null;
  /** `YYYY-MM-DD`. */
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | null;
  bio?: string | null;
  socialLinks?: SocialLinks;
}

export const updateProfile = (input: UpdateProfileInput) =>
  api<Profile>("/profile", { method: "PATCH", body: input });

/** The server's own cap (ProfileController: AVATAR_MAX_SIZE). */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Replace the avatar.
 *
 * Not through `api()`: that helper sets `Content-Type: application/json`,
 * and a multipart body must carry the boundary the runtime generates —
 * setting the header by hand makes the body unparseable. Same reasoning,
 * and the same shape, as `uploadImages` in the listing form.
 *
 * The body is REBUILT for the retry. A FormData stream cannot be replayed
 * once consumed, so retrying with the same object uploads nothing and
 * succeeds emptily.
 */
export async function uploadAvatar(file: File): Promise<Profile> {
  const send = async (): Promise<Response> => {
    const form = new FormData();
    form.append("file", file, file.name || "avatar.jpg");
    const token = getAccessToken();
    return fetch(`${API_URL}/profile/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: form,
    });
  };

  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok) throw new Error(`avatar upload failed: ${res.status}`);

  return (await res.json()) as Profile;
}

export const removeAvatar = () =>
  api<Profile>("/profile/avatar", { method: "DELETE" });

/**
 * Delete this account, for good.
 *
 * 204 and nothing back. By the time it answers, the server has already
 * scrubbed the personal fields, taken the listings down and revoked every
 * refresh token — so the caller must tear the session down LOCALLY rather
 * than calling the usual sign-out, whose POST /auth/logout would now answer
 * 401 against an account that no longer exists.
 *
 * The reason is optional and goes nowhere near the decision: it is read by
 * people, afterwards, to learn why somebody left.
 */
export const deleteAccount = (reason?: string) =>
  api<void>("/profile", {
    method: "DELETE",
    body: reason ? { reason } : {},
  });

export const getMine = (limit = 24, offset = 0) =>
  api<Listing[]>(`/listings/mine?limit=${limit}&offset=${offset}`);

export const getSaved = (limit = 24, offset = 0) =>
  api<Listing[]>(`/listings/saved?limit=${limit}&offset=${offset}`);

/** Just the ids, for deciding which hearts are filled without fetching rows. */
export const getSavedIds = () => api<string[]>("/listings/saved/ids");

/** Idempotent toggle — the server returns the state it settled on. */
export const toggleSaved = (id: string) =>
  api<{ saved: boolean }>(`/listings/${id}/save`, { method: "PUT" });

export interface Wallet {
  balance: number | string;
  currency?: string;
  /**
   * The number a payer types into Paynet. Printed on the virtual card —
   * optional because an older API does not send it, and the card falls back
   * to an abbreviated user id rather than printing a blank.
   */
  accountNo?: number | null;
  /**
   * First-use-free actions this account has NOT spent yet, e.g.
   * ["LISTING_POST"] until they post their first listing.
   *
   * The server is the only judge of it. Never inferred from "they have no
   * listings": listings are hard-deleted, so that reading would say free
   * while the server charges.
   *
   * Optional because an older API does not send it, and absent means
   * "nothing free" — the safe way round. Under-promising and the post
   * turning out free is a pleasant surprise; the reverse is a refusal on a
   * form that said "Bepul".
   */
  freeActions?: string[];
  [k: string]: unknown;
}

/** One price the admin has set. Same shape the mobile app reads. */
export interface Tariff {
  id: string;
  action: string;
  nameUz: string;
  nameRu: string;
  /** So'm as a decimal string — `numeric` comes out of Postgres that way. */
  price: string;
  durationDays: number | null;
  isActive: boolean;
}

/**
 * The price list. Public on the server, so no session is needed — but it
 * goes through `api()` like everything else, which simply sends the token
 * when there is one.
 *
 * Never hardcode these numbers: an admin changes a price in the dashboard
 * and every client picks it up on the next fetch.
 */
export const getTariffs = () => api<Tariff[]>("/tariffs");

export interface WalletTxn {
  id: string;
  amount: number | string;
  type?: string;
  status?: string;
  createdAt: string;
  description?: string | null;
  [k: string]: unknown;
}

export const getWallet = () => api<Wallet>("/wallet");

export const getTransactions = (limit = 30, offset = 0) =>
  api<WalletTxn[]>(`/wallet/transactions?limit=${limit}&offset=${offset}`);
