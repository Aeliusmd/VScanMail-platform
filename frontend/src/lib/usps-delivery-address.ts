import type { DeliveryAddress } from "@/lib/api/delivery-addresses";

const US_STATE_RE = /^[A-Z]{2}$/;
const US_ZIP_RE = /^[0-9]{5}(-[0-9]{4})?$/;

/** Matches server-side USPS/vSendDocs checks for pickup delivery. */
export function isUspsMailingAddress(addr: Pick<DeliveryAddress, "country" | "state" | "zip">): boolean {
  const c = String(addr.country ?? "")
    .trim()
    .toUpperCase();
  if (c !== "US") return false;
  const st = String(addr.state ?? "")
    .trim()
    .toUpperCase();
  if (!US_STATE_RE.test(st)) return false;
  const zip = String(addr.zip ?? "").trim();
  if (!US_ZIP_RE.test(zip)) return false;
  return true;
}
