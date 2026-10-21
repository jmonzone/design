import { HOLO_PATTERNS } from "../defs/holoPatterns";

/** Helpers every shader here can call. */
export const COMMON_GLSL = /* glsl */ `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float sdRoundRect(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}
`;

/** Every holo pattern's function, plus `holo(pattern, ...)` picking one by its index in HOLO_PATTERNS. */
export const HOLO_GLSL = [
  ...HOLO_PATTERNS.all.map((def) => def.glsl),
  "vec3 holo(float pattern, vec2 uv, vec2 lean, float time) {",
  ...HOLO_PATTERNS.all.map((def, i) => `  if (pattern < ${i}.5) return holo_${def.id}(uv, lean, time);`),
  "  return vec3(0.0);",
  "}",
].join("\n");

/** World position, world normal and a 0–1 face UV, for surfaces lit by view angle. */
export const SURFACE_VERTEX = /* glsl */ `
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFace;
void main() {
  vUv = position.xy / uSize + 0.5;
  vFace = normal.z > 0.5 ? 1.0 : (normal.z < -0.5 ? -1.0 : 0.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

/** Local xy through to the fragment, for flat planes drawn procedurally. */
export const PLANE_VERTEX = /* glsl */ `
varying vec2 vPos;
void main() {
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
