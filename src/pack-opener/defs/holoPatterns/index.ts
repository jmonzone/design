import { registry } from "../registry";
import { GALAXY_HOLO } from "./galaxy";
import { LINES_HOLO } from "./lines";
import { RAINBOW_HOLO } from "./rainbow";
import { SPARKLE_HOLO } from "./sparkle";
import type { HoloPatternDef } from "./types";

export type { HoloPatternDef } from "./types";

export const HOLO_PATTERNS = registry<HoloPatternDef>([RAINBOW_HOLO, SPARKLE_HOLO, LINES_HOLO, GALAXY_HOLO]);

/** A pattern's index in HOLO_PATTERNS, which is how the card shader picks it. */
export function holoPatternIndexOf(id: string): number {
  return Math.max(0, HOLO_PATTERNS.all.findIndex((def) => def.id === id));
}
