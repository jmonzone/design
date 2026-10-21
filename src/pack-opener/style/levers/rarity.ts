import { HAPTIC_PATTERNS } from "../../defs/hapticPatterns";
import type { RarityStyle } from "../types";
import { choiceLever, colorLever, numberLever, textLever, type LeverGroupDef } from "./types";

/** The levers of one rarity's look, at `rarities.<id>.*`. */
export function rarityLeverGroup(id: string, rarity: RarityStyle): LeverGroupDef {
  const at = (field: keyof RarityStyle) => `rarities.${id}.${field}`;
  return {
    id: `rarity:${id}`,
    rarityId: id,
    label: rarity.label,
    levers: [
      textLever(at("label"), "Name", 16),
      numberLever(at("rank"), "Rank", 0, 9, 1, { hint: "Higher is rarer: revealed later and teased by the tear." }),
      colorLever(at("color"), "Color"),
      numberLever(at("foil"), "Foil", 0, 1, 0.01),
      numberLever(at("glow"), "Glow", 0, 1.5, 0.01),
      numberLever(at("rays"), "Light rays", 0, 1.5, 0.01),
      numberLever(at("particles"), "Burst", 0, 600, 10, { hint: "Particles thrown off as it turns over." }),
      numberLever(at("anticipationS"), "Build-up", 0, 3, 0.05, {
        unit: "s",
        hint: "Glow seeping out and a tremble before it turns over.",
      }),
      numberLever(at("flipSlowdown"), "Slow flip", 1, 3, 0.05, { unit: "×" }),
      numberLever(at("shake"), "Shake", 0, 1.5, 0.01),
      numberLever(at("flash"), "Flash", 0, 1.5, 0.01),
      choiceLever(at("haptic"), "Haptic", HAPTIC_PATTERNS.options),
    ],
  };
}
