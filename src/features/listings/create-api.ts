import { api, getAccessToken, refreshSession } from "@/src/lib/api";
import { API_URL } from "@/src/lib/site";
import type { Listing } from "@/src/lib/listing-types";

export interface UploadedImage {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
}

export interface BatchUploadResult {
  images: UploadedImage[];
  /** Indices into the input array the server could not process. */
  failed: number[];
}

/**
 * Upload photos.
 *
 * Not through `api()`: that helper sets `Content-Type: application/json`,
 * and a multipart body must carry the boundary the runtime generates. Set
 * the header by hand and the server cannot parse the body at all — so the
 * fetch is written out here with no Content-Type whatsoever.
 *
 * The body is REBUILT for the retry rather than reused. A FormData stream
 * cannot be replayed once consumed, so a 401 retry with the same object
 * uploads nothing and succeeds emptily.
 */
export async function uploadImages(files: File[]): Promise<BatchUploadResult> {
  const send = async (): Promise<Response> => {
    const form = new FormData();
    for (const file of files) form.append("files", file, file.name);
    const token = getAccessToken();
    return fetch(`${API_URL}/media/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  };

  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);

  const body = (await res.json()) as Partial<BatchUploadResult>;
  return { images: body.images ?? [], failed: body.failed ?? [] };
}

export interface CreateOffer {
  purpose: "SALE" | "RENT_MONTHLY" | "RENT_DAILY";
  price: number;
  currency: "USD" | "UZS";
}

export interface CreateListingInput {
  purpose: CreateOffer["purpose"];
  price: number;
  currency: "USD" | "UZS";
  category: string;
  offers: CreateOffer[];
  title?: string;
  descriptionHtml?: string;
  rooms?: number;
  sellerType?: string;
  repairType?: string;
  buildingType?: string;
  floor?: number;
  totalFloors?: number;
  address?: string;
  contactPhone?: string;
  /**
   * The location, one way or the other.
   *
   * `point` is a pin; `coordinates` is an array of GeoJSON rings whose
   * first ring is the outer boundary, closed. Exactly one is sent — the
   * server reads whichever arrives, and sending both would leave it to pick.
   */
  point?: [number, number];
  coordinates?: [number, number][][];
  areaM2?: number;
  properties?: string[];
  images?: { url: string; thumbUrl: string; width?: number; height?: number }[];
}

export const createListing = (input: CreateListingInput) =>
  api<Listing>("/listings", { method: "POST", body: input });
