/**
 * One card a pack can hold. Plain data from the host: what the card is, never how it looks while it's revealed
 * (that's the RipStyle's). `rarityId` names one of the style's rarities, which decides its foil, glow and how much
 * ceremony its reveal gets.
 */
export interface PackCard {
  readonly id: string;
  readonly name: string;
  readonly rarityId: string;
  /** The art in the card's window: any image the page can load (another origin needs CORS headers). */
  readonly imageUrl?: string;
  /** A short line under the name: a type, set or bit of flavor. */
  readonly subtitle?: string;
  /** What it's worth, printed on the face when the style shows values. */
  readonly value?: number;
  /** A graded card's grade, printed on its slab's label when the style holds cards in slabs. */
  readonly grade?: CardGrade;
}

export interface CardGrade {
  /** The words, e.g. "Gem Mint". */
  readonly label: string;
  /** The number, e.g. "10". */
  readonly score: string;
}

/** One pack to rip: its wrapper's print and the cards inside, in the order the host drew them. */
export interface PackContents {
  /** Changing it starts a new rip. */
  readonly id: string;
  /** Printed on the wrapper. */
  readonly name: string;
  readonly subtitle?: string;
  /** Art printed on the wrapper. */
  readonly artUrl?: string;
  readonly cards: readonly PackCard[];
}
