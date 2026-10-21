import { HAPTIC_PATTERNS, type HapticBlock } from "../defs/hapticPatterns";
import type { RipEvent } from "./events";

/** The vibration for a beat of the rip (empty for none): ticks as the tear runs, a thump as it opens, and each
 * card's reveal its rarity's own. Play it with any haptics library (bzzz takes these blocks as they are). */
export function hapticOf(event: RipEvent): readonly HapticBlock[] {
  switch (event.type) {
    case "tear-progress":
    case "card-anticipate":
    case "card-focus":
      return HAPTIC_PATTERNS.of("tick").blocks;
    case "nudge":
      return HAPTIC_PATTERNS.of("tap").blocks;
    case "open":
      return HAPTIC_PATTERNS.of("thump").blocks;
    case "card-reveal":
      return HAPTIC_PATTERNS.of(event.rarity.haptic).blocks;
    default:
      return [];
  }
}
