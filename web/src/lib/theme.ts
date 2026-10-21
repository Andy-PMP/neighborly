// Theme preference: "auto" follows the device; "light"/"dark" override it. Stored per browser.

export type ThemePref = "auto" | "light" | "dark";

export const THEME_KEY = "nearby:theme";
const ORDER: ThemePref[] = ["auto", "light", "dark"];

export function parseTheme(raw: string | null | undefined): ThemePref {
  return raw === "light" || raw === "dark" ? raw : "auto";
}

/** The toggle cycles Auto → Light → Dark → Auto. */
export function nextTheme(t: ThemePref): ThemePref {
  return ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]!;
}

export function themeLabel(t: ThemePref): string {
  return t === "auto" ? "Auto" : t === "light" ? "Light" : "Dark";
}
