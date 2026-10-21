import type { HoloPatternDef } from "./types";

/** Tight parallel etched lines, like a reverse holo: thin streaks of color that slide as the card leans. */
export const LINES_HOLO: HoloPatternDef = {
  id: "lines",
  label: "Etched lines",
  glsl: /* glsl */ `
vec3 holo_lines(vec2 uv, vec2 lean, float time) {
  float d = (uv.x - uv.y * 0.7) * 26.0 + lean.x * 12.0 - lean.y * 6.0;
  float line = pow(abs(sin(d)), 16.0);
  vec3 hue = hsv2rgb(vec3(fract((uv.x + uv.y) * 0.45 + lean.y * 2.0 + time * 0.02), 0.55, 1.0));
  return hue * (0.12 + line * 0.95);
}`,
};
