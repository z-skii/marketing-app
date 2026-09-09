/** Uniform result shape for server actions so client components can show errors inline. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = undefined>(error: unknown): ActionResult<T> {
  const message =
    typeof error === "string" ? error :
    error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) :
    "Something went wrong";
  return { ok: false, error: message.replace(/^.*?:\s*(?=[A-Z])/, "") };
}
