import { registry } from "../registry";
import { FAN_LAYOUT } from "./fan";
import { GRID_LAYOUT } from "./grid";
import type { SummaryLayoutDef } from "./types";

export type { SizeLike, SummaryLayoutDef, SummarySlot } from "./types";

export const SUMMARY_LAYOUTS = registry<SummaryLayoutDef>([GRID_LAYOUT, FAN_LAYOUT]);
