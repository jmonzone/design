import { DISMISS_DIRECTIONS } from "../defs/dismissDirections";
import { easingOf } from "../defs/easings";
import { hash01 } from "../math/random";
import { lerp, smoothstep, spanProgress } from "../math/scalar";
import { normalize2 } from "../math/vec";
import { dragOffsetAt } from "../timeline/drag";
import type { RipRecord } from "../timeline/record";
import type { ResolvedRip } from "../timeline/resolve";
import { openedAtOf } from "../timeline/tear";
import { cardTimesOf, presentedCountAt, summaryStartOf } from "../timeline/times";
import type { Layout } from "./layout";
import { packPoseAt } from "./pack";
import { lerpPlacement, type CardPose, type Placement } from "./types";

/** The waiting stack sits behind where a revealed card is shown. */
const STACK_Z = -0.5;
const STACK_SCALE = 0.94;

const HIDDEN: CardPose = {
  x: 0,
  y: 0,
  z: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
  visible: false,
  opacity: 0,
  dim: 0,
  glow: 0,
  rays: 0,
  flare: 0,
  tiltWeight: 0,
  front: false,
};

interface CardPoseOptions {
  /** The pose as if it hadn't been sent away (where its exit starts from). */
  readonly ignoreDismiss?: boolean;
  /** The pose as if the summary hadn't begun (where its move into the summary starts from). */
  readonly ignoreSummary?: boolean;
}

/**
 * Card `index` at `t`: hidden in the pack, rising out with the stack, waiting its turn, lifting into view
 * (face down), building up to its rarity, turning over with a pop, floating while it's shown (and following a
 * drag), flying away, and finally settling into its summary slot (or up close when inspected).
 */
export function cardPoseAt(
  rip: ResolvedRip,
  record: RipRecord,
  layout: Layout,
  t: number,
  index: number,
  options: CardPoseOptions = {},
): CardPose {
  const openedAt = openedAtOf(record);
  if (openedAt === undefined || t < openedAt) return HIDDEN;
  const { style, d } = rip;
  const fx = style.effects;
  const rarity = rip.rarities[index]!;
  const faceDown = style.reveal.flip ? Math.PI : 0;
  const spread = style.reveal.stackSpread;
  const jitter = (k: number) => hash01(rip.seed + index * 31, k) - 0.5;

  // Waiting in the stack, the next card on top.
  const depth = Math.max(0, index - presentedCountAt(rip, record, t));
  let place: Placement = {
    x: jitter(1) * 0.08 * spread,
    y: jitter(2) * 0.05 * spread - depth * 0.012,
    z: STACK_Z - depth * 0.035,
    rotX: 0,
    rotY: faceDown,
    rotZ: jitter(3) * 0.14 * spread,
    scale: STACK_SCALE,
  };
  let glow = 0;
  let rays = 0;
  let flare = 0;
  let opacity = 1;
  let dim = 0;
  let tiltWeight = 0;
  let front = false;

  // Rising out of the opened pack in an arc, then settling into the stack.
  const emerge = spanProgress(t, openedAt + d.open * 0.12, d.open * 0.75);
  if (emerge < 1) {
    const k = easingOf("easeOutCubic")(emerge);
    const pack = packPoseAt(rip, record, layout, openedAt);
    const startY = pack.y - layout.packH * layout.packScale * 0.08;
    place = {
      ...place,
      y: lerp(startY, place.y, k) + Math.sin(k * Math.PI) * layout.unitH * 0.3,
      z: lerp(-depth * 0.004, place.z, k),
      rotZ: place.rotZ * k,
      scale: lerp(layout.packScale * STACK_SCALE, place.scale, k),
    };
  }

  const times = cardTimesOf(rip, record, index);
  if (times) {
    // Lifting off the stack into view.
    const lift = easingOf(style.timing.presentEase)(spanProgress(t, times.presentAt, d.present));
    place = lerpPlacement(place, { x: 0, y: 0, z: 0, rotX: 0, rotY: faceDown, rotZ: 0, scale: 1 }, lift);
    tiltWeight = lift;

    // The build-up: light seeping out from behind, a tremble that grows.
    if (t >= times.presentEnd && t < times.anticipationEnd) {
      const a = spanProgress(t, times.presentEnd, times.anticipationEnd - times.presentEnd);
      const amp = rarity.shake * fx.shake * (0.3 + 0.7 * a);
      place = {
        ...place,
        x: place.x + Math.sin(t * 61) * 0.012 * amp,
        y: place.y + Math.sin(t * 47 + 1) * 0.01 * amp + a * 0.03,
        rotZ: place.rotZ + (Math.sin(t * 53) + Math.sin(t * 31.7)) * 0.018 * amp,
        scale: place.scale * (1 + 0.03 * a + 0.012 * Math.sin(t * 15) * a),
      };
      glow = rarity.glow * fx.glow * (0.15 + 0.75 * a);
      rays = rarity.rays * fx.rays * 0.35 * a;
    }

    // Turning over, popping toward the camera at the half-way point.
    if (t >= times.anticipationEnd) {
      const flipDuration = times.revealAt - times.anticipationEnd;
      const raw = spanProgress(t, times.anticipationEnd, flipDuration);
      const turn = easingOf(style.timing.flipEase)(raw);
      const arc = Math.sin(raw * Math.PI);
      place = {
        ...place,
        rotY: faceDown * (1 - turn),
        z: place.z + arc * 0.3,
        rotX: place.rotX + arc * 0.12,
        scale: place.scale * (1 + arc * 0.06),
      };
      glow = Math.max(glow, rarity.glow * fx.glow * (0.6 + 0.4 * turn));
    }

    // Face up: a burst of glow that settles, rays fanning in, a gentle float.
    if (t >= times.revealAt) {
      const since = t - times.revealAt;
      glow = rarity.glow * fx.glow * (0.7 + 0.9 * Math.exp(-since * 2.6));
      rays = rarity.rays * fx.rays * smoothstep(0, 0.35, since);
      flare = Math.exp(-since * 3.5);
      place = {
        ...place,
        y: place.y + Math.sin(since * 1.4) * 0.015,
        rotX: place.rotX + Math.sin(since * 0.9 + 0.5) * 0.035,
        rotY: place.rotY + Math.sin(since * 0.7) * 0.06,
      };
    }

    // Following a finger.
    const pull = dragOffsetAt(record.cards[index]!, t, d.dragSpring);
    place = {
      ...place,
      x: place.x + pull.x,
      y: place.y + pull.y,
      rotZ: place.rotZ - pull.x * 0.22,
      rotY: place.rotY + pull.x * 0.25,
    };

    // Sent away: flung off-screen, spinning, from wherever it was.
    if (!options.ignoreDismiss && times.dismissAt !== undefined && t >= times.dismissAt) {
      const from = cardPoseAt(rip, record, layout, times.dismissAt, index, { ignoreDismiss: true, ignoreSummary: true });
      const k = easingOf(style.timing.dismissEase)(spanProgress(t, times.dismissAt, d.dismiss));
      const fallback = DISMISS_DIRECTIONS.of(style.reveal.dismissDirection).dir;
      const dir = normalize2(record.cards[index]!.dismissDir ?? fallback, fallback);
      const distance = Math.hypot(layout.viewW, layout.viewH) * 0.7 + layout.unitH;
      place = {
        x: from.x + dir.x * distance * k,
        y: from.y + dir.y * distance * k,
        z: from.z + 0.2 * k,
        rotX: from.rotX - dir.y * 0.5 * k,
        rotY: from.rotY + dir.x * 0.7 * k,
        rotZ: from.rotZ - dir.x * 0.9 * k,
        scale: from.scale * (1 - 0.1 * k),
      };
      glow = from.glow * (1 - k);
      rays = from.rays * (1 - k);
      flare = 0;
      opacity = 1 - smoothstep(0.75, 1, k);
      tiltWeight = from.tiltWeight * (1 - k);
    }
  }

  // Gathering into the summary: every card, the ones already flown away coming back in.
  const summaryStart = summaryStartOf(rip, record, index);
  if (!options.ignoreSummary && summaryStart !== undefined && t >= summaryStart) {
    const from = cardPoseAt(rip, record, layout, summaryStart, index, { ignoreSummary: true });
    const raw = spanProgress(t, summaryStart, d.summary);
    const k = easingOf(style.timing.summaryEase)(raw);
    const slot = layout.slots[index] ?? { x: 0, y: 0, z: 0, scale: 1, rotZ: 0 };
    place = lerpPlacement(from, { x: slot.x, y: slot.y, z: slot.z, rotX: 0, rotY: 0, rotZ: slot.rotZ, scale: slot.scale }, k);
    place = { ...place, z: place.z + Math.sin(raw * Math.PI) * 0.25 };
    if (raw >= 1) place = { ...place, y: place.y + Math.sin(t * 1.3 + index * 1.7) * 0.008 * slot.scale };
    glow = lerp(from.glow, rarity.glow * fx.glow * 0.35, k);
    rays = lerp(from.rays, 0, k);
    flare = from.flare * (1 - k);
    opacity = Math.max(from.visible ? from.opacity : 0, smoothstep(0, 0.35, raw));
    tiltWeight = 0;

    // Brought up close; the rest dim behind it.
    const focus = focusAmountAt(rip, record, index, t);
    if (focus > 0) {
      place = lerpPlacement(place, { x: 0, y: 0, z: 0.15, rotX: 0, rotY: 0, rotZ: 0, scale: 0.97 }, easingOf("easeInOutCubic")(focus));
      glow = lerp(glow, rarity.glow * fx.glow, focus);
      rays = rarity.rays * fx.rays * 0.6 * focus;
      tiltWeight = focus;
      front = true;
    }
    let others = 0;
    for (let i = 0; i < rip.cards.length; i++) if (i !== index) others = Math.max(others, focusAmountAt(rip, record, i, t));
    dim = others * 0.7;
  }

  return { ...place, visible: opacity > 0.002, opacity, dim, glow, rays, flare, tiltWeight, front };
}

/** How far card `index` is brought up close at `t`, 0–1. */
export function focusAmountAt(rip: ResolvedRip, record: RipRecord, index: number, t: number): number {
  let amount = 0;
  for (const focus of record.focuses) {
    if (focus.index !== index) continue;
    const rise = easingOf("easeOutCubic")(spanProgress(t, focus.at, rip.d.focus));
    const fall = easingOf("easeInOutCubic")(spanProgress(t, focus.releasedAt, rip.d.focus));
    amount = Math.max(amount, rise * (1 - fall));
  }
  return amount;
}
