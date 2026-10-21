import type { HoloPatternDef } from "./types";

/** Swirling nebula color with a scatter of twinkling stars. */
export const GALAXY_HOLO: HoloPatternDef = {
  id: "galaxy",
  label: "Galaxy",
  glsl: /* glsl */ `
vec3 holo_galaxy(vec2 uv, vec2 lean, float time) {
  vec2 p = uv * 3.0 + lean * 1.6;
  float n = noise2(p * 2.0 + time * 0.05) * 0.6 + noise2(p * 5.0 + 3.1) * 0.4;
  vec3 hue = hsv2rgb(vec3(fract(n * 1.4 + lean.x * 0.8 + time * 0.02), 0.65, 1.0));
  vec2 starCell = floor(uv * vec2(120.0, 168.0));
  float star = step(0.982, hash21(starCell)) * (0.5 + 0.5 * sin(time * 3.0 + hash21(starCell + 7.0) * 30.0 + lean.x * 6.0));
  return hue * smoothstep(0.3, 0.85, n) * 0.95 + vec3(star) * 1.4;
}`,
};
