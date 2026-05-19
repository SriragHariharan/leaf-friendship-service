import createError from "http-errors";

/** User-service CUIDs and friend-request row UUIDs */
const USER_ID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[a-z0-9]{20,32})$/i;

export function requireUserId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw createError(400, `Invalid ${field}: expected user id string`);
  }
  const trimmed = value.trim();
  if (!USER_ID_RE.test(trimmed)) {
    throw createError(400, `Invalid ${field}: expected a valid user id`);
  }
  return trimmed;
}
