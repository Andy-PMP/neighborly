// Layout for the 2D puzzle map: scale the precomputed points into an SVG frame and place
// labels so they don't collide. Pure geometry; the DOM work lives in scripts/map-render.ts.

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapOptions {
  width: number;
  height: number;
  /** Space kept around the dots (in SVG units) so labels fit inside the frame. */
  padX: number;
  padY: number;
  fontSize: number;
  dotRadius: number;
}

export type Anchor = "start" | "middle" | "end";

export interface PlacedLabel {
  text: string;
  /** Text position for <text x y text-anchor>. */
  x: number;
  y: number;
  anchor: Anchor;
  box: Box;
}

export interface MapLayout {
  points: Point[];
  labels: PlacedLabel[];
}

export const DEFAULT_MAP: MapOptions = {
  width: 360,
  height: 280,
  padX: 56,
  padY: 22,
  fontSize: 12,
  dotRadius: 4,
};

/** Rough text width for a system sans-serif: ~0.6em per character. */
export function textWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

/**
 * Map raw coordinates (any range; puzzles.json uses [-1, 1]) into the frame with one uniform
 * scale, so distances keep their proportions, centered in the padded area. SVG y points down,
 * so y is flipped. Coincident points all land in the center.
 */
export function scalePoints(raw: readonly (readonly [number, number])[], o: MapOptions): Point[] {
  if (raw.length === 0) return [];
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const availW = o.width - 2 * o.padX;
  const availH = o.height - 2 * o.padY;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = Math.min(spanX ? availW / spanX : Infinity, spanY ? availH / spanY : Infinity);
  const s = Number.isFinite(scale) ? scale : 0;
  const cx = o.width / 2;
  const cy = o.height / 2;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  return raw.map(([x, y]) => ({ x: cx + (x - midX) * s, y: cy - (y - midY) * s }));
}

export function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function inside(b: Box, o: MapOptions): boolean {
  return b.x >= 0 && b.y >= 0 && b.x + b.w <= o.width && b.y + b.h <= o.height;
}

function clampBox(b: Box, o: MapOptions): Box {
  return {
    ...b,
    x: Math.min(Math.max(b.x, 0), Math.max(0, o.width - b.w)),
    y: Math.min(Math.max(b.y, 0), Math.max(0, o.height - b.h)),
  };
}

/** Candidate label boxes around a dot, in order of preference: a tight ring, then a wider one. */
function candidates(p: Point, w: number, h: number, o: MapOptions): [Box, Anchor][] {
  const ring = (gap: number): [Box, Anchor][] => {
    const d = gap * 0.7;
    return [
      [{ x: p.x + gap, y: p.y - h / 2, w, h }, "start"], // right
      [{ x: p.x - gap - w, y: p.y - h / 2, w, h }, "end"], // left
      [{ x: p.x - w / 2, y: p.y - gap - h, w, h }, "middle"], // above
      [{ x: p.x - w / 2, y: p.y + gap, w, h }, "middle"], // below
      [{ x: p.x + d, y: p.y - d - h, w, h }, "start"], // upper right
      [{ x: p.x + d, y: p.y + d, w, h }, "start"], // lower right
      [{ x: p.x - d - w, y: p.y - d - h, w, h }, "end"], // upper left
      [{ x: p.x - d - w, y: p.y + d, w, h }, "end"], // lower left
    ];
  };
  const gap = o.dotRadius + 3;
  return [...ring(gap), ...ring(gap + h * 0.8)];
}

function labelFromBox(text: string, box: Box, anchor: Anchor, fontSize: number): PlacedLabel {
  const x = anchor === "start" ? box.x : anchor === "end" ? box.x + box.w : box.x + box.w / 2;
  // Baseline ~0.35em below the box's middle centers lowercase text vertically.
  return { text, x, y: box.y + box.h / 2 + fontSize * 0.35, anchor, box };
}

/**
 * Greedy placement in the given order: each label takes the first candidate spot that stays in
 * the frame and touches no dot or earlier label; if none is free, the spot with the least
 * overlap wins. Returns labels indexed like `points`, plus the total overlap left over.
 */
function placeInOrder(
  points: Point[],
  texts: string[],
  order: number[],
  o: MapOptions,
): { labels: PlacedLabel[]; cost: number } {
  const h = o.fontSize * 1.25;
  const r = o.dotRadius;
  const dots: Box[] = points.map((p) => ({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r }));
  const labels: PlacedLabel[] = new Array(points.length);
  const boxes: Box[] = [];
  let total = 0;

  for (const i of order) {
    const text = texts[i] ?? "";
    const w = textWidth(text, o.fontSize);
    const obstacles = [...dots, ...boxes];
    let best: [Box, Anchor] | null = null;
    let bestCost = Infinity;
    for (const [raw, anchor] of candidates(points[i]!, w, h, o)) {
      const box = inside(raw, o) ? raw : clampBox(raw, o);
      const cost =
        obstacles.reduce((sum, ob) => sum + overlapArea(box, ob), 0) + (box === raw ? 0 : 0.5);
      if (cost < bestCost) {
        best = [box, anchor];
        bestCost = cost;
        if (cost === 0) break;
      }
    }
    const [box, anchor] = best!;
    boxes.push(box);
    total += bestCost;
    labels[i] = labelFromBox(text, box, anchor, o.fontSize);
  }
  return { labels, cost: total };
}

/**
 * Place one label per point without collisions where possible. Greedy placement depends on
 * order, so a few orders are tried (as given, most crowded first, reversed, left to right, top
 * to bottom) and the layout with
 * the least overlap wins. Put the most important point first; it wins ties.
 */
export function placeLabels(points: Point[], texts: string[], o: MapOptions): PlacedLabel[] {
  const idx = points.map((_, i) => i);
  const crowding = points.map(
    (p) => points.filter((q) => Math.hypot(p.x - q.x, p.y - q.y) < o.fontSize * 4).length,
  );
  const orders = [
    idx,
    [...idx].sort((a, b) => crowding[b]! - crowding[a]! || a - b),
    [...idx.slice(0, 1), ...idx.slice(1).reverse()],
    [...idx].sort((a, b) => points[a]!.x - points[b]!.x),
    [...idx].sort((a, b) => points[a]!.y - points[b]!.y),
  ];
  let best: { labels: PlacedLabel[]; cost: number } | null = null;
  for (const order of orders) {
    const attempt = placeInOrder(points, texts, order, o);
    if (!best || attempt.cost < best.cost) best = attempt;
    if (best.cost === 0) break;
  }
  return best?.labels ?? [];
}

export function layoutMap(
  raw: readonly (readonly [number, number])[],
  texts: string[],
  o: MapOptions = DEFAULT_MAP,
): MapLayout {
  const points = scalePoints(raw, o);
  return { points, labels: placeLabels(points, texts, o) };
}
