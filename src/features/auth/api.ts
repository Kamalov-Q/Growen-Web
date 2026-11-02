import { api, applySession, type SessionResponse } from "@/src/lib/api";

/**
 * The two calls sign-in is made of, and nothing else.
 *
 * Same two steps as the mobile app: a number, then the six digits that come
 * back by SMS. No password to invent and none to remember — a number that
 * can receive an SMS is the whole credential.
 */

export type OtpPurpose = "login" | "link" | "reset";

export const requestOtp = (phone: string, lang: string) =>
  api<{ sent: boolean; cooldownSeconds?: number }>("/auth/phone/request", {
    method: "POST",
    body: { phone, lang },
    auth: false,
  });

export async function verifyOtp(
  phone: string,
  code: string,
  lang: string,
  name?: string,
): Promise<SessionResponse> {
  const data = await api<SessionResponse>("/auth/phone/verify", {
    method: "POST",
    body: { phone, code, lang, ...(name ? { name } : {}) },
    auth: false,
  });

  // The refresh token is NOT in this response — the server moved it into an
  // httpOnly cookie on the way out. All that is left to do here is hold the
  // access token in memory and tell React.
  applySession(data);
  return data;
}
