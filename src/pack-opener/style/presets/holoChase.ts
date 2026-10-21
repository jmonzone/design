import type { RipPreset } from "./types";

export const HOLO_CHASE_PRESET: RipPreset = {
  id: "holo-chase",
  label: "Holo Chase",
  description: "Everything turned up: full-card glitter, long build-ups and a big payoff on every hit.",
  style: {
    timing: { flipEase: "easeOutBack" },
    pack: { colorA: "#0d9488", colorB: "#042f2e", accent: "#a7f3d0", pattern: "waves", foil: 0.95, shine: 0.85 },
    card: {
      holoPattern: "sparkle",
      foilArea: "full",
      foil: 1.2,
      frameColor: "#0b1a1a",
      backColorA: "#115e59",
      backColorB: "#021817",
      backPattern: "waves",
    },
    effects: { particles: 1.4, glow: 1.3, rays: 1.4, shake: 1.3, flash: 1.3 },
    scene: { bgTop: "#062a26", bgBottom: "#010807", ambientGlow: 0.9, dust: 0.7 },
    rarities: { epic: { anticipationS: 1.2 }, legendary: { anticipationS: 2.2, particles: 480 } },
  },
};
