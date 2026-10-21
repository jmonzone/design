import { DEFAULT_RARITY } from "./defaults";
import { isPlainObject } from "./paths";
import type { DeepPartial, RarityStyle, RipStyle } from "./types";

/** `base` with every field `over` sets laid over it; a rarity `over` adds starts from DEFAULT_RARITY. */
export function mergeStyle(base: RipStyle, over: DeepPartial<RipStyle> | undefined): RipStyle {
  const merged = deepMerge(base, over) as RipStyle;
  const rarities: Record<string, RarityStyle> = {};
  for (const [id, rarity] of Object.entries(merged.rarities)) rarities[id] = { ...DEFAULT_RARITY, ...rarity };
  return { ...merged, rarities };
}

function deepMerge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) out[key] = deepMerge(base[key], value);
  return out;
}
