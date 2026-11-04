/**
 * Shrink a picture in the browser before it goes up.
 *
 * A phone camera frame is 8–12 MB; the avatar endpoint caps at 5 and the
 * document endpoint at 10, and both re-encode whatever they are given
 * anyway — so sending the full frame is pure waste on a mobile connection
 * and, often, a refusal. The app does this on the device with
 * expo-image-manipulator (see profile/edit and verify-profile); here it is
 * a canvas.
 *
 * `edge` is the LONG edge to fit inside, and it differs by purpose: an
 * avatar is read at 104px and can be 1024, while a passport is read for its
 * small print and keeps 2000, exactly as the app has it.
 *
 * Falls back to the original file whenever anything is unavailable or
 * refuses. An unreadable file is the server's call to make, not a dead end
 * in the browser.
 */
export async function downscaleImage(
  file: File,
  edge: number,
  quality = 0.85,
): Promise<File> {
  try {
    if (typeof createImageBitmap !== "function") return file;

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));

    // Already small enough: re-encoding would only lose quality.
    if (scale === 1) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    return new File([blob], "upload.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
