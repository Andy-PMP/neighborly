// Browser-side helpers shared by the page scripts: base URL, data URL and dev-only overrides.

export const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
export const dataUrl = `${base}data/`;
export const params = new URLSearchParams(location.search);

/** Dev-only: ?date=YYYY-MM-DD pretends it's that UTC day. Stripped from production builds. */
export const devDate = import.meta.env.DEV ? params.get("date") : null;

export function now(): number {
  return devDate ? Date.parse(`${devDate}T12:00:00Z`) : Date.now();
}

/** Link within the site that keeps the dev date override, if any. Empty values render bare. */
export function href(path = "", query: Record<string, string> = {}): string {
  const q = new URLSearchParams(query);
  if (devDate) q.set("date", devDate);
  const s = q.toString().replace(/=(&|$)/g, "$1");
  return `${base}${path}${s ? `?${s}` : ""}`;
}
