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
  [k: string]: unknown;
}

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
