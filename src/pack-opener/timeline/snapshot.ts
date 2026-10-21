import type { RipRecord } from "./record";
import type { ResolvedRip } from "./resolve";
import { tearAttemptAt, openedAtOf } from "./tear";
import { cardTimesOf, currentCardAt, summaryEndOf } from "./times";

/** Where a rip is: the pack dropping in, waiting to be torn, tearing, opening, revealing cards, the summary. */
export type RipPhase = "intro" | "ready" | "tearing" | "opening" | "revealing" | "summary";

/** What a host's own UI needs to follow the rip (its prompts, buttons, counters). Changes only between beats,
 * not every frame. */
export interface RipSnapshot {
  readonly phase: RipPhase;
  /** The card being revealed, or -1. */
  readonly cardIndex: number;
  /** That card is face up and waiting: a tap or swipe now moves on. */
  readonly cardRevealed: boolean;
  /** How many cards have been turned face up. */
  readonly revealedCount: number;
  /** The card brought up close in the summary, or -1. */
  readonly focusIndex: number;
  /** The summary has settled. */
  readonly complete: boolean;
}

export function snapshotAt(rip: ResolvedRip, record: RipRecord, t: number): RipSnapshot {
  let revealedCount = 0;
  for (let i = 0; i < rip.cards.length; i++) {
    const times = cardTimesOf(rip, record, i);
    if (times && t >= times.revealAt) revealedCount++;
  }
  const blank = { cardIndex: -1, cardRevealed: false, revealedCount, focusIndex: -1, complete: false };

  if (record.summaryAt !== undefined && t >= record.summaryAt) {
    const focus = record.focuses.findLast((f) => f.at <= t && (f.releasedAt === undefined || f.releasedAt > t));
    return {
      ...blank,
      phase: "summary",
      revealedCount: rip.cards.length,
      focusIndex: focus?.index ?? -1,
      complete: t >= (summaryEndOf(rip, record) ?? Infinity),
    };
  }

  const openedAt = openedAtOf(record);
  if (openedAt !== undefined && t >= openedAt) {
    const current = currentCardAt(record, t);
    if (current < 0) return { ...blank, phase: "opening" };
    const times = cardTimesOf(rip, record, current)!;
    const waiting = t >= times.revealAt && (times.dismissAt === undefined || t < times.dismissAt);
    return { ...blank, phase: "revealing", cardIndex: current, cardRevealed: waiting };
  }

  if (t < rip.d.intro) return { ...blank, phase: "intro" };
  const attempt = tearAttemptAt(record, t);
  const tearing =
    attempt !== undefined &&
    (attempt.committed || attempt.releasedAt === undefined || t < attempt.releasedAt + attempt.settleS);
  return { ...blank, phase: tearing ? "tearing" : "ready" };
}

export function sameSnapshot(a: RipSnapshot, b: RipSnapshot): boolean {
  return (
    a.phase === b.phase &&
    a.cardIndex === b.cardIndex &&
    a.cardRevealed === b.cardRevealed &&
    a.revealedCount === b.revealedCount &&
    a.focusIndex === b.focusIndex &&
    a.complete === b.complete
  );
}
