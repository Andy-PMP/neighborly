import { describe, expect, it } from "vitest";
import { DEFAULT_MAP, layoutMap, overlapArea, scalePoints, type MapOptions } from "./map";

const o: MapOptions = DEFAULT_MAP;

describe("scalePoints", () => {
  it("puts the extreme points on the padded edges of the wider axis", () => {
    const pts = scalePoints(
      [
        [-1, 0],
        [1, 0.2],
        [0, -0.2],
      ],
      o,
    );
    expect(Math.min(...pts.map((p) => p.x))).toBeCloseTo(o.padX);
    expect(Math.max(...pts.map((p) => p.x))).toBeCloseTo(o.width - o.padX);
  });

  it("uses one scale for both axes (proportions kept)", () => {
    const [a, b, c] = scalePoints(
      [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      o,
    );
    expect(Math.abs(b!.x - a!.x)).toBeCloseTo(Math.abs(c!.y - a!.y));
  });

  it("flips y so positive is up", () => {
    const [low, high] = scalePoints(
      [
        [0, -1],
        [0, 1],
      ],
      o,
    );
    expect(high!.y).toBeLessThan(low!.y);
  });

  it("centers coincident points and handles one point", () => {
    expect(scalePoints([[0.3, 0.3]], o)).toEqual([{ x: o.width / 2, y: o.height / 2 }]);
    const same = scalePoints(
      [
        [0.5, 0.5],
        [0.5, 0.5],
      ],
      o,
    );
    expect(same.every((p) => p.x === o.width / 2 && p.y === o.height / 2)).toBe(true);
    expect(scalePoints([], o)).toEqual([]);
  });
});

describe("label placement", () => {
  // A crowded cluster like a real puzzle: answer plus 8 clues, several close together.
  const raw: [number, number][] = [
    [0, 0],
    [-1, 0.6],
    [-0.8, -0.9],
    [0.9, 1],
    [1, -0.5],
    [0.15, 0.1],
    [0.1, -0.12],
    [-0.12, 0.05],
    [0.05, 0.2],
  ];
  const texts = [
    "answer",
    "1 · qualities",
    "2 · adversity",
    "3 · patriotism",
    "4 · skill",
    "5 · compassion",
    "6 · dedication",
    "7 · heroism",
    "8 · bravery",
  ];
  const { points, labels } = layoutMap(raw, texts, o);

  it("places one label per point, keeping the text", () => {
    expect(labels.map((l) => l.text)).toEqual(texts);
  });

  it("keeps every label inside the frame", () => {
    for (const { box } of labels) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(o.width);
      expect(box.y + box.h).toBeLessThanOrEqual(o.height);
    }
  });

  it("does not overlap labels with each other or with dots", () => {
    const r = o.dotRadius;
    const dots = points.map((p) => ({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r }));
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        expect(overlapArea(labels[i]!.box, labels[j]!.box), `${i} vs ${j}`).toBe(0);
      }
      for (const d of dots) expect(overlapArea(labels[i]!.box, d)).toBe(0);
    }
  });

  it("sets text x to match the anchor", () => {
    for (const l of labels) {
      const expected =
        l.anchor === "start" ? l.box.x : l.anchor === "end" ? l.box.x + l.box.w : l.box.x + l.box.w / 2;
      expect(l.x).toBeCloseTo(expected);
    }
  });

  it("pulls a label back inside when a dot sits at the edge", () => {
    const edge = layoutMap(
      [
        [-1, 0],
        [1, 0],
      ],
      ["a very long label text here", "another long label text"],
      { ...o, padX: 4 },
    );
    for (const { box } of edge.labels) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(o.width);
    }
  });
});
