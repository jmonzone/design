import type { PackCard } from "../content/types";
import type { RarityStyle } from "../style/types";
import type { RipRecord } from "./record";
import type { ResolvedRip } from "./resolve";
import { openedAtOf, tearProgressAt } from "./tear";
import { cardTimesOf, summaryEndOf } from "./times";

interface CardEventFields {
  /** The card's place in the reveal order. */
  readonly index: number;
  readonly card: PackCard;
  readonly rarity: RarityStyle;
}

/** A beat of the rip, for a host to play a sound or haptic on, or count, or log. */
export type RipEvent =
  | { readonly type: "ready" }
  | { readonly type: "nudge" }
  | { readonly type: "tear-start" }
  | { readonly type: "tear-progress"; readonly progress: number }
  | { readonly type: "tear-cancel" }
  | { readonly type: "open"; readonly best: RarityStyle }
  | ({ readonly type: "card-present" } & CardEventFields)
  | ({ readonly type: "card-anticipate"; readonly duration: number } & CardEventFields)
  | ({ readonly type: "card-reveal" } & CardEventFields)
  | ({ readonly type: "card-dismiss" } & CardEventFields)
  | { readonly type: "summary" }
  | { readonly type: "complete" }
  | ({ readonly type: "card-focus" } & CardEventFields)
  | ({ readonly type: "card-unfocus" } & CardEventFields);

export type RipEventType = RipEvent["type"];

export interface TimedEvent {
  readonly at: number;
  readonly event: RipEvent;
}

/** Tear progress is reported each time it passes another tenth. */
const TEAR_TICKS = 10;
const TICK_SAMPLE_S = 1 / 60;

/** Every beat the record holds so far, in time order. The opener fires each as its clock passes it. */
export function eventsOf(rip: ResolvedRip, record: RipRecord): TimedEvent[] {
  const events: TimedEvent[] = [{ at: rip.d.intro, event: { type: "ready" } }];
  for (const at of record.nudges) events.push({ at, event: { type: "nudge" } });

  for (const attempt of record.tears) {
    events.push({ at: attempt.startedAt, event: { type: "tear-start" } });
    const end =
      attempt.releasedAt !== undefined
        ? attempt.releasedAt + (attempt.committed ? attempt.settleS : 0)
        : (attempt.samples[attempt.samples.length - 1]?.t ?? attempt.startedAt);
    let tick = 0;
    for (let t = attempt.startedAt; t <= end + 1e-9; t += TICK_SAMPLE_S) {
      const reached = Math.floor(tearProgressAt(record, Math.min(t, end)) * TEAR_TICKS + 1e-6);
      while (tick < Math.min(reached, TEAR_TICKS - 1)) {
        tick++;
        events.push({ at: Math.min(t, end), event: { type: "tear-progress", progress: tick / TEAR_TICKS } });
      }
    }
    if (attempt.releasedAt !== undefined && !attempt.committed) {
      events.push({ at: attempt.releasedAt, event: { type: "tear-cancel" } });
    }
  }

  const openedAt = openedAtOf(record);
  if (openedAt !== undefined) events.push({ at: openedAt, event: { type: "open", best: rip.best } });

  rip.cards.forEach((card, index) => {
    const times = cardTimesOf(rip, record, index);
    if (!times) return;
    const fields = { index, card, rarity: rip.rarities[index]! };
    events.push({ at: times.presentAt, event: { type: "card-present", ...fields } });
    if (times.anticipationEnd > times.presentEnd) {
      const duration = times.anticipationEnd - times.presentEnd;
      events.push({ at: times.presentEnd, event: { type: "card-anticipate", duration, ...fields } });
    }
    events.push({ at: times.revealAt, event: { type: "card-reveal", ...fields } });
    if (times.dismissAt !== undefined) events.push({ at: times.dismissAt, event: { type: "card-dismiss", ...fields } });
  });

  if (record.summaryAt !== undefined) {
    events.push({ at: record.summaryAt, event: { type: "summary" } });
    events.push({ at: summaryEndOf(rip, record)!, event: { type: "complete" } });
  }
  for (const focus of record.focuses) {
    const fields = { index: focus.index, card: rip.cards[focus.index]!, rarity: rip.rarities[focus.index]! };
    events.push({ at: focus.at, event: { type: "card-focus", ...fields } });
    if (focus.releasedAt !== undefined) events.push({ at: focus.releasedAt, event: { type: "card-unfocus", ...fields } });
  }

  return events.sort((a, b) => a.at - b.at);
}
