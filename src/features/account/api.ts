import { api } from "@/src/lib/api";
import type { Listing } from "@/src/lib/listing-types";

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
