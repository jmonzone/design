import { describe, expect, it } from "vitest";
import { DEFAULT_RIP_STYLE, drawPack, seededRandom, type PackCard, type PackContents, type RipPhase } from "../../src/pack-opener";
import { createParticleBuffers, writeParticles } from "../../src/pack-opener/pose/particles";
import { layoutOf, NO_INSETS } from "../../src/pack-opener/pose/layout";
import { poseAt } from "../../src/pack-opener/pose";
import { autoplayRecord, recordDuration } from "../../src/pack-opener/timeline/autoplay";
import { eventsOf } from "../../src/pack-opener/timeline/events";
import { emptyRecord } from "../../src/pack-opener/timeline/record";
import { resolveRip } from "../../src/pack-opener/timeline/resolve";
import { snapshotAt } from "../../src/pack-opener/timeline/snapshot";
import { tearProgressAt } from "../../src/pack-opener/timeline/tear";

const POOL: PackCard[] = ["common", "common", "common", "uncommon", "uncommon", "rare", "epic", "legendary"].map((rarityId, i) => ({
  id: `card-${i}`,
  name: `Card ${i}`,
  rarityId,
  value: i,
}));

const PACK: PackContents = {
  id: "test-pack",
  name: "Test",
  cards: [POOL[7]!, POOL[0]!, POOL[5]!, POOL[1]!, POOL[3]!],
};

const viewport = { width: 390, height: 844, insets: NO_INSETS };

describe("drawPack", () => {
  it("fills every slot from the rarities it can", () => {
    const pack = drawPack(POOL, [
      { count: 3, weights: { common: 1 } },
      { count: 1, weights: { mythic: 5, rare: 1 } },
    ], seededRandom(1));
    expect(pack.map((card) => card.rarityId)).toEqual(["common", "common", "common", "rare"]);
    expect(new Set(pack.map((card) => card.id)).size).toBe(4);
  });

  it("is repeatable with a seed", () => {
    const slots = [{ count: 5, weights: { common: 3, uncommon: 2, rare: 1 } }];
    expect(drawPack(POOL, slots, seededRandom(42))).toEqual(drawPack(POOL, slots, seededRandom(42)));
  });
});

describe("resolveRip", () => {
  it("reveals the best card last by default", () => {
    const rip = resolveRip(PACK, DEFAULT_RIP_STYLE);
    expect(rip.rarities.map((r) => r.rank)).toEqual([0, 0, 1, 2, 4]);
    expect(rip.best.label).toBe("Legendary");
  });
});

describe("autoplay", () => {
  const rip = resolveRip(PACK, DEFAULT_RIP_STYLE);
  const record = autoplayRecord(rip);
  const duration = recordDuration(rip, record);

  it("goes through every phase in order", () => {
    const order: RipPhase[] = ["intro", "ready", "tearing", "opening", "revealing", "summary"];
    const seen: RipPhase[] = [];
    for (let t = 0; t <= duration; t += 1 / 60) {
      const phase = snapshotAt(rip, record, t).phase;
      if (seen[seen.length - 1] !== phase) seen.push(phase);
    }
    expect(seen).toEqual(order);
    expect(snapshotAt(rip, record, duration).complete).toBe(true);
  });

  it("reveals every card once, in order, then completes", () => {
    const events = eventsOf(rip, record);
    const reveals = events.filter((e) => e.event.type === "card-reveal").map((e) => (e.event as { index: number }).index);
    expect(reveals).toEqual([0, 1, 2, 3, 4]);
    expect(events[events.length - 1]!.event.type).toBe("complete");
    const ticks = events.filter((e) => e.event.type === "tear-progress");
    expect(ticks.length).toBe(9);
  });

  it("only builds up for the rarer cards", () => {
    const anticipated = eventsOf(rip, record)
      .filter((e) => e.event.type === "card-anticipate")
      .map((e) => (e.event as { index: number }).index);
    expect(anticipated).toEqual([3, 4]);
  });

  it("poses every frame without NaNs, and spends its particles", () => {
    const layout = layoutOf(DEFAULT_RIP_STYLE, rip.cards.length, viewport);
    const buffers = createParticleBuffers(2400);
    let peak = 0;
    for (let t = 0; t <= duration; t += 1 / 30) {
      const pose = poseAt(rip, record, layout, t);
      const numbers = [pose.pack.x, pose.pack.y, pose.pack.rotZ, pose.shakeX, pose.flash, pose.glow];
      for (const card of pose.cards) numbers.push(card.x, card.y, card.z, card.rotY, card.scale, card.opacity, card.glow);
      expect(numbers.every(Number.isFinite), `t=${t.toFixed(2)}`).toBe(true);
      peak = Math.max(peak, writeParticles(rip, record, layout, t, "#ffffff", buffers));
      expect(Array.from(buffers.positions.slice(0, 30)).every(Number.isFinite)).toBe(true);
    }
    expect(peak).toBeGreaterThan(100);
  });

  it("lays every card out in the summary", () => {
    const layout = layoutOf(DEFAULT_RIP_STYLE, rip.cards.length, viewport);
    const pose = poseAt(rip, record, layout, duration);
    expect(pose.cards.every((card) => card.visible && card.opacity > 0.99)).toBe(true);
    for (const card of pose.cards) {
      expect(Math.abs(card.x) * 2).toBeLessThan(layout.viewW);
      expect(Math.abs(card.rotY)).toBeLessThan(0.01);
    }
  });
});

describe("tearing", () => {
  const rip = resolveRip(PACK, DEFAULT_RIP_STYLE);

  it("follows a swipe, then finishes once let go past the commit point", () => {
    const record = emptyRecord(PACK.cards.length);
    record.tears.push({
      startedAt: 2,
      fromRight: false,
      samples: [
        { t: 2, p: 0 },
        { t: 2.2, p: 0.3 },
        { t: 2.4, p: 0.6 },
      ],
      releasedAt: 2.4,
      releaseFrom: 0.6,
      settleS: 0.12,
      committed: true,
    });
    expect(tearProgressAt(record, 2.1)).toBeCloseTo(0.15);
    expect(tearProgressAt(record, 2.4)).toBeCloseTo(0.6);
    expect(tearProgressAt(record, 2.52)).toBeCloseTo(1);
    expect(snapshotAt(rip, record, 2.3).phase).toBe("tearing");
    expect(snapshotAt(rip, record, 2.6).phase).toBe("opening");
  });

  it("springs back shut short of it", () => {
    const record = emptyRecord(PACK.cards.length);
    record.tears.push({
      startedAt: 2,
      fromRight: true,
      samples: [{ t: 2, p: 0.2 }],
      releasedAt: 2.2,
      releaseFrom: 0.2,
      settleS: 0.3,
      committed: false,
    });
    expect(tearProgressAt(record, 2.6)).toBe(0);
    expect(snapshotAt(rip, record, 2.6).phase).toBe("ready");
    expect(eventsOf(rip, record).some((e) => e.event.type === "tear-cancel")).toBe(true);
  });
});
