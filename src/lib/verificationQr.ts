import QRCodeStyling from "qr-code-styling";

// Brand colors (see globals.css: PRIMARY = gold #f1a500, SECONDARY = navy #0b3363).
const NAVY = "#0b3363";
const GOLD = "#f1a500";

// The logo embedded in the center of every generated QR code — the solid (non-transparent),
// square icon-only mark. Using the opaque square version (rather than the transparent circular
// cutout) means the logo sits flush against the QR's white background with no stray halo/box
// around it. High error-correction ("H", ~30% tolerance) is required so the code still scans
// reliably with a chunk of its center covered by the logo.
const LOGO_SRC = "/riqs-logo-icon-only.png";

/**
 * Builds the public verification URL a scanned QR code should resolve to for a given
 * membership ID — the destination page shows only public-safe details (name, category,
 * standing). Uses the current origin so it resolves correctly in both local dev and
 * production without any environment-specific configuration.
 */
export function buildVerificationUrl(membershipId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://ricos.rwandaiqs.org";
  return `${origin}/verify/${encodeURIComponent(membershipId)}`;
}

/**
 * Generates a branded, logo-embedded QR code for a member's verification URL and returns it
 * as a base64 PNG data URL, rendered on membership cards and certificates once ready (callers
 * show a loading spinner in the meantime, the same way the profile photo does — there is no
 * static placeholder image to fall back to). A data URL (rather than an object URL) keeps
 * working through html2canvas/print-to-PDF conversion and doesn't need to be revoked.
 */
export async function generateVerificationQrDataUrl(membershipId: string, size = 320): Promise<string> {
  const qr = new QRCodeStyling({
    width: size,
    height: size,
    type: "canvas",
    data: buildVerificationUrl(membershipId),
    image: LOGO_SRC,
    margin: 6,
    qrOptions: { errorCorrectionLevel: "H" },
    imageOptions: { crossOrigin: "anonymous", margin: 0, imageSize: 0.36, hideBackgroundDots: true },
    dotsOptions: { color: NAVY, type: "rounded" },
    cornersSquareOptions: { color: NAVY, type: "extra-rounded" },
    cornersDotOptions: { color: GOLD, type: "dot" },
    backgroundOptions: { color: "#ffffff" },
  });

  const raw = await qr.getRawData("png");
  if (!raw) throw new Error("Failed to generate verification QR code.");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Failed to read generated QR code."));
    reader.readAsDataURL(raw as Blob);
  });
}
