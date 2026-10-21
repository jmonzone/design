import type { RipPreset } from "./types";

export const GRADED_PRESET: RipPreset = {
  id: "graded",
  label: "Graded Slab",
  description: "Every pull arrives sealed in a graded slab with its label, from a black chrome pack.",
  style: {
    timing: { speed: 1.1 },
    pack: {
      colorA: "#1f2937",
      colorB: "#030712",
      accent: "#d4d4d8",
      labelColor: "#f4f4f5",
      pattern: "none",
      foil: 0.95,
      shine: 0.9,
      crinkle: 0.25,
    },
    card: {
      holder: "slab",
      holoPattern: "lines",
      frameTint: 0.4,
      backColorA: "#27272a",
      backColorB: "#09090b",
      backPattern: "stripes",
      backEmblem: "◆",
    },
    reveal: { cardFill: 0.8, stackSpread: 0.15 },
    effects: { particles: 0.7, rays: 0.6, shake: 0.6 },
    scene: { bgTop: "#23262d", bgBottom: "#0a0b0e", vignette: 0.45, dust: 0.25, ambientGlow: 0.45 },
  },
};
