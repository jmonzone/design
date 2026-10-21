import { easingOf } from "../defs/easings";
import { spanProgress } from "../math/scalar";
import type { RipRecord } from "./record";
import type { ResolvedRip } from "./resolve";

/** The beats of one card's reveal on the clock. */
export interface CardTimes {
  readonly presentAt: number;
  /** Lifted into view; the build-up starts. */
  readonly presentEnd: number;
  /** The build-up's over; it starts turning. */
  readonly anticipationEnd: number;
  /** Face up: the burst, the flash, the haptic. */
  readonly revealAt: number;
  readonly dismissAt?: number;
}

export function anticipationOf(rip: ResolvedRip, index: number): number {
  return rip.rarities[index]!.anticipationS / Math.max(0.05, rip.style.timing.speed);
}

export function flipDurationOf(rip: ResolvedRip, index: number): number {
  return rip.style.reveal.flip ? rip.d.flip * rip.rarities[index]!.flipSlowdown : 0;
}

/** Card `index`'s times once it's been presented, else undefined. */
export function cardTimesOf(rip: ResolvedRip, record: RipRecord, index: number): CardTimes | undefined {
  const card = record.cards[index];
  if (card?.presentAt === undefined) return undefined;
  const presentEnd = card.presentAt + rip.d.present;
  const anticipationEnd = presentEnd + anticipationOf(rip, index);
  return {
    presentAt: card.presentAt,
    presentEnd,
    anticipationEnd,
    revealAt: anticipationEnd + flipDurationOf(rip, index),
    dismissAt: card.dismissAt,
  };
}

/** Cards set off for the summary one after another, this far apart (seconds at speed 1). */
const SUMMARY_STAGGER_S = 0.045;

/** When card `index` starts moving into the summary, if the summary has begun. */
export function summaryStartOf(rip: ResolvedRip, record: RipRecord, index: number): number | undefined {
  if (record.summaryAt === undefined) return undefined;
  return record.summaryAt + (index * SUMMARY_STAGGER_S) / Math.max(0.05, rip.style.timing.speed);
}

/** When the last card has settled into the summary. */
export function summaryEndOf(rip: ResolvedRip, record: RipRecord): number | undefined {
  const lastStart = summaryStartOf(rip, record, Math.max(0, rip.cards.length - 1));
  return lastStart === undefined ? undefined : lastStart + rip.d.summary;
}

/** How many cards have left the stack by `t`, fractionally while one is lifting off, so the stack below rises
 * smoothly. */
export function presentedCountAt(rip: ResolvedRip, record: RipRecord, t: number): number {
  const ease = easingOf("easeInOutCubic");
  let count = 0;
  for (const card of record.cards) count += ease(spanProgress(t, card.presentAt, rip.d.present));
  return count;
}

/** The card being revealed at `t` (the last one presented), or -1. */
export function currentCardAt(record: RipRecord, t: number): number {
  let current = -1;
  record.cards.forEach((card, i) => {
    if (card.presentAt !== undefined && card.presentAt <= t) current = i;
  });
  return current;
}
