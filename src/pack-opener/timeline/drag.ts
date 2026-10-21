import { easingOf } from "../defs/easings";
import { clamp01, lerp } from "../math/scalar";
import { ZERO2, type Vec2 } from "../math/vec";
import type { CardRecord, DragSample } from "./record";

/** How far a card is pulled from where it rests at `t`: following the finger, then springing back when let go
 * (or held where it was let go, if that sent it away). */
export function dragOffsetAt(card: CardRecord, t: number, springS: number): Vec2 {
  let drag = undefined;
  for (let i = card.drags.length - 1; i >= 0; i--) {
    if (card.drags[i]!.startedAt <= t) {
      drag = card.drags[i]!;
      break;
    }
  }
  if (!drag) return ZERO2;
  if (drag.releasedAt === undefined || t < drag.releasedAt) return sampleOffset(drag.samples, t);
  const from = sampleOffset(drag.samples, drag.releasedAt);
  if (card.dismissAt !== undefined && card.dismissAt <= drag.releasedAt + 1e-6) return from;
  const k = springS <= 0 ? 1 : clamp01((t - drag.releasedAt) / springS);
  const back = 1 - easingOf("easeOutBack")(k);
  return { x: from.x * back, y: from.y * back };
}

function sampleOffset(samples: readonly DragSample[], t: number): Vec2 {
  let before: DragSample | undefined;
  for (const sample of samples) {
    if (sample.t > t) {
      if (!before) return ZERO2;
      const span = sample.t - before.t;
      const k = span <= 0 ? 1 : (t - before.t) / span;
      return { x: lerp(before.x, sample.x, k), y: lerp(before.y, sample.y, k) };
    }
    before = sample;
  }
  return before ? { x: before.x, y: before.y } : ZERO2;
}
