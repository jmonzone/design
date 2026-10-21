import { registry } from "../registry";
import type { HolderDef } from "./types";

export { holderSizeOf, type HolderDef, type HolderSize } from "./types";

/** The bare card. */
export const NO_HOLDER: HolderDef = { id: "none", label: "Bare card", pad: 0, labelHeight: 0, caseDepth: 0 };

/** A graded slab: a clear acrylic case with the card's label (name, grade) in a band above it. */
export const SLAB_HOLDER: HolderDef = { id: "slab", label: "Graded slab", pad: 0.075, labelHeight: 0.3, caseDepth: 0.08 };

export const HOLDERS = registry<HolderDef>([NO_HOLDER, SLAB_HOLDER]);
