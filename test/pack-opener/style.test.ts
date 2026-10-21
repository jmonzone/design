import { describe, expect, it } from "vitest";
import {
  allLeversOf,
  decodeStyle,
  DEFAULT_RIP_STYLE,
  encodeStyle,
  getAtPath,
  presetStyle,
  RIP_PRESETS,
  sanitizeStyle,
  setAtPath,
  type LeverDef,
} from "../../src/pack-opener";

function matchesLever(lever: LeverDef, value: unknown): boolean {
  switch (lever.kind) {
    case "number":
      return typeof value === "number" && value >= lever.min && value <= lever.max;
    case "color":
      return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
    case "toggle":
      return typeof value === "boolean";
    case "choice":
      return typeof value === "string" && lever.options.some((option) => option.value === value);
    case "text":
      return typeof value === "string" && value.length <= lever.maxLength;
  }
}

describe("levers", () => {
  it("every lever points at a valid value in the defaults and every preset", () => {
    for (const preset of RIP_PRESETS.all) {
      const style = presetStyle(preset.id);
      for (const lever of allLeversOf(style)) {
        expect(matchesLever(lever, getAtPath(style, lever.path)), `${preset.id}: ${lever.path}`).toBe(true);
      }
    }
  });

  it("lever paths are unique", () => {
    const paths = allLeversOf(DEFAULT_RIP_STYLE).map((lever) => lever.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("paths", () => {
  it("sets a value without touching the original", () => {
    const next = setAtPath(DEFAULT_RIP_STYLE, "rarities.rare.glow", 0.2);
    expect(getAtPath(next, "rarities.rare.glow")).toBe(0.2);
    expect(DEFAULT_RIP_STYLE.rarities.rare!.glow).toBe(0.6);
    expect(next.pack).toBe(DEFAULT_RIP_STYLE.pack);
  });
});

describe("sanitize", () => {
  it("clamps, checks and ignores what isn't a lever", () => {
    const style = sanitizeStyle({
      timing: { speed: 99, flipEase: "nope" },
      pack: { colorA: "#ABC", showName: "yes" },
      card: { currency: "dollars" },
      hacked: true,
    });
    expect(style.timing.speed).toBe(3);
    expect(style.timing.flipEase).toBe(DEFAULT_RIP_STYLE.timing.flipEase);
    expect(style.pack.colorA).toBe("#aabbcc");
    expect(style.pack.showName).toBe(DEFAULT_RIP_STYLE.pack.showName);
    expect(style.card.currency).toBe("doll");
    expect((style as unknown as Record<string, unknown>).hacked).toBeUndefined();
  });

  it("takes in new rarities", () => {
    const style = sanitizeStyle({ rarities: { mythic: { label: "Mythic", rank: 5, color: "#ff0000" } } });
    expect(style.rarities.mythic?.label).toBe("Mythic");
    expect(style.rarities.mythic?.rank).toBe(5);
    expect(style.rarities.common).toEqual(DEFAULT_RIP_STYLE.rarities.common);
  });
});

describe("share links", () => {
  it("round-trips a style through its code", () => {
    let style = presetStyle("arcane");
    style = setAtPath(style, "card.backEmblem", "★✦");
    const code = encodeStyle(style);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeStyle(code)).toEqual(style);
  });

  it("encodes the defaults as nothing", () => {
    expect(encodeStyle(DEFAULT_RIP_STYLE)).toBe("");
    expect(decodeStyle("")).toBe(DEFAULT_RIP_STYLE);
  });

  it("rejects garbage", () => {
    expect(decodeStyle("%%%")).toBeUndefined();
  });
});
