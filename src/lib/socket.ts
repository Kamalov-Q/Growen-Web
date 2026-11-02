"use client";

import { io, type Socket } from "socket.io-client";
import { API_ORIGIN } from "./site";
import { getAccessToken, refreshSession } from "./api";

/**
 * Sockets, with the same self-repair the mobile app has.
 *
 * The problem this solves is specific and easy to miss: the chat gateway
 * verifies the access token ONCE, at connect time, and never again. A socket
 * that connected with a valid token stays connected after it expires — but a
 * socket that has to RECONNECT (a dropped Wi-Fi, a laptop waking up, a tab
 * restored) hands over whatever token it has, and after fifteen minutes that
 * token is dead.
 *
 * Without the handling below the result is a reconnect loop: connect, get
 * refused, retry with the same dead token, forever. The server is explicit
 * about it — it emits `auth:expired` before disconnecting rather than just
 * dropping the client, precisely so this code can tell "your token is stale"
 * apart from "the network went away".
 *
 * `auth` is read as a FUNCTION, not a value, so socket.io calls it on every
 * reconnect and picks up whatever token is current rather than closing over
 * the one that existed when the socket was created.
 */


const OPTIONS = {
  transports: ["websocket" as const],
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10_000,
  // credentials so the browser sends cookies on the handshake's HTTP phase.
  withCredentials: true,
};

export interface NamespaceSocket {
  get(): Socket;
  disconnect(): void;
}

export function namespaceSocket(
  namespace: string,
  { auth }: { auth: boolean },
): NamespaceSocket {
  let socket: Socket | null = null;
  let refreshing = false;

  /** Guarded against running twice: `auth:expired` and `connect_error` can
   *  both fire for the same expiry, and two refreshes race the server's
   *  rotation and burn the token family. */
  const refreshAndReconnect = async () => {
    if (refreshing || !socket) return;
    refreshing = true;
    try {
      if (await refreshSession()) {
        socket.disconnect();
        socket.connect();
      }
    } finally {
      refreshing = false;
    }
  };

  return {
    get() {
      if (socket) return socket;

      socket = io(`${API_ORIGIN}${namespace}`, {
        ...OPTIONS,
        ...(auth
          ? {
              auth: (cb: (data: { token: string | null }) => void) =>
                cb({ token: getAccessToken() }),
            }
          : {}),
      });

      if (auth) {
        socket.on("auth:expired", () => void refreshAndReconnect());
        socket.on("connect_error", (err: Error) => {
          if (/auth|unauthorized|jwt/i.test(err.message)) {
            void refreshAndReconnect();
          }
        });
      }

      return socket;
    },

    /** Call on sign-out: a live socket still holds the previous token. */
    disconnect() {
      socket?.disconnect();
      socket = null;
    },
  };
}

export const chatSocket = namespaceSocket("/chat", { auth: true });
