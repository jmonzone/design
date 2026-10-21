/** Where something is and how it's turned, in world units and radians. */
export interface Placement {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotX: number;
  readonly rotY: number;
  readonly rotZ: number;
  readonly scale: number;
}

export interface FlapPose extends Placement {
  readonly opacity: number;
}

export interface PackPose extends Placement {
  readonly visible: boolean;
  readonly opacity: number;
  /** How far across it's torn, 0–1. */
  readonly tear: number;
  readonly fromRight: boolean;
  /** The torn strip, relative to where it was attached. */
  readonly flap: FlapPose;
  /** Light spilling out of the tear. */
  readonly leak: number;
  /** The tear-here line's strength. */
  readonly guide: number;
  /** How much it leans with the player's tilt. */
  readonly tiltWeight: number;
}

export interface CardPose extends Placement {
  readonly visible: boolean;
  readonly opacity: number;
  /** Darkened behind a card brought up close. */
  readonly dim: number;
  readonly glow: number;
  readonly rays: number;
  /** The foil's flare as it turns face up. */
  readonly flare: number;
  readonly tiltWeight: number;
  /** Drawn over the other cards. */
  readonly front: boolean;
}

/** One frame of a rip. */
export interface Pose {
  readonly pack: PackPose;
  readonly cards: readonly CardPose[];
  /** Camera shake offset (world units) and roll (radians). */
  readonly shakeX: number;
  readonly shakeY: number;
  readonly shakeRoll: number;
  /** A full-screen flash, in the color of card `flashIndex`. */
  readonly flash: number;
  readonly flashIndex: number;
  /** The backdrop's glow, in the color of card `glowIndex` (-1: the pack's tease color). */
  readonly glow: number;
  readonly glowIndex: number;
}

export function lerpPlacement(a: Placement, b: Placement, t: number): Placement {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    rotX: a.rotX + (b.rotX - a.rotX) * t,
    rotY: a.rotY + (b.rotY - a.rotY) * t,
    rotZ: a.rotZ + (b.rotZ - a.rotZ) * t,
    scale: a.scale + (b.scale - a.scale) * t,
  };
}
