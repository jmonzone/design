import type { PackCard, PackContents } from "../content/types";
import { REVEAL_ORDERS } from "../defs/revealOrders";
import { hashString } from "../math/random";
import { DEFAULT_RARITY } from "../style/defaults";
import type { RarityStyle, RipStyle } from "../style/types";

/** Every duration of a rip, in seconds on the clock, with the style's speed applied. */
export interface RipDurations {
  readonly intro: number;
  readonly idleBeforeAutoTear: number;
  readonly autoTear: number;
  readonly tearFinish: number;
  readonly springBack: number;
  readonly open: number;
  readonly present: number;
  readonly flip: number;
  readonly dismiss: number;
  readonly nextDelay: number;
  readonly autoAdvance: number;
  readonly autoplayHold: number;
  readonly summary: number;
  readonly focus: number;
  readonly dragSpring: number;
}

/** A pack and a style worked out together: what everything downstream reads. */
export interface ResolvedRip {
  readonly style: RipStyle;
  readonly pack: PackContents;
  /** The cards in the order they come out. */
  readonly cards: readonly PackCard[];
  /** Each card's rarity look, aligned with `cards`. */
  readonly rarities: readonly RarityStyle[];
  /** The rarest look in the pack. */
  readonly best: RarityStyle;
  readonly d: RipDurations;
  /** Fixes every bit of jitter for this pack. */
  readonly seed: number;
}

export function rarityStyleOf(style: RipStyle, rarityId: string): RarityStyle {
  return style.rarities[rarityId] ?? DEFAULT_RARITY;
}

export function resolveRip(pack: PackContents, style: RipStyle): ResolvedRip {
  const drawnRarities = pack.cards.map((card) => rarityStyleOf(style, card.rarityId));
  const order = REVEAL_ORDERS.of(style.reveal.order).order(drawnRarities.map((rarity) => rarity.rank));
  const cards = order.map((i) => pack.cards[i]!);
  const rarities = order.map((i) => drawnRarities[i]!);
  const best = rarities.reduce<RarityStyle>((top, rarity) => (rarity.rank > top.rank ? rarity : top), rarities[0] ?? DEFAULT_RARITY);
  const t = style.timing;
  const k = 1 / Math.max(0.05, t.speed);
  return {
    style,
    pack,
    cards,
    rarities,
    best,
    seed: hashString(pack.id),
    d: {
      intro: t.introS * k,
      idleBeforeAutoTear: 0.7 * k,
      autoTear: t.autoTearS * k,
      tearFinish: t.tearFinishS * k,
      springBack: 0.3 * k,
      open: t.openS * k,
      present: t.presentS * k,
      flip: t.flipS * k,
      dismiss: t.dismissS * k,
      nextDelay: t.nextDelayS * k,
      autoAdvance: t.autoAdvanceS,
      autoplayHold: t.autoplayHoldS * k,
      summary: t.summaryS * k,
      focus: 0.35 * k,
      dragSpring: 0.35,
    },
  };
}
