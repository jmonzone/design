import { easingOf } from "../defs/easings";
import { clamp01, lerp } from "../math/scalar";
import type { RipRecord, TearAttempt, TearSample } from "./record";

/** The latest tear attempt begun by `t`. */
export function tearAttemptAt(record: RipRecord, t: number): TearAttempt | undefined {
  for (let i = record.tears.length - 1; i >= 0; i--) if (record.tears[i]!.startedAt <= t) return record.tears[i];
  return undefined;
}

/** When the tear finished and the pack opened, if it has. */
export function openedAtOf(record: RipRecord): number | undefined {
  const attempt = record.tears.find((a) => a.committed && a.releasedAt !== undefined);
  return attempt ? attempt.releasedAt! + attempt.settleS : undefined;
}

/** How far across the pack is torn at `t`, 0–1: following the finger while it's down, then finishing (committed)
 * or springing back shut. */
export function tearProgressAt(record: RipRecord, t: number): number {
  const attempt = tearAttemptAt(record, t);
  if (!attempt) return 0;
  if (attempt.releasedAt === undefined || t < attempt.releasedAt) return sampleProgress(attempt.samples, t);
  const k = attempt.settleS <= 0 ? 1 : clamp01((t - attempt.releasedAt) / attempt.settleS);
  if (attempt.committed) {
    const ease = easingOf(attempt.releaseFrom > 0 ? "easeOutCubic" : "easeInOutCubic");
    return lerp(attempt.releaseFrom, 1, ease(k));
  }
  return attempt.releaseFrom * (1 - easingOf("easeOutCubic")(k));
}

export function tearFromRightAt(record: RipRecord, t: number): boolean {
  return tearAttemptAt(record, t)?.fromRight ?? false;
}

function sampleProgress(samples: readonly TearSample[], t: number): number {
  let before: TearSample | undefined;
  for (const sample of samples) {
    if (sample.t > t) {
      if (!before) return 0;
      const span = sample.t - before.t;
      return span <= 0 ? sample.p : lerp(before.p, sample.p, (t - before.t) / span);
    }
    before = sample;
  }
  return before?.p ?? 0;
}
