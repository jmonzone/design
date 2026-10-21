import { clamp01 } from "./scalar";

export type Rgb = readonly [number, number, number];

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/** A "#rrggbb" (or "#rgb") color as sRGB channels, 0–1. Anything unparseable is mid grey. */
export function hexToRgb(hex: string): Rgb {
  const match = HEX.exec(hex);
  if (!match) return [0.5, 0.5, 0.5];
  let digits = match[1]!;
  if (digits.length === 3) digits = digits.replace(/./g, (c) => c + c);
  const n = parseInt(digits, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (c: number) => Math.round(clamp01(c) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** A hex color in linear light, what shader math (and three's working color space) expects. */
export function hexToLinear(hex: string): Rgb {
  const [r, g, b] = hexToRgb(hex);
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/** Two hex colors mixed in sRGB, `t` of the way from `a` to `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** `hex` lightened toward white (positive `amount`) or darkened toward black (negative). */
export function shadeHex(hex: string, amount: number): string {
  return amount >= 0 ? mixHex(hex, "#ffffff", amount) : mixHex(hex, "#000000", -amount);
}
