import type { RipPreset } from "./types";

export const QUICK_RIP_PRESET: RipPreset = {
  id: "quick",
  label: "Quick Rip",
  description: "No ceremony: tap the pack and the cards come out face up. For the hundredth pack of the day.",
  style: {
    timing: { speed: 1.8 },
    tear: { input: "tap" },
    reveal: { flip: false, dismissDirection: "up" },
    effects: { particles: 0.6, rays: 0.5, shake: 0.4, flash: 0.5 },
    rarities: { rare: { anticipationS: 0 }, epic: { anticipationS: 0.3 }, legendary: { anticipationS: 0.6 } },
  },
};
