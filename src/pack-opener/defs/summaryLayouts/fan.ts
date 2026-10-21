import type { SummaryLayoutDef, SummarySlot } from "./types";

/** The pull held like a hand of cards: an overlapping arc, the last card on top. */
export const FAN_LAYOUT: SummaryLayoutDef = {
  id: "fan",
  label: "Fan",
  slots: (count, area, unit) => {
    if (count === 0) return [];
    const spread = Math.min(1.25, 0.17 * (count - 1));
    const radius = unit.height * 3.2;
    const raw = Array.from({ length: count }, (_, i) => {
      const a = count === 1 ? 0 : -spread / 2 + (spread * i) / (count - 1);
      return { x: radius * Math.sin(a), y: radius * (Math.cos(a) - 1), a };
    });
    const drop = Math.max(...raw.map((p) => -p.y));
    const width = Math.max(...raw.map((p) => Math.abs(p.x))) * 2 + unit.width * 1.15;
    const height = unit.height * 1.1 + drop;
    const scale = Math.min(1, (area.width * 0.92) / width, (area.height * 0.72) / height);
    const lift = (drop * scale) / 2 + area.height * 0.06;
    return raw.map(
      (p, i): SummarySlot => ({ x: p.x * scale, y: p.y * scale + lift, z: i * 0.012, scale, rotZ: -p.a }),
    );
  },
};
