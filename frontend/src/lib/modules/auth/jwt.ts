import { SignJWT, jwtVerify } from "jose";

export type AccessTokenPayload = {
  sub: string; // user id
  email: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET env var");
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  const sub = payload.sub;
  const email = payload.email;

  if (typeof sub !== "string") throw new Error("Invalid token subject");
  if (typeof email !== "string") throw new Error("Invalid token payload");

  return { sub, email };
}

