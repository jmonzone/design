import { registry, type Def } from "./registry";

/** The order a pack's cards come out in, given each card's rarity rank (in the order the host drew them). */
export interface RevealOrderDef extends Def {
  readonly order: (ranks: readonly number[]) => number[];
}

function byRank(ranks: readonly number[], direction: 1 | -1): number[] {
  return ranks.map((_, i) => i).sort((a, b) => (ranks[a]! - ranks[b]!) * direction || a - b);
}

export const REVEAL_ORDERS = registry<RevealOrderDef>([
  { id: "best-last", label: "Best last", order: (ranks) => byRank(ranks, 1) },
  { id: "as-drawn", label: "As drawn", order: (ranks) => ranks.map((_, i) => i) },
  { id: "best-first", label: "Best first", order: (ranks) => byRank(ranks, -1) },
]);
