export async function verifyTurnstileToken(token: unknown): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not configured");
    return false;
  }

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      response: token,
    }),
  });

  const verifyData = await verifyRes.json().catch(() => ({}));
  return !!verifyData.success;
}
