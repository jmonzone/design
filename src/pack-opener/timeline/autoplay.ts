import { DISMISS_DIRECTIONS } from "../defs/dismissDirections";
import { emptyRecord, type RipRecord } from "./record";
import type { ResolvedRip } from "./resolve";
import { anticipationOf, flipDurationOf } from "./times";
import { openedAtOf } from "./tear";

/** A whole rip played without input: a tap-tear after a moment, each card held a while (rarer ones longer), then
 * the summary. Deterministic, so it can be scrubbed. */
export function autoplayRecord(rip: ResolvedRip): RipRecord {
  const record = emptyRecord(rip.cards.length);
  const d = rip.d;
  const tearAt = d.intro + d.idleBeforeAutoTear;
  record.tears.push({
    startedAt: tearAt,
    fromRight: false,
    samples: [],
    releasedAt: tearAt,
    releaseFrom: 0,
    settleS: d.autoTear,
    committed: true,
  });
  let t = tearAt + d.autoTear + d.open;
  const dir = DISMISS_DIRECTIONS.of(rip.style.reveal.dismissDirection).dir;
  rip.cards.forEach((_, i) => {
    const card = record.cards[i]!;
    card.presentAt = t;
    const anticipation = anticipationOf(rip, i);
    const revealAt = t + d.present + anticipation + flipDurationOf(rip, i);
    const leaveAt = revealAt + d.autoplayHold + anticipation * 0.5;
    if (i < rip.cards.length - 1) {
      card.dismissAt = leaveAt;
      card.dismissDir = dir;
      t = leaveAt + d.nextDelay;
    } else {
      record.summaryAt = leaveAt;
    }
  });
  if (rip.cards.length === 0) record.summaryAt = t;
  return record;
}

/** How long a recorded rip runs: until its summary has settled and been shown a moment. */
export function recordDuration(rip: ResolvedRip, record: RipRecord): number {
  if (record.summaryAt !== undefined) {
    const lastFocus = record.focuses.reduce((latest, f) => Math.max(latest, f.releasedAt ?? f.at), 0);
    return Math.max(record.summaryAt + rip.d.summary + 1.6, lastFocus + 1);
  }
  return (openedAtOf(record) ?? rip.d.intro) + rip.d.open + 2;
}
