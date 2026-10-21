import { describe, expect, it } from "vitest";
import type { GameState } from "./game";
import { STORAGE_KEY, emptySave, loadSave, writeSave, type KeyValueStore } from "./storage";

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

const throwing: KeyValueStore = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

const game: GameState = { revealed: 2, status: "playing", guesses: [{ word: "a", rank: 9, clue: 1 }] };

describe("storage", () => {
  it("round-trips a save", () => {
    const store = memoryStore();
    const save = { version: 1 as const, daily: { "3": game } };
    expect(writeSave(store, save)).toBe(true);
    expect(loadSave(store)).toEqual(save);
  });

  it("falls back to an empty save when storage is missing or throws", () => {
    expect(loadSave(null)).toEqual(emptySave());
    expect(loadSave(throwing)).toEqual(emptySave());
    expect(writeSave(null, emptySave())).toBe(false);
    expect(writeSave(throwing, emptySave())).toBe(false);
  });

  it("ignores corrupt or foreign data", () => {
    const store = memoryStore();
    for (const raw of ["not json", "null", '{"version":2,"daily":{}}', '{"version":1}']) {
      store.data.set(STORAGE_KEY, raw);
      expect(loadSave(store)).toEqual(emptySave());
    }
  });

  it("drops malformed game entries but keeps good ones", () => {
    const store = memoryStore();
    store.data.set(
      STORAGE_KEY,
      JSON.stringify({ version: 1, daily: { "1": game, "2": { status: "won" }, "3": 7 } }),
    );
    expect(loadSave(store).daily).toEqual({ "1": game });
  });
});
