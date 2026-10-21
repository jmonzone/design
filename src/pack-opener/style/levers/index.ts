import type { RarityStyle, RipStyle } from "../types";
import { CARD_BACK_LEVERS, CARD_FACE_LEVERS } from "./card";
import { EFFECTS_LEVERS } from "./effects";
import { PACK_LEVERS } from "./pack";
import { rarityLeverGroup } from "./rarity";
import { REVEAL_LEVERS } from "./reveal";
import { SCENE_LEVERS } from "./scene";
import { TEAR_LEVERS } from "./tear";
import { TIMING_LEVERS } from "./timing";
import type { LeverDef, LeverGroupDef } from "./types";

export * from "./types";
export { rarityLeverGroup } from "./rarity";

/** Every lever group but the rarities', which depend on which rarities a style has. */
export const STYLE_LEVER_GROUPS: readonly LeverGroupDef[] = [
  TIMING_LEVERS,
  PACK_LEVERS,
  TEAR_LEVERS,
  CARD_FACE_LEVERS,
  CARD_BACK_LEVERS,
  REVEAL_LEVERS,
  EFFECTS_LEVERS,
  SCENE_LEVERS,
];

/** A style's rarities, least to most rare. */
export function raritiesByRank(style: RipStyle): [string, RarityStyle][] {
  return Object.entries(style.rarities).sort(([, a], [, b]) => a.rank - b.rank);
}

/** Every lever group for `style`: the fixed ones, then one per rarity, least rare first. */
export function leverGroupsOf(style: RipStyle): LeverGroupDef[] {
  return [...STYLE_LEVER_GROUPS, ...raritiesByRank(style).map(([id, rarity]) => rarityLeverGroup(id, rarity))];
}

export function allLeversOf(style: RipStyle): LeverDef[] {
  return leverGroupsOf(style).flatMap((group) => group.levers);
}
