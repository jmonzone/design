import type { Def } from "../registry";

/** What a card is presented in, in card widths: the clear room around it, a label band above it and the case's
 * depth. A bare card has none of them. */
export interface HolderDef extends Def {
  readonly pad: number;
  readonly labelHeight: number;
  readonly caseDepth: number;
}

/** A card in its holder: the whole thing's size, and where the card and label sit in it (y up, from its center). */
export interface HolderSize {
  readonly width: number;
  readonly height: number;
  readonly cardY: number;
  readonly labelY: number;
}

export function holderSizeOf(holder: HolderDef, cardWidth: number, cardHeight: number): HolderSize {
  const gap = holder.labelHeight > 0 ? holder.pad * 0.6 : 0;
  const width = cardWidth + holder.pad * 2;
  const height = cardHeight + holder.pad * 2 + holder.labelHeight + gap;
  return {
    width,
    height,
    cardY: -height / 2 + holder.pad + cardHeight / 2,
    labelY: height / 2 - holder.pad - holder.labelHeight / 2,
  };
}
