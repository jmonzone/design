export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

export function clamp01(x: number): number {
  return clamp(x, 0, 1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Hermite step from 0 at `edge0` to 1 at `edge1` (either order). */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** How far `t` is through the span that starts at `start` and lasts `duration`: 0 before it (or with no start),
 * 1 once it's over (a zero-length span is over the moment it starts). */
export function spanProgress(t: number, start: number | undefined, duration: number): number {
  if (start === undefined || t < start) return 0;
  if (duration <= 0) return 1;
  return clamp01((t - start) / duration);
}
