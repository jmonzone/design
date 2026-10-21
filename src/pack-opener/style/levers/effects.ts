import { numberLever, type LeverGroupDef } from "./types";

const x = { unit: "×" };

export const EFFECTS_LEVERS: LeverGroupDef = {
  id: "effects",
  label: "Effects",
  description: "Turns every rarity's effects up or down at once.",
  levers: [
    numberLever("effects.particles", "Particles", 0, 2, 0.05, x),
    numberLever("effects.glow", "Glow", 0, 2, 0.05, x),
    numberLever("effects.rays", "Light rays", 0, 2, 0.05, x),
    numberLever("effects.shake", "Shake", 0, 2, 0.05, x),
    numberLever("effects.flash", "Flash", 0, 2, 0.05, x),
  ],
};
