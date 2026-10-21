import type { HoloPatternDef } from "./types";

/** Fine glitter: tiny points that each catch the light at their own angle, over a faint rainbow wash. */
export const SPARKLE_HOLO: HoloPatternDef = {
  id: "sparkle",
  label: "Glitter",
  glsl: /* glsl */ `
vec3 holo_sparkle(vec2 uv, vec2 lean, float time) {
  vec2 grid = uv * vec2(64.0, 90.0);
  vec2 cell = floor(grid);
  float h = hash21(cell);
  float phase = h * 6.2831 + lean.x * 9.0 + lean.y * 7.0 + time * 0.4;
  float glint = pow(max(0.0, sin(phase)), 22.0) * step(0.45, h);
  float spot = 1.0 - smoothstep(0.0, 0.5, length(fract(grid) - 0.5));
  vec3 tint = hsv2rgb(vec3(fract(h * 3.0 + lean.x), 0.35, 1.0));
  vec3 wash = hsv2rgb(vec3(fract(uv.y * 0.8 + lean.x * 1.5), 0.45, 1.0)) * 0.14;
  return tint * glint * spot * 2.4 + wash;
}`,
};
