import type { RipPreset } from "./types";

export const FUNGAL_PRESET: RipPreset = {
  id: "fungal",
  label: "Club Fungal",
  description: "Moss green and mushroom pink, rounded type and glitter foil.",
  style: {
    pack: { colorA: "#65a30d", colorB: "#14532d", accent: "#f0abfc", pattern: "dots", crinkle: 0.7, foil: 0.5 },
    card: {
      font: "rounded",
      frameColor: "#1d2a17",
      holoPattern: "sparkle",
      cornerRadius: 0.08,
      backColorA: "#4d7c0f",
      backColorB: "#1a2e05",
      backPattern: "dots",
      backEmblem: "🍄",
    },
    scene: { bgTop: "#16290f", bgBottom: "#030803" },
  },
};
