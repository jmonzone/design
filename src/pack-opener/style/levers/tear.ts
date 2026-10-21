import { TEAR_INPUTS } from "../../defs/tearInputs";
import { choiceLever, numberLever, toggleLever, type LeverGroupDef } from "./types";

export const TEAR_LEVERS: LeverGroupDef = {
  id: "tear",
  label: "Tear",
  description: "Ripping the top off: the gesture, the torn edge and what spills out.",
  levers: [
    choiceLever("tear.input", "Gesture", TEAR_INPUTS.options),
    numberLever("tear.commitAt", "Commit point", 0.2, 0.95, 0.01, {
      hint: "How far across a swipe must get before letting go still finishes it.",
    }),
    numberLever("tear.lineY", "Tear line", 0.06, 0.22, 0.005, { hint: "How far down from the top it tears." }),
    numberLever("tear.teeth", "Teeth", 6, 48, 1),
    numberLever("tear.jaggedness", "Jaggedness", 0, 1, 0.01),
    numberLever("tear.peel", "Peel", 0, 1, 0.01, { hint: "How far the strip curls up as it tears." }),
    numberLever("tear.flapFling", "Fling", 0, 1, 0.01, { hint: "How hard the torn strip is thrown away." }),
    numberLever("tear.sparks", "Sparks", 0, 1, 0.01),
    numberLever("tear.leak", "Light leak", 0, 1.5, 0.01),
    toggleLever("tear.tease", "Tease the best card", "The light leaking out is the color of the best card inside."),
    toggleLever("tear.guide", "Tear guide", "A shimmering line showing where to tear."),
  ],
};
