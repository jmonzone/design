import type { Vec2 } from "../math/vec";
import { registry, type Def } from "./registry";

/** Where a revealed card flies when it's tapped away (a swipe throws it its own way). Screen space, y up. */
export interface DismissDirectionDef extends Def {
  readonly dir: Vec2;
}

export const DISMISS_DIRECTIONS = registry<DismissDirectionDef>([
  { id: "left", label: "Left", dir: { x: -1, y: 0.15 } },
  { id: "right", label: "Right", dir: { x: 1, y: 0.15 } },
  { id: "up", label: "Up", dir: { x: 0.08, y: 1 } },
  { id: "down", label: "Down", dir: { x: -0.05, y: -1 } },
]);
