import { clamp } from "../math/scalar";
import { hexToRgb, isHexColor, rgbToHex } from "../math/color";
import { DEFAULT_RARITY, DEFAULT_RIP_STYLE } from "./defaults";
import { allLeversOf, type LeverDef } from "./levers";
import { getAtPath, isPlainObject, setAtPath } from "./paths";
import type { RarityStyle, RipStyle } from "./types";

/** What a rarity id may look like (it becomes part of lever paths, so no dots). */
export const RARITY_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/i;

/** `value` if it's a valid setting for `lever` (a number clamped into range), else `fallback`. */
export function sanitizeLeverValue(lever: LeverDef, value: unknown, fallback: unknown): unknown {
  switch (lever.kind) {
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? clamp(value, lever.min, lever.max) : fallback;
    case "color":
      return isHexColor(value) ? rgbToHex(hexToRgb(value)) : fallback;
    case "toggle":
      return typeof value === "boolean" ? value : fallback;
    case "choice":
      return typeof value === "string" && lever.options.some((option) => option.value === value) ? value : fallback;
    case "text":
      return typeof value === "string" ? value.slice(0, lever.maxLength) : fallback;
  }
}

/**
 * A complete, valid RipStyle from anything (a parsed share link, pasted JSON, a saved file): every lever's value
 * from `candidate` where it's valid, else `base`'s. Rarities are `base`'s plus any new ones `candidate` brings.
 * Nothing that isn't a lever gets through.
 */
export function sanitizeStyle(candidate: unknown, base: RipStyle = DEFAULT_RIP_STYLE): RipStyle {
  const rarities: Record<string, RarityStyle> = { ...base.rarities };
  const incoming = getAtPath(candidate, "rarities");
  if (isPlainObject(incoming)) {
    for (const id of Object.keys(incoming)) if (RARITY_ID.test(id) && !rarities[id]) rarities[id] = DEFAULT_RARITY;
  }
  let style: RipStyle = { ...base, rarities };
  for (const lever of allLeversOf(style)) {
    const value = getAtPath(candidate, lever.path);
    if (value === undefined) continue;
    style = setAtPath(style, lever.path, sanitizeLeverValue(lever, value, getAtPath(style, lever.path)));
  }
  return style;
}
