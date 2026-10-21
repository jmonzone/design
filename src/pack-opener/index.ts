// The opener itself.
export { PackOpener, type PackOpenerOptions, type RipMode } from "./engine/PackOpener";

// What a pack holds.
export type { CardGrade, PackCard, PackContents } from "./content/types";
export { drawPack, type PackSlot } from "./content/drawPack";

// How a rip looks and feels: the style, its levers, presets, and share links.
export type { CardStyle, DeepPartial, EffectsStyle, PackStyle, RarityStyle, RevealStyle, RipStyle, SceneStyle, TearStyle, TimingStyle } from "./style/types";
export { DEFAULT_RARITIES, DEFAULT_RARITY, DEFAULT_RIP_STYLE } from "./style/defaults";
export { mergeStyle } from "./style/merge";
export { getAtPath, setAtPath } from "./style/paths";
export { RARITY_ID, sanitizeLeverValue, sanitizeStyle } from "./style/sanitize";
export { decodeStyle, encodeStyle, styleDiff } from "./style/encode";
export { RIP_PRESETS, presetStyle, type RipPreset } from "./style/presets";
export {
  allLeversOf,
  leverGroupsOf,
  raritiesByRank,
  STYLE_LEVER_GROUPS,
  type ChoiceLever,
  type ColorLever,
  type LeverDef,
  type LeverGroupDef,
  type NumberLever,
  type TextLever,
  type ToggleLever,
} from "./style/levers";

// The variants the style's choices pick from.
export type { ChoiceOption, Def, Registry } from "./defs/registry";
export { CARD_FONTS, type CardFontDef } from "./defs/cardFonts";
export { DISMISS_DIRECTIONS, type DismissDirectionDef } from "./defs/dismissDirections";
export { EASINGS, easingOf, type EasingDef } from "./defs/easings";
export { FOIL_AREAS, type FoilAreaDef } from "./defs/foilAreas";
export { HAPTIC_PATTERNS, type HapticBlock, type HapticPatternDef } from "./defs/hapticPatterns";
export { HOLDERS, type HolderDef } from "./defs/holders";
export { HOLO_PATTERNS, type HoloPatternDef } from "./defs/holoPatterns";
export { REVEAL_ORDERS, type RevealOrderDef } from "./defs/revealOrders";
export { SUMMARY_LAYOUTS, type SummaryLayoutDef, type SummarySlot } from "./defs/summaryLayouts";
export { SURFACE_PATTERNS, type SurfacePatternDef } from "./defs/surfacePatterns";
export { TEAR_INPUTS, type TearInputDef } from "./defs/tearInputs";

// Following a rip.
export type { RipEvent, RipEventType } from "./timeline/events";
export type { RipPhase, RipSnapshot } from "./timeline/snapshot";
export type { RipRecord } from "./timeline/record";
export { hapticOf } from "./timeline/haptics";
export type { Insets } from "./pose/layout";

// Printing your own card faces.
export { drawDefaultCardFace, type CardFaceContext, type CardFaceRenderer } from "./render/textures/cardFace";

// Seeded randomness, handy for repeatable packs.
export { seededRandom, hashString } from "./math/random";
export type { Vec2 } from "./math/vec";
