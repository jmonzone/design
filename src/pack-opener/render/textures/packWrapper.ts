import type { PackContents } from "../../content/types";
import { CARD_FONTS } from "../../defs/cardFonts";
import { SURFACE_PATTERNS } from "../../defs/surfacePatterns";
import { shadeHex } from "../../math/color";
import type { RipStyle } from "../../style/types";
import { PACK_CRIMP_SHARE } from "../geometry";
import { drawImageContain, fitFont, withAlpha } from "./canvas";

/** The wrapper's print, front and back: gradient, pattern, art, name, crimped ends, and a "tear here" strip. */
export function drawPackWrapper(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  style: RipStyle,
  pack: PackContents,
  art: HTMLImageElement | undefined,
): void {
  const ps = style.pack;
  const family = CARD_FONTS.of(style.card.font).family;

  const body = ctx.createLinearGradient(0, 0, 0, H);
  body.addColorStop(0, ps.colorA);
  body.addColorStop(1, ps.colorB);
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.16;
  SURFACE_PATTERNS.of(ps.pattern).draw(ctx, W, H, ps.accent);
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.75);
  glow.addColorStop(0, "rgba(255,255,255,0.2)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  if (art) {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = W * 0.04;
    ctx.shadowOffsetY = W * 0.015;
    drawImageContain(ctx, art, { x: W * 0.1, y: H * 0.2, w: W * 0.8, h: H * 0.46 }, "center");
    ctx.shadowColor = "transparent";
  }

  if (ps.showName) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ps.labelColor;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = W * 0.025;
    ctx.shadowOffsetY = W * 0.008;
    const name = pack.name.toUpperCase();
    fitFont(ctx, name, W * 0.84, W * 0.13, family, 900);
    ctx.fillText(name, W / 2, H * 0.76);
    if (pack.subtitle) {
      ctx.globalAlpha = 0.85;
      fitFont(ctx, pack.subtitle, W * 0.8, W * 0.05, family, 600);
      ctx.fillText(pack.subtitle, W / 2, H * 0.83);
      ctx.globalAlpha = 1;
    }
    ctx.shadowColor = "transparent";
  }

  const crimp = H * PACK_CRIMP_SHARE;
  for (const top of [0, H - crimp]) {
    ctx.fillStyle = shadeHex(ps.accent, -0.25);
    ctx.fillRect(0, top, W, crimp);
    const ridge = W / 60;
    for (let i = 0, x = 0; x < W; i++, x += ridge / 2) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)";
      ctx.fillRect(x, top, ridge / 2, crimp);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, top === 0 ? crimp - 2 : top, W, 2);
  }

  const tearPx = style.tear.lineY * H;
  const strip = tearPx - crimp;
  if (strip > H * 0.02) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = withAlpha(ps.labelColor, 0.55);
    ctx.font = `800 ${Math.min(W * 0.035, strip * 0.5)}px ${family}`;
    ctx.fillText("▸  TEAR HERE  ▸", W / 2, crimp + strip / 2);
  }
}
