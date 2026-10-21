import { EASINGS } from "../../defs/easings";
import { choiceLever, numberLever, type LeverGroupDef } from "./types";

const s = { unit: "s" };

export const TIMING_LEVERS: LeverGroupDef = {
  id: "timing",
  label: "Timing",
  description: "How long each beat of the rip lasts. Speed scales them all.",
  levers: [
    numberLever("timing.speed", "Speed", 0.25, 3, 0.05, { unit: "×", hint: "Plays every beat faster or slower." }),
    numberLever("timing.introS", "Pack drop-in", 0, 2, 0.05, s),
    numberLever("timing.autoTearS", "Tap tear", 0.2, 2.5, 0.05, { ...s, hint: "A tapped (or autoplayed) tear." }),
    numberLever("timing.tearFinishS", "Tear finish", 0.05, 1, 0.01, {
      ...s,
      hint: "How long a released swipe takes to finish tearing.",
    }),
    numberLever("timing.openS", "Open", 0.4, 2.5, 0.05, { ...s, hint: "Flap off, pack away, cards out." }),
    numberLever("timing.presentS", "Card lift", 0.1, 1.2, 0.01, s),
    numberLever("timing.flipS", "Card flip", 0.15, 1.5, 0.01, s),
    numberLever("timing.dismissS", "Card exit", 0.15, 1.2, 0.01, s),
    numberLever("timing.nextDelayS", "Between cards", 0, 0.6, 0.01, s),
    numberLever("timing.autoAdvanceS", "Auto advance", 0, 5, 0.1, { ...s, hint: "0 waits for a tap." }),
    numberLever("timing.autoplayHoldS", "Autoplay hold", 0.2, 3, 0.05, s),
    numberLever("timing.summaryS", "Gather", 0.3, 2, 0.05, { ...s, hint: "The cards coming together at the end." }),
    choiceLever("timing.introEase", "Drop-in curve", EASINGS.options),
    choiceLever("timing.presentEase", "Lift curve", EASINGS.options),
    choiceLever("timing.flipEase", "Flip curve", EASINGS.options),
    choiceLever("timing.dismissEase", "Exit curve", EASINGS.options),
    choiceLever("timing.summaryEase", "Gather curve", EASINGS.options),
  ],
};
