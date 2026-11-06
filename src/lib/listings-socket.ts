"use client";

import type { Socket } from "socket.io-client";
import { namespaceSocket } from "./socket";

/**
 * The public `/listings` namespace: live counts on a listing, and nothing
 * that needs a session.
 *
 * Separate from the chat socket on purpose — that one carries a token and
 * drops anyone without one, and most people looking at a listing are
 * signed out. A port of the app's `listings-socket`, including the part
 * that is easy to get wrong.
 */
const listings = namespaceSocket("/listings", { auth: false });

export const getListingsSocket = () => listings.get();
export const disconnectListingsSocket = () => listings.disconnect();

/** What the server pushes when one of a listing's counters moves. Every
 *  field is optional: a broadcast says only what changed. */
export interface ListingStats {
  listingId: string;
  viewCount?: number;
  commentCount?: number;
  ratingAvg?: number;
  ratingCount?: number;
}

/**
 * How many things on screen are watching each listing.
 *
 * Counted, because more than one can be — the detail page and, later, a
 * card that previews the same listing. Without a count the first to
 * unmount would emit `listing:unwatch` and leave the other subscribed to
 * nothing, silently: the socket stays connected and simply stops
 * delivering that listing's updates.
 */
const watching = new Map<string, number>();

/** Re-sent on every reconnect: a fresh socket starts in no rooms at all. */
let rejoinBound: Socket | null = null;

function bindRejoin(socket: Socket) {
  if (rejoinBound === socket) return;
  rejoinBound = socket;

  socket.on("connect", () => {
    for (const listingId of watching.keys()) {
      socket.emit("listing:watch", { listingId });
    }
  });
}

/**
 * Join a listing's room; the returned function leaves it.
 *
 * Emits to the server only when the count crosses zero — the room is
 * joined once however many components are interested.
 */
export function watchListing(listingId: string): () => void {
  const socket = getListingsSocket();
  bindRejoin(socket);

  const before = watching.get(listingId) ?? 0;
  watching.set(listingId, before + 1);
  if (before === 0) socket.emit("listing:watch", { listingId });

  let released = false;
  return () => {
    // Guarded: React runs an effect's cleanup twice in development, and a
    // double release would take the count below what is actually mounted.
    if (released) return;
    released = true;

    const now = (watching.get(listingId) ?? 1) - 1;
    if (now > 0) {
      watching.set(listingId, now);
      return;
    }
    watching.delete(listingId);
    socket.emit("listing:unwatch", { listingId });
  };
}
