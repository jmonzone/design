import { CARD_FONTS } from "../../defs/cardFonts";
import { FOIL_AREAS } from "../../defs/foilAreas";
import { HOLDERS } from "../../defs/holders";
import { HOLO_PATTERNS } from "../../defs/holoPatterns";
import { SURFACE_PATTERNS } from "../../defs/surfacePatterns";
import { choiceLever, colorLever, numberLever, textLever, toggleLever, type LeverGroupDef } from "./types";

export const CARD_FACE_LEVERS: LeverGroupDef = {
  id: "card",
  label: "Card",
  description: "The card itself: its shape, frame, type and holo.",
  levers: [
    choiceLever("card.holder", "Presented in", HOLDERS.options),
    numberLever("card.aspect", "Proportions", 1.2, 1.6, 0.01, { hint: "Height over width; a trading card is 1.4." }),
    numberLever("card.cornerRadius", "Corners", 0, 0.15, 0.005),
    numberLever("card.thickness", "Thickness", 0, 0.04, 0.002),
    numberLever("card.border", "Border", 0.02, 0.12, 0.005),
    colorLever("card.frameColor", "Frame"),
    numberLever("card.frameTint", "Rarity tint", 0, 1, 0.01, { hint: "How much of its rarity's color the frame takes." }),
    choiceLever("card.font", "Type", CARD_FONTS.options),
    colorLever("card.textColor", "Text"),
    choiceLever("card.holoPattern", "Holo", HOLO_PATTERNS.options),
    choiceLever("card.foilArea", "Holo area", FOIL_AREAS.options),
    numberLever("card.foil", "Holo strength", 0, 1.5, 0.01, { hint: "Multiplied by each rarity's own foil." }),
    numberLever("card.gloss", "Glare", 0, 1, 0.01),
    numberLever("card.tilt", "Tilt", 0, 1, 0.01, { hint: "How much cards lean with the phone or pointer." }),
    toggleLever("card.showValue", "Show value"),
    textLever("card.currency", "Currency", 4),
  ],
};

export const CARD_BACK_LEVERS: LeverGroupDef = {
  id: "cardBack",
  label: "Card back",
  levers: [
    colorLever("card.backColorA", "Top color"),
    colorLever("card.backColorB", "Bottom color"),
    choiceLever("card.backPattern", "Print", SURFACE_PATTERNS.options),
    textLever("card.backEmblem", "Emblem", 6, "A symbol or a short word in the middle."),
  ],
};
