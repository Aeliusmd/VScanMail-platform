import { SignJWT, jwtVerify } from "jose";

export type AccessTokenPayload = {
  sub: string; // user id
  email: string;
};

export type MfaTempTokenPayload = AccessTokenPayload;
export type EmailChangeTokenPayload = AccessTokenPayload;

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
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function signMfaTempToken(payload: MfaTempTokenPayload) {
  return await new SignJWT({ email: payload.email, purpose: "mfa" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function signEmailChangeToken(payload: EmailChangeTokenPayload) {
  return await new SignJWT({ email: payload.email, purpose: "email_change" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("10m")
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

export async function verifyMfaTempToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  const sub = payload.sub;
  const email = payload.email;
  const purpose = payload.purpose;

  if (typeof sub !== "string") throw new Error("Invalid token subject");
  if (typeof email !== "string") throw new Error("Invalid token payload");
  if (purpose !== "mfa") throw new Error("Invalid token purpose");

  return { sub, email };
}

export async function verifyEmailChangeToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  const sub = payload.sub;
  const email = payload.email;
  const purpose = payload.purpose;

  if (typeof sub !== "string") throw new Error("Invalid token subject");
  if (typeof email !== "string") throw new Error("Invalid token payload");
  if (purpose !== "email_change") throw new Error("Invalid token purpose");

  return { sub, email };
}
