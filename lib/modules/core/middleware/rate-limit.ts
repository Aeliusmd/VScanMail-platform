const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * For production, use Vercel KV or Upstash Redis.
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false; // rate limited
  }

  entry.count++;
  return true;
}
