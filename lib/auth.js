import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "bubs_admin_session";

function sign(value) {
  const secret = process.env.ADMIN_PASSWORD || "fallback-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function makeSessionToken() {
  const value = "ok";
  return `${value}.${sign(value)}`;
}

export function isValidSessionToken(token) {
  if (!token) return false;
  const [value, sig] = token.split(".");
  if (!value || !sig) return false;
  return sign(value) === sig;
}

export async function isAdminAuthed() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}

export { COOKIE_NAME };
