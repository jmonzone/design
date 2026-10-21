import type { Def } from "../registry";

/**
 * A holographic foil's look. `glsl` defines `vec3 holo_<id>(vec2 uv, vec2 lean, float time)`: the light the foil
 * adds at `uv` (0–1 across the card face) while the card leans `lean` (the eye's direction across the card's
 * surface, so it shifts as the card tilts or flips). It can use the card shader's `hsv2rgb`, `hash21` and `noise2`.
 */
export interface HoloPatternDef extends Def {
  readonly glsl: string;
}
