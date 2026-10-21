import type { RipPreset } from "./types";

export const ARCANE_PRESET: RipPreset = {
  id: "arcane",
  label: "Arcane",
  description: "Midnight blue and gold, serif type and galaxy foil, revealed slowly.",
  style: {
    timing: { speed: 0.85 },
    pack: { colorA: "#1e3a8a", colorB: "#020617", accent: "#fcd34d", pattern: "diamonds", foil: 0.8 },
    card: {
      font: "serif",
      frameColor: "#0b1020",
      holoPattern: "galaxy",
      backColorA: "#1e293b",
      backColorB: "#020617",
      backPattern: "burst",
      backEmblem: "☾",
    },
    scene: { bgTop: "#0b1535", bgBottom: "#000208", dust: 0.9, fov: 30 },
    rarities: { legendary: { color: "#f59e0b" } },
  },
};
