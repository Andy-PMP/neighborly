// Browser persistence for daily games. Every access is wrapped: private windows, blocked
// storage or corrupt data must never break the game; stats just aren't kept then.

import type { GameState } from "./game";

export const STORAGE_KEY = "nearby:v1";

export interface SaveData {
  version: 1;
  /** Daily games by day number (as a string key). In-progress games are saved too. */
  daily: Record<string, GameState>;
}

/** Minimal Storage surface, so tests can pass a fake. */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

export function emptySave(): SaveData {
  return { version: 1, daily: {} };
}

/** window.localStorage, or null when it's unavailable (the accessor itself can throw). */
export function browserStore(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function isGameState(v: unknown): v is GameState {
  const g = v as GameState;
  return (
    !!g &&
    typeof g.revealed === "number" &&
    Array.isArray(g.guesses) &&
    (g.status === "playing" || g.status === "won" || g.status === "lost")
  );
}

export function loadSave(store: KeyValueStore | null): SaveData {
  if (!store) return emptySave();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1 || typeof parsed.daily !== "object" || !parsed.daily) {
      return emptySave();
    }
    const daily: SaveData["daily"] = {};
    for (const [day, game] of Object.entries(parsed.daily)) {
      if (isGameState(game)) daily[day] = game;
    }
    return { version: 1, daily };
  } catch {
    return emptySave();
  }
}

/** Returns false if the write failed (quota, blocked storage); callers carry on regardless. */
export function writeSave(store: KeyValueStore | null, data: SaveData): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
