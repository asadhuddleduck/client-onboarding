import { timingSafeEqual } from "crypto";

export function verifyAuth(request: Request): boolean {
  const secret = process.env.ONBOARDING_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.error("[auth] ONBOARDING_SECRET is not set in production");
      return false;
    }
    return true; // Dev mode: allow without secret
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const expected = `Bearer ${secret}`;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}
