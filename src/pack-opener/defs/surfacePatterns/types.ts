import type { Def } from "../registry";

/** A print laid over a wrapper or card back: drawn in `ink` over the whole `width` × `height` canvas, at
 * whatever opacity the caller has set on `ctx`. */
export interface SurfacePatternDef extends Def {
  readonly draw: (ctx: CanvasRenderingContext2D, width: number, height: number, ink: string) => void;
}
