/**
 * Everything about how a rip looks and feels, as plain data: every field is a lever (style/levers/) a panel can
 * tune, a preset can set and a share link can carry. Durations are in seconds at speed 1. Ids name variants in
 * the registries under defs/.
 */
export interface RipStyle {
  readonly timing: TimingStyle;
  readonly pack: PackStyle;
  readonly tear: TearStyle;
  readonly card: CardStyle;
  readonly reveal: RevealStyle;
  readonly effects: EffectsStyle;
  readonly scene: SceneStyle;
  /** Each rarity's look, by the rarity id cards name. */
  readonly rarities: Readonly<Record<string, RarityStyle>>;
}

export interface TimingStyle {
  /** Divides every duration: 2 plays the whole rip twice as fast. */
  readonly speed: number;
  /** The pack dropping in. */
  readonly introS: number;
  /** A tap's tear (or an autoplay's), start to finish. */
  readonly autoTearS: number;
  /** How long a swipe released past the commit point takes to finish tearing. */
  readonly tearFinishS: number;
  /** The flap flying off, the pack falling away and the cards rising out. */
  readonly openS: number;
  /** A card lifting off the stack into view. */
  readonly presentS: number;
  /** A card turning face up (each rarity can slow it down). */
  readonly flipS: number;
  /** A card flying away once you move on. */
  readonly dismissS: number;
  /** Between a card leaving and the next one lifting. */
  readonly nextDelayS: number;
  /** Moves on by itself this long after a card is revealed; 0 waits for a tap. */
  readonly autoAdvanceS: number;
  /** How long autoplay lingers on each revealed card. */
  readonly autoplayHoldS: number;
  /** The cards gathering into the summary. */
  readonly summaryS: number;
  readonly introEase: string;
  readonly presentEase: string;
  readonly flipEase: string;
  readonly dismissEase: string;
  readonly summaryEase: string;
}

export interface PackStyle {
  readonly colorA: string;
  readonly colorB: string;
  /** The crimped seals and the print's highlights. */
  readonly accent: string;
  readonly labelColor: string;
  readonly pattern: string;
  /** How metallic and iridescent the wrapper is: 0 is plain printed plastic, 1 full foil. */
  readonly foil: number;
  /** Specular highlights sliding over it. */
  readonly shine: number;
  /** How crumpled the wrapper's surface is. */
  readonly crinkle: number;
  /** How puffed out it is. */
  readonly bulge: number;
  /** Its width, in card widths. */
  readonly width: number;
  readonly bob: number;
  readonly sway: number;
  readonly showName: boolean;
}

export interface TearStyle {
  readonly input: string;
  /** How far across a swipe must get before letting go still finishes the tear. */
  readonly commitAt: number;
  /** Where the tear runs, as a share of the pack's height down from its top. */
  readonly lineY: number;
  /** Teeth along the torn edge. */
  readonly teeth: number;
  readonly jaggedness: number;
  /** How far the strip curls up as it tears. */
  readonly peel: number;
  /** How hard the torn strip is flung away. */
  readonly flapFling: number;
  /** Sparks thrown off the tear. */
  readonly sparks: number;
  /** A shimmering line showing where to tear. */
  readonly guide: boolean;
  /** Light spilling out of the opening. */
  readonly leak: number;
  /** The light is the color of the best card inside. */
  readonly tease: boolean;
}

export interface CardStyle {
  /** Height over width (a standard trading card is 1.4). */
  readonly aspect: number;
  readonly cornerRadius: number;
  readonly thickness: number;
  readonly frameColor: string;
  /** How much of each card's rarity color its frame takes. */
  readonly frameTint: number;
  readonly border: number;
  readonly font: string;
  readonly textColor: string;
  /** Foil strength, multiplied by each rarity's own. */
  readonly foil: number;
  readonly holoPattern: string;
  readonly foilArea: string;
  /** The glare of a light catching the surface. */
  readonly gloss: number;
  /** How much a card leans with the phone or pointer. */
  readonly tilt: number;
  readonly showValue: boolean;
  readonly currency: string;
  readonly backColorA: string;
  readonly backColorB: string;
  readonly backPattern: string;
  /** The mark in the middle of every card back: a symbol or a word or two. */
  readonly backEmblem: string;
  readonly holder: string;
}

export interface RevealStyle {
  readonly order: string;
  /** Cards come out face down and turn over; otherwise they come out face up. */
  readonly flip: boolean;
  /** How messy the waiting stack is. */
  readonly stackSpread: number;
  readonly dismissDirection: string;
  /** How much of the view a revealed card fills. */
  readonly cardFill: number;
  readonly summaryLayout: string;
  /** Tapping a card in the summary brings it up close. */
  readonly inspect: boolean;
}

/** Global multipliers over every rarity's effects (0 turns one off everywhere). */
export interface EffectsStyle {
  readonly particles: number;
  readonly glow: number;
  readonly rays: number;
  readonly shake: number;
  readonly flash: number;
}

export interface SceneStyle {
  readonly bgTop: string;
  readonly bgBottom: string;
  readonly vignette: number;
  /** Specks of dust drifting through the light. */
  readonly dust: number;
  /** The camera's vertical field of view, degrees: low is flat, high is dramatic perspective. */
  readonly fov: number;
  /** How much the backdrop glows in the color of the card on show. */
  readonly ambientGlow: number;
}

/** One rarity's look. Higher `rank` is rarer: it decides reveal order and which card's color the tear teases. */
export interface RarityStyle {
  readonly label: string;
  readonly rank: number;
  readonly color: string;
  readonly foil: number;
  readonly glow: number;
  /** Particles in its reveal burst. */
  readonly particles: number;
  readonly rays: number;
  /** The face-down build-up before it turns over: glow seeping out, a tremble. */
  readonly anticipationS: number;
  readonly shake: number;
  readonly flash: number;
  /** Multiplies its flip's duration. */
  readonly flipSlowdown: number;
  readonly haptic: string;
}

/** Any part of a RipStyle: what a preset sets over the defaults. */
export type DeepPartial<T> = { readonly [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
