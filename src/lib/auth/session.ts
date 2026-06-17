import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "fm_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

type SessionPayload = {
  username: string;
  role: "user" | "admin";
  iat: number;
};

export type SessionUser = {
  username: string;
  role: "user" | "admin";
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_SECRET");
  }

  return secret;
}

function sign(payload: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    username: user.username,
    role: user.role,
    iat: Date.now(),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) return null;

    const expectedSignature = sign(encodedPayload);

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    ) as SessionPayload;

    if (!payload.username || !payload.role || !payload.iat) return null;

    const expired = Date.now() - payload.iat > SESSION_MAX_AGE_MS;
    if (expired) return null;

    return {
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifySessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const token = createSessionToken(user);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAME);
}