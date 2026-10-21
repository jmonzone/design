import type { SummaryLayoutDef, SummarySlot } from "./types";

const GAP = 0.1;

/** Rows of cards, as many columns as makes them biggest; a short last row is centered. */
export const GRID_LAYOUT: SummaryLayoutDef = {
  id: "grid",
  label: "Grid",
  slots: (count, area, unit) => {
    if (count === 0) return [];
    const cellW = unit.width * (1 + GAP);
    const cellH = unit.height * (1 + GAP);
    const availW = area.width * 0.94;
    const availH = area.height * 0.76;
    let cols = 1;
    let scale = 0;
    for (let c = 1; c <= count; c++) {
      const rows = Math.ceil(count / c);
      const s = Math.min(availW / (c * cellW), availH / (rows * cellH), 1);
      if (s > scale + 1e-6) {
        cols = c;
        scale = s;
      }
    }
    const rows = Math.ceil(count / cols);
    const lift = area.height * 0.07;
    const slots: SummarySlot[] = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const inRow = row === rows - 1 ? count - row * cols : cols;
      const col = i - row * cols;
      slots.push({
        x: (col - (inRow - 1) / 2) * cellW * scale,
        y: ((rows - 1) / 2 - row) * cellH * scale + lift,
        z: 0,
        scale,
        rotZ: 0,
      });
    }
    return slots;
  },
};
