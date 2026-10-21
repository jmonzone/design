import type { PackCard } from "../../content/types";
import { CARD_FONTS } from "../../defs/cardFonts";
import { hash01, hashString } from "../../math/random";
import type { RarityStyle, RipStyle } from "../../style/types";
import { fitFont, formatValue, inset, roundRectPath } from "./canvas";

const INK = "#16161a";
const MUTED = "#5b5b66";

/** A slab's label: name and type, a certificate number with its barcode, and the grade (or, ungraded, the
 * rarity and value). Generic on purpose: no grading company's look. */
export function drawSlabLabel(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  card: PackCard,
  rarity: RarityStyle,
  style: RipStyle,
): void {
  const family = CARD_FONTS.of(style.card.font).family;
  const full = { x: 0, y: 0, w: W, h: H };
  ctx.fillStyle = "#f2f0ea";
  roundRectPath(ctx, full, H * 0.12);
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, full, H * 0.12);
  ctx.clip();
  ctx.fillStyle = rarity.color;
  ctx.fillRect(0, 0, W * 0.025, H);
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, inset(full, 4), H * 0.1);
  ctx.stroke();

  const left = W * 0.06;
  const right = W * 0.95;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  fitFont(ctx, card.name.toUpperCase(), W * 0.58, H * 0.2, family, 800);
  ctx.fillText(card.name.toUpperCase(), left, H * 0.36);
  ctx.fillStyle = MUTED;
  fitFont(ctx, card.subtitle ?? rarity.label, W * 0.58, H * 0.13, family, 600);
  ctx.fillText(card.subtitle ?? rarity.label, left, H * 0.56);

  const seed = hashString(card.id);
  ctx.font = `600 ${H * 0.11}px ui-monospace, Menlo, monospace`;
  ctx.fillText(String(10000000 + (seed % 89999999)), left, H * 0.85);
  ctx.fillStyle = INK;
  for (let x = left + W * 0.22, i = 0; x < W * 0.6; i++) {
    const bar = 1 + Math.floor(hash01(seed, i) * 3);
    if (i % 2 === 0) ctx.fillRect(x, H * 0.68, bar, H * 0.2);
    x += bar + 1;
  }

  ctx.textAlign = "right";
  if (card.grade) {
    ctx.fillStyle = MUTED;
    fitFont(ctx, card.grade.label.toUpperCase(), W * 0.3, H * 0.12, family, 700);
    ctx.fillText(card.grade.label.toUpperCase(), right, H * 0.3);
    ctx.fillStyle = INK;
    fitFont(ctx, card.grade.score, W * 0.3, H * 0.5, family, 900);
    ctx.fillText(card.grade.score, right, H * 0.82);
  } else {
    ctx.fillStyle = rarity.color;
    fitFont(ctx, rarity.label.toUpperCase(), W * 0.3, H * 0.14, family, 800);
    ctx.fillText(rarity.label.toUpperCase(), right, H * 0.36);
    if (style.card.showValue && card.value !== undefined) {
      ctx.fillStyle = INK;
      fitFont(ctx, `${style.card.currency}${formatValue(card.value)}`, W * 0.3, H * 0.3, family, 900);
      ctx.fillText(`${style.card.currency}${formatValue(card.value)}`, right, H * 0.8);
    }
  }
}
