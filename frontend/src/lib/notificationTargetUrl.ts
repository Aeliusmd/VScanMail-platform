const CUSTOMER_UUID_SEGMENT =
  /^\/customer\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/.*)?$/i;

/** Rewrites legacy notification paths that incorrectly embed clientId in the URL. */
export function resolveNotificationTargetUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(CUSTOMER_UUID_SEGMENT);
  if (match) {
    const suffix = match[1] ?? "";
    return `/customer${suffix}`;
  }

  return trimmed;
}
