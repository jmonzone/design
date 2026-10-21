import type { Def } from "../registry";

/** Where one card rests once the whole pull is laid out, in world units from the view's center (y up). */
export interface SummarySlot {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly scale: number;
  readonly rotZ: number;
}

export interface SizeLike {
  readonly width: number;
  readonly height: number;
}

/** How the pull is laid out at the end: every card's slot within `area` (the visible view), for cards of `unit`
 * size. Leaves the bottom of the view for a host's buttons. */
export interface SummaryLayoutDef extends Def {
  readonly slots: (count: number, area: SizeLike, unit: SizeLike) => SummarySlot[];
}
