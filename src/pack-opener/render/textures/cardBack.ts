import { CARD_FONTS } from "../../defs/cardFonts";
import { SURFACE_PATTERNS } from "../../defs/surfacePatterns";
import { shadeHex } from "../../math/color";
import type { CardStyle } from "../../style/types";
import { fitFont, inset, roundRectPath, withAlpha } from "./canvas";

/** Every card's back: a gradient, its print, a border and the emblem in a glowing medallion. */
export function drawCardBack(ctx: CanvasRenderingContext2D, W: number, H: number, style: CardStyle): void {
  const radius = style.cornerRadius * W;
  const full = { x: 0, y: 0, w: W, h: H };
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, style.backColorA);
  gradient.addColorStop(1, style.backColorB);
  ctx.fillStyle = gradient;
  roundRectPath(ctx, full, radius);
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, inset(full, W * 0.06), radius * 0.6);
  ctx.clip();
  ctx.globalAlpha = 0.22;
  SURFACE_PATTERNS.of(style.backPattern).draw(ctx, W, H, shadeHex(style.backColorA, 0.5));
  ctx.restore();

  ctx.strokeStyle = withAlpha(shadeHex(style.backColorA, 0.55), 0.8);
  ctx.lineWidth = W * 0.012;
  roundRectPath(ctx, inset(full, W * 0.045), radius * 0.7);
  ctx.stroke();

  const cx = W / 2;
  const cy = H / 2;
  const r = W * 0.27;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
  halo.addColorStop(0, withAlpha(shadeHex(style.backColorA, 0.35), 0.9));
  halo.addColorStop(1, withAlpha(style.backColorA, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  ctx.strokeStyle = withAlpha(shadeHex(style.backColorA, 0.6), 0.9);
  ctx.lineWidth = W * 0.01;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.18, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (style.backEmblem) {
    const ink = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    ink.addColorStop(0, shadeHex(style.backColorA, 0.85));
    ink.addColorStop(1, shadeHex(style.backColorA, 0.4));
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = withAlpha(shadeHex(style.backColorA, 0.6), 0.8);
    ctx.shadowBlur = W * 0.04;
    fitFont(ctx, style.backEmblem, r * 1.5, W * 0.3, CARD_FONTS.of(style.font).family, 900);
    ctx.fillText(style.backEmblem, cx, cy + W * 0.01);
    ctx.shadowColor = "transparent";
  }
}
