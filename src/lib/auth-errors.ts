/**
 * Translates raw auth-provider errors into things a person would say.
 * Anything unrecognized gets a safe generic line rather than leaking
 * implementation details.
 */
export function friendlyAuthError(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "That email or password is wrong.";
  if (m.includes("email not confirmed")) return "Verify your email first. Check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "That email already has an account. Sign in instead.";
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("at least")))
    return "That password is too weak. Use at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "Too many emails requested. Wait a few minutes and try again.";
  if (m.includes("expired") || m.includes("invalid") || m.includes("not found"))
    return "That link is invalid or has expired. Request a new one.";
  if (m.includes("bytestring") || m.includes("fetch"))
    return "We couldn't reach the sign-in service. Try again in a minute.";
  return "Something went wrong. Try again in a minute.";
}
