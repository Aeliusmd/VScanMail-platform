export function resolveAvatarUrl(value?: string | null) {
  if (!value) return null;
  return value.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}${value}` : value;
}
