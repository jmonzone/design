import { DISMISS_DIRECTIONS } from "../../defs/dismissDirections";
import { REVEAL_ORDERS } from "../../defs/revealOrders";
import { SUMMARY_LAYOUTS } from "../../defs/summaryLayouts";
import { choiceLever, numberLever, toggleLever, type LeverGroupDef } from "./types";

export const REVEAL_LEVERS: LeverGroupDef = {
  id: "reveal",
  label: "Reveal",
  description: "How the cards come out, one by one, and how the pull is laid out at the end.",
  levers: [
    choiceLever("reveal.order", "Order", REVEAL_ORDERS.options),
    toggleLever("reveal.flip", "Face down, then flip"),
    numberLever("reveal.cardFill", "Card size", 0.45, 0.92, 0.01, { hint: "How much of the view a revealed card fills." }),
    numberLever("reveal.stackSpread", "Messy stack", 0, 1, 0.01),
    choiceLever("reveal.dismissDirection", "Tap sends it", DISMISS_DIRECTIONS.options),
    choiceLever("reveal.summaryLayout", "Summary", SUMMARY_LAYOUTS.options),
    toggleLever("reveal.inspect", "Tap to inspect", "Tapping a card in the summary brings it up close."),
  ],
};
