import { registry } from "../../defs/registry";
import { DEFAULT_RIP_STYLE } from "../defaults";
import { mergeStyle } from "../merge";
import type { RipStyle } from "../types";
import { ARCANE_PRESET } from "./arcane";
import { BOOSTER_PRESET } from "./booster";
import { FUNGAL_PRESET } from "./fungal";
import { GRADED_PRESET } from "./graded";
import { HOLO_CHASE_PRESET } from "./holoChase";
import { QUICK_RIP_PRESET } from "./quickRip";
import type { RipPreset } from "./types";

export type { RipPreset } from "./types";

export const RIP_PRESETS = registry<RipPreset>([
  BOOSTER_PRESET,
  HOLO_CHASE_PRESET,
  GRADED_PRESET,
  ARCANE_PRESET,
  QUICK_RIP_PRESET,
  FUNGAL_PRESET,
]);

/** A preset's full style: its levers over the defaults. */
export function presetStyle(id: string): RipStyle {
  return mergeStyle(DEFAULT_RIP_STYLE, RIP_PRESETS.of(id).style);
}
