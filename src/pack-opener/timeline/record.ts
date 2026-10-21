import type { Vec2 } from "../math/vec";

/**
 * Everything that has happened in a rip, as timestamps on the opener's clock (seconds from the pack appearing).
 * Every frame is drawn from this alone (timeline/ and pose/ are pure functions of it and the time), which is
 * what lets one rip be played live, generated for autoplay, scrubbed back and forth, or replayed exactly.
 * Inputs only ever append to it.
 */
export interface RipRecord {
  readonly tears: TearAttempt[];
  /** Taps on a pack that wants a swipe: it wiggles to say so. */
  readonly nudges: number[];
  readonly cards: CardRecord[];
  /** When the pull started gathering into the summary. */
  summaryAt?: number;
  /** Each time a card was brought up close in the summary. */
  readonly focuses: FocusRecord[];
}

export interface TearSample {
  readonly t: number;
  /** How far across the tear had got, 0–1. */
  readonly p: number;
}

/** One go at tearing the pack: a swipe (its progress sampled as the finger moved) or a tap. */
export interface TearAttempt {
  readonly startedAt: number;
  /** Torn from the right edge leftward. */
  readonly fromRight: boolean;
  readonly samples: TearSample[];
  /** When the finger lifted (a tap releases as it starts). From then the tear settles: finishing if committed,
   * else springing back shut. */
  releasedAt?: number;
  releaseFrom: number;
  settleS: number;
  committed: boolean;
}

export interface DragSample {
  readonly t: number;
  /** How far the card has been dragged, in world units (y up). */
  readonly x: number;
  readonly y: number;
}

export interface CardDrag {
  readonly startedAt: number;
  readonly samples: DragSample[];
  releasedAt?: number;
}

export interface CardRecord {
  /** When it started lifting off the stack. */
  presentAt?: number;
  readonly drags: CardDrag[];
  /** When it was sent away, and which way (screen space, y up). */
  dismissAt?: number;
  dismissDir?: Vec2;
}

export interface FocusRecord {
  readonly index: number;
  readonly at: number;
  releasedAt?: number;
}

export function emptyRecord(cardCount: number): RipRecord {
  return {
    tears: [],
    nudges: [],
    cards: Array.from({ length: cardCount }, () => ({ drags: [] })),
    focuses: [],
  };
}

/** A deep copy, e.g. to replay a rip while the live one goes on. */
export function cloneRecord(record: RipRecord): RipRecord {
  return structuredClone(record);
}
