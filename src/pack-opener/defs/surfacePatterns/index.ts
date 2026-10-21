import { registry } from "../registry";
import { BURST_PATTERN } from "./burst";
import { DIAMONDS_PATTERN } from "./diamonds";
import { DOTS_PATTERN } from "./dots";
import { NO_PATTERN } from "./none";
import { STRIPES_PATTERN } from "./stripes";
import type { SurfacePatternDef } from "./types";
import { WAVES_PATTERN } from "./waves";

export type { SurfacePatternDef } from "./types";

export const SURFACE_PATTERNS = registry<SurfacePatternDef>([
  NO_PATTERN,
  STRIPES_PATTERN,
  DOTS_PATTERN,
  BURST_PATTERN,
  DIAMONDS_PATTERN,
  WAVES_PATTERN,
]);
