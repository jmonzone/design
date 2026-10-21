import { spanProgress } from "../math/scalar";
import type { RipRecord } from "../timeline/record";
import type { ResolvedRip } from "../timeline/resolve";
import { openedAtOf } from "../timeline/tear";
import { cardTimesOf } from "../timeline/times";
import { cardPoseAt } from "./cards";
import type { Layout } from "./layout";
import { packPoseAt } from "./pack";
import type { Pose } from "./types";

/** One whole frame of a rip at `t`: the pack, every card, and the camera shake, flash and backdrop glow. */
export function poseAt(rip: ResolvedRip, record: RipRecord, layout: Layout, t: number): Pose {
  const pack = packPoseAt(rip, record, layout, t);
  const cards = rip.cards.map((_, i) => cardPoseAt(rip, record, layout, t, i));
  const fx = rip.style.effects;

  let shake = 0;
  let flash = 0;
  let flashIndex = -1;
  // Before the cards are out, the backdrop takes the light leaking from the tear.
  let glow = pack.visible ? pack.leak * 0.3 * pack.opacity : 0;
  let glowIndex = -1;

  const openedAt = openedAtOf(record);
  if (openedAt !== undefined && t >= openedAt) shake += 0.025 * fx.shake * Math.exp(-(t - openedAt) * 7);

  rip.cards.forEach((_, i) => {
    const times = cardTimesOf(rip, record, i);
    if (!times || t < times.presentAt) return;
    const rarity = rip.rarities[i]!;
    if (t >= times.presentEnd && t < times.anticipationEnd) {
      shake += rarity.shake * fx.shake * 0.006 * spanProgress(t, times.presentEnd, times.anticipationEnd - times.presentEnd);
    }
    if (t >= times.revealAt) {
      const since = t - times.revealAt;
      shake += rarity.shake * fx.shake * 0.045 * Math.exp(-since * 6);
      const f = rarity.flash * fx.flash * Math.exp(-since * 5);
      if (f > flash) {
        flash = f;
        flashIndex = i;
      }
    }
    if (times.dismissAt === undefined || t < times.dismissAt) {
      const lit =
        t >= times.revealAt ? 1 : 0.6 * spanProgress(t, times.presentEnd, times.anticipationEnd - times.presentEnd);
      glow = rarity.glow * lit;
      glowIndex = i;
    }
  });
  if (record.summaryAt !== undefined) glow *= 1 - 0.6 * spanProgress(t, record.summaryAt, rip.d.summary);
  glow *= rip.style.scene.ambientGlow;

  return {
    pack,
    cards,
    shakeX: (Math.sin(t * 67) + Math.sin(t * 41.3) * 0.6) * shake,
    shakeY: (Math.sin(t * 59 + 2) + Math.sin(t * 37.1) * 0.5) * shake,
    shakeRoll: Math.sin(t * 71) * shake * 0.4,
    flash,
    flashIndex,
    glow,
    glowIndex,
  };
}

export { cardPoseAt, focusAmountAt } from "./cards";
export { packPoseAt } from "./pack";
export * from "./layout";
export * from "./types";
