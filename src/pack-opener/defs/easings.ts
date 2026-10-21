import { registry, type Def } from "./registry";

/** A motion curve: maps 0–1 progress through a move to 0–1 of the way there (a back or elastic overshoots). */
export interface EasingDef extends Def {
  readonly ease: (t: number) => number;
}

const BACK = 1.70158;

export const EASINGS = registry<EasingDef>([
  { id: "easeOutCubic", label: "Ease out", ease: (t) => 1 - Math.pow(1 - t, 3) },
  { id: "easeInOutCubic", label: "Ease in-out", ease: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) },
  { id: "easeInCubic", label: "Ease in", ease: (t) => t * t * t },
  { id: "easeOutQuint", label: "Ease out (strong)", ease: (t) => 1 - Math.pow(1 - t, 5) },
  { id: "easeOutExpo", label: "Snap", ease: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)) },
  {
    id: "easeOutBack",
    label: "Overshoot",
    ease: (t) => 1 + (BACK + 1) * Math.pow(t - 1, 3) + BACK * Math.pow(t - 1, 2),
  },
  { id: "easeInBack", label: "Wind up", ease: (t) => (BACK + 1) * t * t * t - BACK * t * t },
  {
    id: "easeOutElastic",
    label: "Elastic",
    ease: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  },
  { id: "linear", label: "Linear", ease: (t) => t },
]);

export function easingOf(id: string): (t: number) => number {
  return EASINGS.of(id).ease;
}
