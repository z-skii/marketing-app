/**
 * Same-origin return paths. Screens that send a person away to finish a
 * prerequisite (add a car, connect Instagram) carry `?return=/o/<id>` so they
 * land back where they started. Only a plain in-app path is ever honoured.
 */
export function safeReturnPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== "string") return null;
  const clean = path.trim();
  if (!clean.startsWith("/") || clean.startsWith("//") || clean.includes("://")) return null;
  if (clean.length > 300 || /[\s\\]/.test(clean)) return null;
  return clean;
}
