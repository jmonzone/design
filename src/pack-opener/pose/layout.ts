import { holderSizeOf, HOLDERS } from "../defs/holders";
import { SUMMARY_LAYOUTS, type SummarySlot } from "../defs/summaryLayouts";
import type { RipStyle } from "../style/types";

/** Room the host's own UI takes over the canvas (a bottom sheet, a toolbar), in CSS pixels. The rip is framed
 * in what's left. */
export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export interface Viewport {
  /** The canvas, in CSS pixels. */
  readonly width: number;
  readonly height: number;
  readonly insets: Insets;
}

/** Sizes in world units, where a card is 1 wide. The camera looks down -z at the origin, which sits at the
 * middle of the visible region (the canvas less its insets). */
export interface Layout {
  /** The visible region at z = 0. */
  readonly viewW: number;
  readonly viewH: number;
  readonly cardW: number;
  readonly cardH: number;
  /** A card in its holder (just the card when bare). */
  readonly unitW: number;
  readonly unitH: number;
  readonly cardY: number;
  readonly labelY: number;
  /** The pack at scale 1, and the scale that fits it in view. */
  readonly packW: number;
  readonly packH: number;
  readonly packScale: number;
  /** Vertical field of view of the visible region (radians), and the camera's distance for it. */
  readonly fov: number;
  readonly cameraZ: number;
  readonly pxPerUnit: number;
  readonly slots: readonly SummarySlot[];
}

export function layoutOf(style: RipStyle, cardCount: number, viewport: Viewport): Layout {
  const { insets } = viewport;
  const regionW = Math.max(1, viewport.width - insets.left - insets.right);
  const regionH = Math.max(1, viewport.height - insets.top - insets.bottom);
  const aspect = regionW / regionH;

  const cardW = 1;
  const cardH = style.card.aspect;
  const holder = holderSizeOf(HOLDERS.of(style.card.holder), cardW, cardH);
  const fill = style.reveal.cardFill;
  const viewH = Math.max(holder.height / fill, holder.width / (fill * aspect));
  const viewW = viewH * aspect;

  const packW = holder.width * style.pack.width;
  const packH = holder.height * 1.08 + packW * 0.32;
  const packScale = Math.min(1, (viewH * 0.84) / packH, (viewW * 0.86) / packW);

  const fov = (style.scene.fov * Math.PI) / 180;
  const unit = { width: holder.width, height: holder.height };
  return {
    viewW,
    viewH,
    cardW,
    cardH,
    unitW: holder.width,
    unitH: holder.height,
    cardY: holder.cardY,
    labelY: holder.labelY,
    packW,
    packH,
    packScale,
    fov,
    cameraZ: viewH / 2 / Math.tan(fov / 2),
    pxPerUnit: regionH / viewH,
    slots: SUMMARY_LAYOUTS.of(style.reveal.summaryLayout).slots(cardCount, { width: viewW, height: viewH }, unit),
  };
}

/** The tear line's height in pack space (y up from the pack's center). */
export function tearLineY(style: RipStyle, layout: Layout): number {
  return layout.packH / 2 - style.tear.lineY * layout.packH;
}
