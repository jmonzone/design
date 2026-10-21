import type { HoloPatternDef } from "./types";

/** Broad diagonal rainbow bands that roll across the card as it tilts: the classic holo. */
export const RAINBOW_HOLO: HoloPatternDef = {
  id: "rainbow",
  label: "Rainbow",
  glsl: /* glsl */ `
vec3 holo_rainbow(vec2 uv, vec2 lean, float time) {
  float band = uv.x * 0.9 + uv.y * 1.25 + lean.x * 2.6 - lean.y * 1.8;
  vec3 hue = hsv2rgb(vec3(fract(band * 0.75 + time * 0.03), 0.6, 1.0));
  float sheen = pow(max(0.0, 0.5 + 0.5 * sin(band * 8.0)), 3.0);
  return hue * (0.3 + 0.7 * sheen);
}`,
};
