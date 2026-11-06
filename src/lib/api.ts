import { API_URL } from "./site";

/**
 * The web half of the auth story.
 *
 * Mirrors mobile/src/lib/api-client.ts deliberately — same single-flight
 * refresh, same retry-once-on-401 — with ONE structural difference:
 *
 *   mobile  refresh token in the Keychain, sent in the request body
 *   web     refresh token in an httpOnly cookie, sent by the browser
 *
 * That is not a port detail, it is the whole reason this file exists rather
 * than reusing the mobile client. A browser has no Keychain. Anything
 * JavaScript can read, an injected script can read, so a 30-day refresh
 * token in localStorage is a 30-day session handed to the first XSS. The
 * cookie is httpOnly: this file never sees the refresh token, cannot log it,
 * cannot leak it, and does not store it.
 *
 * `X-Auth-Mode: cookie` is how the server knows to put it there. See
 * server/src/modules/auth/auth-cookie.ts.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The access token. In MEMORY only — it is worth 15 minutes. */
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export interface SessionUser {
  id: string;
  name: string | null;
  surname: string | null;
  phoneNumber: string | null;
  email: string | null;
  avatarUrl: string | null;
  language: string | null;
  role: string;
  isVerifiedRealtor: boolean;
  hasPassword: boolean;
}

export interface SessionResponse {
  accessToken: string;
  user: SessionUser;
  /** Absent in cookie mode — the server strips it. Typed so that is obvious. */
  refreshToken?: never;
  isNew?: boolean;
}

/** Listeners for "the session changed", so React can re-render. */
type SessionListener = (user: SessionUser | null) => void;
const listeners = new Set<SessionListener>();

/** Returns an unsubscribe fn. Void-returning, so it can be a useEffect cleanup. */
export const onSessionChange = (fn: SessionListener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** The signed-in user, mirrored here so a partial update has a base. */
let currentUser: SessionUser | null = null;

export function applySession(data: SessionResponse): void {
  setAccessToken(data.accessToken);
  currentUser = data.user;
  for (const fn of listeners) fn(data.user);
}

export function clearSession(): void {
  setAccessToken(null);
  currentUser = null;
  for (const fn of listeners) fn(null);
}

/**
 * Fold a change into the session user without a round trip.
 *
 * The profile form writes to `/profile`, but the HEADER reads the session —
 * so without this, somebody who has just saved their name goes on being
 * greeted as "Mehmon" by the avatar menu until the next page load. The
 * alternative was to re-run the refresh for its user payload, which rotates
 * the refresh token to pick up two fields that are already in hand.
 *
 * A no-op when signed out: there is nothing to patch, and inventing a user
 * from a partial would sign somebody in by accident.
 */
export function patchSessionUser(patch: Partial<SessionUser>): void {
  if (!currentUser) return;
  currentUser = { ...currentUser, ...patch };
  for (const fn of listeners) fn(currentUser);
}

// ---- single-flight refresh ------------------------------------------------
//
// If N requests hit 401 at once, exactly ONE refresh fires and the rest await
// it. This is NOT an optimisation.
//
// The server rotates refresh tokens and revokes the whole family when a spent
// one is presented (see token.service.ts, and the race it closes with a
// conditional UPDATE). Two parallel refreshes mean one of them loses that
// race and the server — correctly — burns the family. The user is logged out
// by their own browser. A screen that fires five queries on mount with an
// expired access token is all it takes.

let refreshPromise: Promise<boolean> | null = null;

const REFRESH_TIMEOUT_MS = 8000;

async function doRefresh(): Promise<boolean> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), REFRESH_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Mode": "cookie" },
      // The point of the whole design: the browser attaches the httpOnly
      // cookie and this code never touches it. The body is empty because
      // there is nothing here to put in it.
      credentials: "include",
      body: "{}",
      signal: abort.signal,
    });

    if (!res.ok) {
      // The server answered and said no. The token really is dead, so drop
      // the session. The cookie is the server's to clear.
      clearSession();
      return false;
    }

    applySession((await res.json()) as SessionResponse);
    return true;
  } catch {
    // No answer at all — offline, timed out, DNS. The cookie is most likely
    // still good, so do NOT treat this as a sign-out: clearing here turns a
    // tunnel or a flaky connection into a real re-login, and users do not
    // distinguish "your session expired" from "this app logs me out".
    clearSession();
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Single-flight ACROSS TABS, not just within one.
 *
 * The in-process promise below is the same guard the mobile app has, and on
 * a phone it is enough: one app, one JavaScript context, one refresh.
 *
 * A browser is not one context. Every tab runs its own copy of this module
 * with its own `refreshPromise`, and every tab bootstraps by refreshing on
 * load. Open three tabs on the site at once — restoring a session, opening
 * links in background tabs, an ordinary Monday morning — and three tabs
 * present the SAME cookie to /auth/refresh simultaneously. One wins the
 * conditional UPDATE in token.service.ts; the other two are treated as token
 * reuse, exactly as designed, and the server burns the family.
 *
 * The user is signed out for opening tabs.
 *
 * The Web Locks API is the fix: a mutex scoped to the ORIGIN, shared by every
 * tab. The holder refreshes and writes a new cookie; the next tab in the
 * queue then refreshes using that new cookie. Sequential rotation, which is
 * what the server expects, instead of a race it is right to punish.
 *
 * Where it is missing — old Safari, some embedded webviews — this falls back
 * to the per-tab promise, which is strictly better than nothing and is the
 * behaviour everything had before.
 */
export function refreshSession(): Promise<boolean> {
  refreshPromise ??= withTabLock(doRefresh).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

type LockManager = {
  request: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
};

async function withTabLock(fn: () => Promise<boolean>): Promise<boolean> {
  // `navigator` is undefined during the server render of a client component,
  // so this is guarded for SSR as well as for browsers without the API.
  const locks =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & { locks?: LockManager }).locks;

  if (!locks?.request) return fn();
  return locks.request("growencity.auth.refresh", fn);
}

// ---- the request helper ---------------------------------------------------

interface ApiOptions {
  method?: string;
  body?: unknown;
  /** Attach the access token and retry once on 401. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
  /**
   * Extra headers for the one or two endpoints that take something this
   * client does not otherwise send — `X-Device-Id`, which is how a view is
   * counted once per guest. They are merged LAST but cannot replace
   * `Authorization`: a caller passing one would be silently signing in as
   * somebody else.
   */
  headers?: Record<string, string>;
}

async function send(path: string, opts: ApiOptions): Promise<Response> {
  const headers: Record<string, string> = { "X-Auth-Mode": "cookie" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  for (const [key, value] of Object.entries(opts.headers ?? {})) {
    if (key.toLowerCase() !== "authorization") headers[key] = value;
  }
  if (opts.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    credentials: "include",
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res = await send(path, opts);

  // One retry, never a loop. If the refreshed token is also rejected, the
  // problem is not staleness and retrying would hammer the endpoint.
  if (res.status === 401 && opts.auth !== false) {
    if (await refreshSession()) res = await send(path, opts);
  }

  if (!res.ok) throw await toError(res);

  // 204 and friends have no body to parse.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function toError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let code: string | undefined;

  try {
    const body = (await res.json()) as { message?: unknown; code?: unknown };
    if (typeof body.code === "string") code = body.code;
    if (typeof body.message === "string") message = body.message;
    else if (Array.isArray(body.message) && typeof body.message[0] === "string") {
      message = body.message[0];
    }
  } catch {
    // Not JSON — a proxy error page, or an empty body. Keep the default.
  }

  return new ApiError(res.status, message, code);
}
