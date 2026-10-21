import { SURFACE_PATTERNS } from "../../defs/surfacePatterns";
import { choiceLever, colorLever, numberLever, toggleLever, type LeverGroupDef } from "./types";

export const PACK_LEVERS: LeverGroupDef = {
  id: "pack",
  label: "Pack",
  description: "The sealed wrapper: its print and how it catches the light.",
  levers: [
    colorLever("pack.colorA", "Top color"),
    colorLever("pack.colorB", "Bottom color"),
    colorLever("pack.accent", "Accent", "The crimped seals and the print's highlights."),
    choiceLever("pack.pattern", "Print", SURFACE_PATTERNS.options),
    toggleLever("pack.showName", "Show name"),
    colorLever("pack.labelColor", "Name color"),
    numberLever("pack.foil", "Foil", 0, 1, 0.01, { hint: "Plain plastic at 0, metallic iridescent foil at 1." }),
    numberLever("pack.shine", "Shine", 0, 1, 0.01),
    numberLever("pack.crinkle", "Crinkle", 0, 1, 0.01),
    numberLever("pack.bulge", "Puff", 0, 1, 0.01),
    numberLever("pack.width", "Width", 1.05, 1.5, 0.01, { unit: "× card" }),
    numberLever("pack.bob", "Float", 0, 1, 0.01),
    numberLever("pack.sway", "Sway", 0, 1, 0.01),
  ],
};
