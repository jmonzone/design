import { registry, type Def } from "./registry";

/** One step of a vibration pattern, in the shape haptics libraries such as bzzz play. */
export type HapticBlock =
  | { readonly type: "pulse"; readonly duration: number; readonly intensity?: number }
  | { readonly type: "gap"; readonly duration: number };

export interface HapticPatternDef extends Def {
  readonly blocks: readonly HapticBlock[];
}

export const HAPTIC_PATTERNS = registry<HapticPatternDef>([
  { id: "none", label: "None", blocks: [] },
  { id: "tick", label: "Tick", blocks: [{ type: "pulse", duration: 8, intensity: 0.35 }] },
  { id: "tap", label: "Tap", blocks: [{ type: "pulse", duration: 14, intensity: 0.6 }] },
  {
    id: "thump",
    label: "Thump",
    blocks: [
      { type: "pulse", duration: 22, intensity: 0.9 },
      { type: "gap", duration: 30 },
      { type: "pulse", duration: 12, intensity: 0.4 },
    ],
  },
  {
    id: "rumble",
    label: "Rumble",
    blocks: [
      { type: "pulse", duration: 18, intensity: 0.5 },
      { type: "gap", duration: 22 },
      { type: "pulse", duration: 24, intensity: 0.75 },
      { type: "gap", duration: 22 },
      { type: "pulse", duration: 40, intensity: 1 },
    ],
  },
  {
    id: "celebrate",
    label: "Celebrate",
    blocks: [
      { type: "pulse", duration: 30, intensity: 1 },
      { type: "gap", duration: 40 },
      { type: "pulse", duration: 15, intensity: 0.6 },
      { type: "gap", duration: 30 },
      { type: "pulse", duration: 15, intensity: 0.7 },
      { type: "gap", duration: 30 },
      { type: "pulse", duration: 60, intensity: 1 },
    ],
  },
]);
