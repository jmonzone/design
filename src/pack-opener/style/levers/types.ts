import type { ChoiceOption } from "../../defs/registry";

interface LeverBase {
  /** Where its value lives in a RipStyle, dotted ("card.foil", "rarities.rare.glow"). */
  readonly path: string;
  readonly label: string;
  /** One line on what it does, for a tooltip or caption. */
  readonly hint?: string;
}

export interface NumberLever extends LeverBase {
  readonly kind: "number";
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Shown after the value: "s", "×", "°". */
  readonly unit?: string;
}

export interface ColorLever extends LeverBase {
  readonly kind: "color";
}

export interface ToggleLever extends LeverBase {
  readonly kind: "toggle";
}

export interface ChoiceLever extends LeverBase {
  readonly kind: "choice";
  readonly options: readonly ChoiceOption[];
}

export interface TextLever extends LeverBase {
  readonly kind: "text";
  readonly maxLength: number;
}

/** One tunable value of a RipStyle: everything a panel needs to draw its control, and all a share link or a
 * pasted style is checked against. */
export type LeverDef = NumberLever | ColorLever | ToggleLever | ChoiceLever | TextLever;

/** A titled section of levers. */
export interface LeverGroupDef {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly levers: readonly LeverDef[];
  /** Set on a rarity's own group: which rarity it tunes. */
  readonly rarityId?: string;
}

export function numberLever(
  path: string,
  label: string,
  min: number,
  max: number,
  step: number,
  extra: { unit?: string; hint?: string } = {},
): NumberLever {
  return { kind: "number", path, label, min, max, step, ...extra };
}

export function colorLever(path: string, label: string, hint?: string): ColorLever {
  return { kind: "color", path, label, hint };
}

export function toggleLever(path: string, label: string, hint?: string): ToggleLever {
  return { kind: "toggle", path, label, hint };
}

export function choiceLever(path: string, label: string, options: readonly ChoiceOption[], hint?: string): ChoiceLever {
  return { kind: "choice", path, label, options, hint };
}

export function textLever(path: string, label: string, maxLength: number, hint?: string): TextLever {
  return { kind: "text", path, label, maxLength, hint };
}
