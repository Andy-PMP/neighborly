// Draw a finished puzzle's 2D map as inline SVG. Only call this once the puzzle is over:
// the answer is drawn and named in the text alternative.

import { DEFAULT_MAP, layoutMap } from "../lib/map";
import type { Puzzle } from "../lib/types";

const SVG = "http://www.w3.org/2000/svg";
let uid = 0;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export function renderMap(figure: HTMLElement, puzzle: Puzzle, target: string): void {
  const o = DEFAULT_MAP;
  const texts = [target, ...puzzle.clues.map((c, i) => `${i + 1} · ${c.w}`)];
  const { points, labels } = layoutMap(puzzle.map, texts, o);
  const id = `map-${++uid}`;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${o.width} ${o.height}`,
    role: "img",
    "aria-labelledby": `${id}-title ${id}-desc`,
    class: "map-svg",
  });
  const title = svgEl("title", { id: `${id}-title` });
  title.textContent = `Map of "${target}" and its clues`;
  const closest = puzzle.clues
    .slice(-3)
    .reverse()
    .map((c) => c.w)
    .join(", ");
  const desc = svgEl("desc", { id: `${id}-desc` });
  desc.textContent =
    `The answer "${target}" with its 8 clues, squeezed from 300 dimensions into 2, so ` +
    `distances are only approximate. Closest in meaning: ${closest}. ` +
    `The clue table lists every clue with its rank.`;
  svg.append(title, desc);

  const [t, ...clues] = points;
  for (const p of clues) {
    svg.append(svgEl("line", { x1: t!.x, y1: t!.y, x2: p.x, y2: p.y, class: "map-line" }));
  }
  clues.forEach((p) => svg.append(svgEl("circle", { cx: p.x, cy: p.y, r: o.dotRadius, class: "map-dot" })));
  svg.append(svgEl("circle", { cx: t!.x, cy: t!.y, r: o.dotRadius + 2, class: "map-target" }));

  labels.forEach((l, i) => {
    const text = svgEl("text", {
      x: l.x,
      y: l.y,
      "text-anchor": l.anchor,
      "font-size": o.fontSize,
      class: i === 0 ? "map-label map-label-target" : "map-label",
    });
    text.textContent = l.text;
    svg.append(text);
  });

  const caption = document.createElement("figcaption");
  caption.textContent =
    "Squeezed from 300 dimensions down to 2, so distances are approximate. Numbers are clue order.";
  figure.replaceChildren(svg, caption);
  figure.hidden = false;
}
