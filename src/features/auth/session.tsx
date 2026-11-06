"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearSession,
  onSessionChange,
  refreshSession,
  type SessionUser,
} from "@/src/lib/api";

/**
 * Who is signed in, for the whole app.
 *
 * A client component, mounted once in the [lang] layout. The layout itself
 * stays a SERVER component and so do its children — wrapping them in a
 * client provider does not make them client components. That split is what
 * lets the listing and legal pages stay statically rendered and indexable
 * while the app-shaped parts of the site know who is looking.
 */

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionValue {
  user: SessionUser | null;
  status: AuthStatus;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  /**
   * Has the opening refresh finished? Status is DERIVED from this and the
   * user, never stored.
   *
   * The first version kept `status` in its own state and synced it from
   * `user` in a second effect that listed `status` in its own dependencies —
   * an effect that sets the thing it depends on. It happened not to loop,
   * because React bails out when setState is given the same value, but it
   * was one edit away from doing so. Derived state cannot drift from the
   * thing it is derived from.
   */
  const [bootstrapped, setBootstrapped] = useState(false);

  const status: AuthStatus = !bootstrapped
    ? "loading"
    : user
      ? "authenticated"
      : "unauthenticated";

  // Mirror the module-level session into React state. The api client is the
  // source of truth — it is what refreshes on a 401, from anywhere, without
  // a hook — and this subscription is how a render finds out.
  useEffect(() => onSessionChange(setUser), []);

  useEffect(() => {
    let alive = true;

    // The bootstrap. The refresh cookie is httpOnly, so the only way to ask
    // "am I signed in?" is to try to refresh. Deliberately NOT awaited by
    // anything that renders: the page paints immediately and the header
    // fills in when the answer arrives. Blocking on it would put a spinner
    // in front of static content a crawler is trying to read.
    void refreshSession().finally(() => {
      // `finally`, not `then`: whether the refresh succeeded is already
      // reflected in `user` through the subscription above. All this needs
      // to record is that the question has been asked and answered.
      if (alive) setBootstrapped(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Revokes every refresh token for the account and clears the cookie.
      await api<void>("/auth/logout", { method: "POST" });
    } catch {
      // A failed logout must still log you out locally. The alternative is a
      // button that appears to do nothing when the network is down.
    } finally {
      clearSession();
      /**
       * A live socket still holds the old access token and would keep
       * delivering this account's messages to the next person at this
       * computer. Dropping the session in memory does not drop the wire.
       *
       * Imported HERE, not at the top of the file. This provider is in the
       * root layout, so a static import put socket.io-client — 14 KB
       * gzipped — into the shared bundle of every page on the site, for
       * one line that runs when somebody signs out. Measured: the home
       * page downloaded it and never opened a socket.
       */
      const { chatSocket } = await import("@/src/lib/socket");
      chatSocket.disconnect();
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signOut }),
    [user, status, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx;
}
