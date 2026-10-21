export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const ZERO2: Vec2 = { x: 0, y: 0 };

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function length2(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

/** `v` scaled to length 1, or `fallback` when it has no direction. */
export function normalize2(v: Vec2, fallback: Vec2): Vec2 {
  const len = length2(v);
  return len < 1e-6 ? fallback : { x: v.x / len, y: v.y / len };
}
