import { api, getAccessToken, refreshSession } from "@/src/lib/api";
import { API_URL } from "@/src/lib/site";

/**
 * Applying for the verified badge, and asking where the application stands.
 *
 * The same two endpoints the app uses, in the same order: the three images
 * go to `/media/verification/upload` one at a time, and the URLs that come
 * back are what `/verification` is given. The documents themselves are
 * never returned by the API — `mine()` answers with a status and nothing
 * else — which is why this file can only ever show what the person has just
 * picked in this browser, never what they sent last week.
 */

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** The applicant's own view. Mirrors the app's `VerificationState`. */
export interface VerificationState {
  isVerified: boolean;
  request: {
    id: string;
    status: VerificationStatus;
    /** What a moderator told them, when the answer was no. */
    rejectionReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
}

export interface SubmitVerificationInput {
  passportFrontUrl: string;
  passportBackUrl: string;
  selfieUrl: string;
}

/** The server's own cap (media.controller: MAX_FILE_SIZE). */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Wide enough that a moderator can read a passport number off it.
 *
 * Bigger than the avatar on purpose, and the same number the app uses: this
 * is the one upload whose small print is the whole point of sending it, so
 * it is downscaled far less aggressively than a photograph of a flat.
 */
export const DOCUMENT_EDGE = 2000;

export const getVerification = () =>
  api<VerificationState>("/verification/me");

export const submitVerification = (input: SubmitVerificationInput) =>
  api<{ id: string; status: VerificationStatus; createdAt: string }>(
    "/verification",
    { method: "POST", body: input },
  );

/**
 * Upload one page, get back the URL to send.
 *
 * Not through `api()`, for the reason every upload here gives: that helper
 * sets `Content-Type: application/json`, and a multipart body must carry
 * the boundary the runtime generates. The body is rebuilt for the 401
 * retry — a FormData stream cannot be replayed once consumed, so retrying
 * with the same object uploads nothing and succeeds emptily.
 */
export async function uploadDocument(file: File): Promise<string> {
  const send = async (): Promise<Response> => {
    const form = new FormData();
    form.append("file", file, file.name || "document.jpg");
    const token = getAccessToken();
    return fetch(`${API_URL}/media/verification/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: form,
    });
  };

  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok) throw new Error(`document upload failed: ${res.status}`);

  const body = (await res.json()) as { url: string };
  return body.url;
}
