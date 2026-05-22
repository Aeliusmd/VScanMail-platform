/** Cheque date must be within the last 6 months and not post-dated. */
export function isChequeDateWithinValidityWindow(
  dateStr: string | null | undefined,
  maxAgeDays = 180
): boolean | null {
  if (!dateStr || dateStr === "—") return null;

  const normalized = String(dateStr).trim();
  const parsed = new Date(normalized.includes("T") ? normalized : `${normalized}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const oldestAllowed = new Date(today);
  oldestAllowed.setDate(oldestAllowed.getDate() - maxAgeDays);
  oldestAllowed.setHours(0, 0, 0, 0);

  if (parsed > today) return false;
  if (parsed < oldestAllowed) return false;
  return true;
}
