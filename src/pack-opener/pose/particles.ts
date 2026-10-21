import { hexToLinear, type Rgb } from "../math/color";
import { hash01 } from "../math/random";
import type { RipRecord } from "../timeline/record";
import type { ResolvedRip } from "../timeline/resolve";
import { openedAtOf, tearProgressAt } from "../timeline/tear";
import { cardTimesOf } from "../timeline/times";
import { tearLineY, type Layout } from "./layout";
import { packPoseAt } from "./pack";

/** Where every live particle is this frame, filled by writeParticles. Colors are linear RGB, sizes world units. */
export interface ParticleBuffers {
  readonly capacity: number;
  readonly positions: Float32Array;
  readonly colors: Float32Array;
  readonly sizes: Float32Array;
  readonly alphas: Float32Array;
}

export function createParticleBuffers(capacity: number): ParticleBuffers {
  return {
    capacity,
    positions: new Float32Array(capacity * 3),
    colors: new Float32Array(capacity * 3),
    sizes: new Float32Array(capacity),
    alphas: new Float32Array(capacity),
  };
}

const WHITE: Rgb = [1, 1, 1];

class Writer {
  count = 0;
  constructor(private readonly out: ParticleBuffers) {}

  get full(): boolean {
    return this.count >= this.out.capacity;
  }

  push(x: number, y: number, z: number, color: Rgb, whiten: number, size: number, alpha: number): void {
    if (this.full || alpha <= 0.003) return;
    const i = this.count++;
    const { positions, colors, sizes, alphas } = this.out;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 3] = color[0] + (WHITE[0] - color[0]) * whiten;
    colors[i * 3 + 1] = color[1] + (WHITE[1] - color[1]) * whiten;
    colors[i * 3 + 2] = color[2] + (WHITE[2] - color[2]) * whiten;
    sizes[i] = size;
    alphas[i] = alpha;
  }
}

/** Damped travel: how far something launched at speed 1 has gone after `age`, slowing with `drag`. */
function damped(age: number, drag: number): number {
  return (1 - Math.exp(-drag * age)) / drag;
}

/**
 * Every particle alive at `t`, written into `out`; returns how many. Like the poses, each particle is a pure
 * function of the record and the time (seeded by its emitter and number), so scrubbing and replays show exactly
 * the same sparks. The reveal bursts go first so they're never the ones dropped when the buffer is full.
 */
export function writeParticles(
  rip: ResolvedRip,
  record: RipRecord,
  layout: Layout,
  t: number,
  teaseColor: string,
  out: ParticleBuffers,
): number {
  const writer = new Writer(out);
  const { style } = rip;
  const amount = style.effects.particles;
  if (amount <= 0) return 0;
  const tease = hexToLinear(teaseColor);

  // Each card's burst as it turns face up.
  rip.cards.forEach((_, i) => {
    const times = cardTimesOf(rip, record, i);
    if (!times || t < times.revealAt) return;
    const age = t - times.revealAt;
    if (age > 2) return;
    const rarity = rip.rarities[i]!;
    const color = hexToLinear(rarity.color);
    const count = Math.round(rarity.particles * amount);
    const seed = rip.seed + 1000 + i * 977;
    const power = 0.75 + 0.08 * rarity.rank;
    for (let k = 0; k < count && !writer.full; k++) {
      const r = (j: number) => hash01(seed + k, j);
      const life = 0.9 + r(4) * 1.0;
      if (age > life) continue;
      const angle = r(1) * Math.PI * 2;
      const ring = rarity.rays > 0.5 && k % 3 === 0;
      const speed = (ring ? 3.4 : 1.2 + r(2) * 3.8) * power;
      const travel = damped(age, ring ? 2.6 : 1.8);
      const twinkle = 0.65 + 0.35 * Math.sin(age * 24 + k);
      writer.push(
        Math.cos(angle) * speed * travel,
        Math.sin(angle) * speed * travel - 0.6 * age * age,
        0.15 + (r(3) - 0.3) * 1.5 * travel,
        color,
        r(6) * 0.55,
        0.014 + r(5) * 0.05,
        (1 - age / life) * twinkle,
      );
    }
  });

  // Sparks crawling off the card's edges during its build-up.
  rip.cards.forEach((_, i) => {
    const times = cardTimesOf(rip, record, i);
    if (!times || times.anticipationEnd <= times.presentEnd || t < times.presentEnd) return;
    const rarity = rip.rarities[i]!;
    const color = hexToLinear(rarity.color);
    const rate = (20 + rarity.particles * 0.15) * amount;
    const life = 0.8;
    const seed = rip.seed + 5000 + i * 613;
    const first = Math.max(0, Math.ceil((t - life - times.presentEnd) * rate));
    const last = Math.floor((Math.min(t, times.anticipationEnd) - times.presentEnd) * rate);
    for (let k = first; k <= last && !writer.full; k++) {
      const born = times.presentEnd + k / rate;
      const age = t - born;
      if (age < 0 || age > life) continue;
      const r = (j: number) => hash01(seed + k, j);
      const onSide = r(1) < 0.5;
      const sign = r(2) < 0.5 ? -1 : 1;
      const along = r(3) - 0.5;
      const x0 = onSide ? (sign * layout.unitW) / 2 : along * layout.unitW;
      const y0 = onSide ? along * layout.unitH : (sign * layout.unitH) / 2;
      writer.push(
        x0 + (onSide ? sign * 0.25 : (r(4) - 0.5) * 0.2) * age,
        y0 + (onSide ? 0 : sign * 0.25) * age + 0.35 * age,
        0.05,
        color,
        r(5) * 0.4,
        0.012 + r(6) * 0.02,
        1 - age / life,
      );
    }
  });

  const tearY = tearLineY(style, layout);

  // A puff of light out of the top as it opens.
  const openedAt = openedAtOf(record);
  if (openedAt !== undefined && t >= openedAt && t - openedAt < 1.3) {
    const age = t - openedAt;
    const pack = packPoseAt(rip, record, layout, openedAt);
    const count = Math.round(80 * amount * Math.max(0.3, style.tear.leak));
    const seed = rip.seed + 9000;
    for (let k = 0; k < count && !writer.full; k++) {
      const r = (j: number) => hash01(seed + k, j);
      const life = 0.6 + r(4) * 0.7;
      if (age > life) continue;
      const angle = (r(1) - 0.5) * 2.2;
      const speed = 1.5 + r(2) * 3;
      const travel = damped(age, 2.5);
      writer.push(
        pack.x + (r(3) - 0.5) * layout.packW * pack.scale * 0.9 + Math.sin(angle) * speed * travel,
        pack.y + tearY * pack.scale + Math.cos(angle) * speed * travel - 1.2 * age * age,
        0.1 + r(6) * 0.4 * travel,
        tease,
        r(5) * 0.6,
        0.018 + r(7) * 0.035,
        1 - age / life,
      );
    }
  }

  // Sparks thrown off the tear as it runs.
  const sparks = style.tear.sparks * amount;
  if (sparks > 0) {
    record.tears.forEach((attempt, a) => {
      const rate = 90 * sparks;
      const life = 0.7;
      const end = attempt.releasedAt !== undefined ? attempt.releasedAt + attempt.settleS : t;
      const first = Math.max(1, Math.ceil((t - life - attempt.startedAt) * rate));
      const last = Math.floor((Math.min(t, end) - attempt.startedAt) * rate);
      const seed = rip.seed + 20000 + a * 1543;
      const dir = attempt.fromRight ? -1 : 1;
      for (let k = first; k <= last && !writer.full; k++) {
        const born = attempt.startedAt + k / rate;
        const age = t - born;
        if (age < 0 || age > life) continue;
        const p = tearProgressAt(record, born);
        if (p >= 1 || p - tearProgressAt(record, born - 1 / rate) < 0.0015) continue;
        const pack = packPoseAt(rip, record, layout, born);
        const r = (j: number) => hash01(seed + k, j);
        const localX = (attempt.fromRight ? 0.5 - p : p - 0.5) * layout.packW;
        writer.push(
          pack.x + localX * pack.scale + ((r(1) - 0.5) * 1.4 + dir * 0.5) * age,
          pack.y + tearY * pack.scale + (0.6 + r(2) * 1.8) * age - 2.5 * age * age,
          pack.z + 0.08 + (0.3 + r(3) * 0.9) * age,
          tease,
          0.3 + r(4) * 0.7,
          (0.012 + r(5) * 0.022) * pack.scale,
          1 - age / life,
        );
      }
    });
  }

  return writer.count;
}
