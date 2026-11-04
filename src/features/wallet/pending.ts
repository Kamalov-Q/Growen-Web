/**
 * The top-up this browser is in the middle of.
 *
 * Remembered BEFORE leaving for the provider, because of how the return
 * trip works: Click sends the payer to one `CLICK_RETURN_URL` configured on
 * the server for every client, and it carries no payment id. Without this,
 * somebody coming back has no way to be told what happened — and the
 * webhook, not the return link, is what actually credits the wallet.
 *
 * `sessionStorage`, not `localStorage`: an abandoned attempt should not
 * still be announcing itself in a tab opened next week. Every access is
 * wrapped, because a private window and blocked site data both throw.
 */
const KEY = "growencity.topup.pending";

export interface PendingTopup {
  paymentId: string;
  amount: number;
  startedAt: number;
}

export function readPendingTopup(): PendingTopup | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingTopup>;
    if (typeof parsed.paymentId !== "string") return null;
    return {
      paymentId: parsed.paymentId,
      amount: Number(parsed.amount) || 0,
      startedAt: Number(parsed.startedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function writePendingTopup(pending: PendingTopup | null): void {
  try {
    if (pending) sessionStorage.setItem(KEY, JSON.stringify(pending));
    else sessionStorage.removeItem(KEY);
    announce();
  } catch {
    // Remembering it is what makes the return trip informative, not what
    // makes the payment work: the webhook credits the wallet either way.
  }
}

/**
 * The pending attempt as an external store, so a component can READ it
 * during render instead of copying it into state from an effect.
 *
 * That copy is the cascading render the compiler lint rejects, and a lazy
 * `useState` initialiser is no better here: this component is server-
 * rendered first, where there is no `sessionStorage`, so the two paints
 * would disagree. `useSyncExternalStore` is the hook for exactly this —
 * `getServerSnapshot` answers for the server, and React swaps in the
 * client's value within the same commit.
 *
 * Both snapshots return PRIMITIVES. Returning a fresh object each call
 * would make React think the store changed on every render and loop.
 */
const listeners = new Set<() => void>();

export function subscribePending(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function announce(): void {
  for (const fn of listeners) fn();
}

export const pendingPaymentId = (): string | null =>
  readPendingTopup()?.paymentId ?? null;

export const pendingAmount = (): number | null =>
  readPendingTopup()?.amount ?? null;

/** The server has no session storage; nothing is pending there. */
export const noPending = () => null;
