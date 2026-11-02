"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "@/src/features/auth/session";
import { getSavedIds } from "./api";

type Ctx = {
  isSaved: (id: string) => boolean;
  setSaved: (id: string, saved: boolean) => void;
};

const SavedCtx = createContext<Ctx | null>(null);

/**
 * Which listings the signed-in person has saved.
 *
 * Fetched ONCE as a set of ids rather than per card. A heart on every card
 * asking the server whether it is filled would be twenty-four requests for
 * one screen, and the answer is the same small list every time.
 *
 * Signing out is handled by DERIVING, not by clearing. `isSaved` answers
 * false whenever there is no session, so the previous account's hearts can
 * never be shown to the next person even for a frame — and there is no
 * synchronous setState in the effect, which is a cascading render the
 * compiler lint rejects. The stale set is simply unreachable, and the next
 * sign-in overwrites it.
 */
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "authenticated") return;
    let alive = true;
    getSavedIds()
      .then((list) => alive && setIds(new Set(list)))
      .catch(() => {
        // No list: every heart reads empty. Pressing one still works and
        // the server is the authority on what happens.
      });
    return () => {
      alive = false;
    };
  }, [status]);

  const authed = status === "authenticated";
  const isSaved = useCallback(
    (id: string) => authed && ids.has(id),
    [authed, ids],
  );

  const setSaved = useCallback((id: string, saved: boolean) => {
    setIds((prev) => {
      // A new Set, not a mutation: React compares by identity and a mutated
      // Set is the same object, so nothing would re-render.
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return (
    <SavedCtx.Provider value={{ isSaved, setSaved }}>
      {children}
    </SavedCtx.Provider>
  );
}

export function useSavedIds() {
  const ctx = useContext(SavedCtx);
  if (!ctx) throw new Error("useSavedIds must be used inside SavedProvider");
  return ctx;
}
