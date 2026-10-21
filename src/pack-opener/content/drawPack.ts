import type { PackCard } from "./types";

/** A run of cards in a pack that share odds, e.g. "4 cards, mostly commons" then "1 card, rare or better". */
export interface PackSlot {
  readonly count: number;
  /** Relative odds of each rarity (by rarity id) for every card in the slot. */
  readonly weights: Readonly<Record<string, number>>;
}

/**
 * A pack drawn from `pool`, slot by slot: each card's rarity by its slot's weights (only rarities the pool has),
 * then a card of that rarity not yet in the pack (a repeat only once the rarity runs out). Pass a seeded
 * `random` for a repeatable pack. In a real product the server draws; this is for previews and demos.
 */
export function drawPack(pool: readonly PackCard[], slots: readonly PackSlot[], random: () => number = Math.random): PackCard[] {
  const byRarity = new Map<string, PackCard[]>();
  for (const card of pool) {
    const list = byRarity.get(card.rarityId);
    if (list) list.push(card);
    else byRarity.set(card.rarityId, [card]);
  }

  const used = new Set<string>();
  const drawn: PackCard[] = [];
  for (const slot of slots) {
    for (let n = 0; n < slot.count; n++) {
      const options = Object.entries(slot.weights).filter(([id, weight]) => weight > 0 && byRarity.has(id));
      if (options.length === 0) continue;
      const cards = byRarity.get(pickWeighted(options, random))!;
      const fresh = cards.filter((card) => !used.has(card.id));
      const from = fresh.length > 0 ? fresh : cards;
      const card = from[Math.floor(random() * from.length)]!;
      used.add(card.id);
      drawn.push(card);
    }
  }
  return drawn;
}

function pickWeighted(options: readonly (readonly [string, number])[], random: () => number): string {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [id, weight] of options) {
    roll -= weight;
    if (roll < 0) return id;
  }
  return options[options.length - 1]![0];
}
