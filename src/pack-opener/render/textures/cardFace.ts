import type { PackCard } from "../../content/types";
import { CARD_FONTS } from "../../defs/cardFonts";
import { FOIL_AREAS } from "../../defs/foilAreas";
import { SURFACE_PATTERNS } from "../../defs/surfacePatterns";
import { mixHex, shadeHex } from "../../math/color";
import { clamp01 } from "../../math/scalar";
import type { CardStyle, RarityStyle, RipStyle } from "../../style/types";
import { drawImageContain, fitFont, formatValue, roundRectPath, withAlpha, type Rect } from "./canvas";

/** What a face renderer draws from. `image` is the card's art, once it has loaded. */
export interface CardFaceContext {
  readonly card: PackCard;
  readonly rarity: RarityStyle;
  readonly style: RipStyle;
  readonly width: number;
  readonly height: number;
  readonly image?: HTMLImageElement;
}

/** Draws a card's face onto a `width` × `height` canvas (top-left origin). Pass your own to PackOpener to print
 * cards your way; drawDefaultCardFace is the built-in one. */
export type CardFaceRenderer = (ctx: CanvasRenderingContext2D, face: CardFaceContext) => void;

/** Where everything sits on the default face, in canvas pixels. */
export interface FaceLayout {
  readonly radius: number;
  readonly inner: Rect;
  readonly nameBar: Rect;
  readonly art: Rect;
  readonly typeBar: Rect;
  readonly textBox: Rect;
}

export function faceLayoutOf(width: number, height: number, style: CardStyle): FaceLayout {
  const border = style.border * width;
  const inner = { x: border, y: border, w: width - border * 2, h: height - border * 2 };
  const pad = width * 0.028;
  const contentW = inner.w - pad * 2;
  const nameBar = { x: inner.x + pad, y: inner.y + pad, w: contentW, h: height * 0.085 };
  const art = {
    x: inner.x + pad,
    y: nameBar.y + nameBar.h + pad * 0.7,
    w: contentW,
    h: Math.min(contentW * 0.82, inner.h * 0.52),
  };
  const typeBar = { x: art.x, y: art.y + art.h + pad * 0.7, w: contentW, h: height * 0.06 };
  const textTop = typeBar.y + typeBar.h + pad * 0.7;
  const textBox = { x: art.x, y: textTop, w: contentW, h: Math.max(0, inner.y + inner.h - pad - textTop) };
  return { radius: style.cornerRadius * width, inner, nameBar, art, typeBar, textBox };
}

/** The built-in face: a frame tinted by rarity, a name bar with a rarity gem, the art on a glowing backdrop, a
 * type line, the rarity's stars and the card's value. */
export const drawDefaultCardFace: CardFaceRenderer = (ctx, { card, rarity, style, width: W, height: H, image }) => {
  const cs = style.card;
  const L = faceLayoutOf(W, H, cs);
  const family = CARD_FONTS.of(cs.font).family;
  const tint = mixHex(cs.frameColor, rarity.color, cs.frameTint);

  const frame = ctx.createLinearGradient(0, 0, W, H);
  frame.addColorStop(0, shadeHex(tint, 0.18));
  frame.addColorStop(0.5, tint);
  frame.addColorStop(1, shadeHex(tint, -0.35));
  ctx.fillStyle = frame;
  roundRectPath(ctx, { x: 0, y: 0, w: W, h: H }, L.radius);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = W * 0.006;
  roundRectPath(ctx, { x: W * 0.006, y: W * 0.006, w: W - W * 0.012, h: H - W * 0.012 }, L.radius);
  ctx.stroke();

  ctx.fillStyle = mixHex(cs.frameColor, "#000000", 0.45);
  roundRectPath(ctx, L.inner, L.radius * 0.6);
  ctx.fill();

  // Name bar, with a gem in the rarity's color.
  const bar = L.nameBar;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRectPath(ctx, bar, bar.h * 0.32);
  ctx.fill();
  ctx.strokeStyle = withAlpha(rarity.color, 0.55);
  ctx.lineWidth = W * 0.004;
  ctx.stroke();
  ctx.fillStyle = cs.textColor;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  fitFont(ctx, card.name, bar.w - bar.h * 1.4, bar.h * 0.5, family, 800);
  ctx.fillText(card.name, bar.x + bar.h * 0.35, bar.y + bar.h / 2 + bar.h * 0.03);
  const gemX = bar.x + bar.w - bar.h * 0.5;
  const gemY = bar.y + bar.h / 2;
  const gemR = bar.h * 0.27;
  const gem = ctx.createRadialGradient(gemX - gemR * 0.35, gemY - gemR * 0.35, 0, gemX, gemY, gemR);
  gem.addColorStop(0, shadeHex(rarity.color, 0.7));
  gem.addColorStop(0.6, rarity.color);
  gem.addColorStop(1, shadeHex(rarity.color, -0.45));
  ctx.fillStyle = gem;
  ctx.beginPath();
  ctx.arc(gemX, gemY, gemR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = W * 0.003;
  ctx.stroke();

  // The art on a backdrop lit in the rarity's color.
  const art = L.art;
  ctx.save();
  roundRectPath(ctx, art, W * 0.02);
  ctx.clip();
  const backdrop = ctx.createRadialGradient(art.x + art.w / 2, art.y + art.h * 0.45, 0, art.x + art.w / 2, art.y + art.h * 0.45, art.w * 0.75);
  backdrop.addColorStop(0, mixHex(rarity.color, "#ffffff", 0.45));
  backdrop.addColorStop(0.55, mixHex(rarity.color, "#000000", 0.25));
  backdrop.addColorStop(1, mixHex(rarity.color, "#000000", 0.7));
  ctx.fillStyle = backdrop;
  ctx.fillRect(art.x, art.y, art.w, art.h);
  ctx.translate(art.x, art.y);
  ctx.globalAlpha = 0.09;
  SURFACE_PATTERNS.of("burst").draw(ctx, art.w, art.h, "#ffffff");
  ctx.globalAlpha = 1;
  ctx.translate(-art.x, -art.y);
  if (image) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = W * 0.03;
    ctx.shadowOffsetY = W * 0.01;
    const m = art.w * 0.05;
    drawImageContain(ctx, image, { x: art.x + m, y: art.y + m, w: art.w - m * 2, h: art.h - m }, "bottom");
    ctx.shadowColor = "transparent";
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = W * 0.008;
  roundRectPath(ctx, art, W * 0.02);
  ctx.stroke();

  // Type line: subtitle, and the rarity's name.
  const type = L.typeBar;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRectPath(ctx, type, type.h * 0.3);
  ctx.fill();
  const rarityLabel = rarity.label.toUpperCase();
  ctx.textAlign = "right";
  ctx.fillStyle = mixHex(rarity.color, "#ffffff", 0.3);
  ctx.font = `800 ${type.h * 0.38}px ${family}`;
  const rarityWidth = ctx.measureText(rarityLabel).width;
  ctx.fillText(rarityLabel, type.x + type.w - type.h * 0.35, type.y + type.h / 2 + type.h * 0.03);
  if (card.subtitle) {
    ctx.textAlign = "left";
    ctx.fillStyle = withAlpha(cs.textColor, 0.85);
    fitFont(ctx, card.subtitle, type.w - rarityWidth - type.h * 1.2, type.h * 0.46, family, 600);
    ctx.fillText(card.subtitle, type.x + type.h * 0.35, type.y + type.h / 2 + type.h * 0.03);
  }

  // Stars for its rank; its value.
  const box = L.textBox;
  if (box.h > H * 0.05) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    roundRectPath(ctx, box, W * 0.02);
    ctx.fill();
    const starSize = Math.min(box.h * 0.2, H * 0.04);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = rarity.color;
    ctx.font = `700 ${starSize}px ${family}`;
    ctx.fillText("★".repeat(Math.max(1, Math.round(rarity.rank) + 1)), box.x + box.w * 0.04, box.y + box.h * 0.14);
    if (cs.showValue && card.value !== undefined) {
      const valueSize = Math.min(box.h * 0.36, H * 0.07);
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = withAlpha(cs.textColor, 0.55);
      ctx.font = `700 ${valueSize * 0.38}px ${family}`;
      ctx.fillText("VALUE", box.x + box.w * 0.96, box.y + box.h * 0.86 - valueSize * 1.05);
      ctx.fillStyle = cs.textColor;
      ctx.font = `800 ${valueSize}px ${family}`;
      ctx.fillText(`${cs.currency}${formatValue(card.value)}`, box.x + box.w * 0.96, box.y + box.h * 0.86);
    }
  }
};

/** Where the default face's foil shows (white) and doesn't (black), by the style's holo area. */
export function drawDefaultFoilMask(ctx: CanvasRenderingContext2D, width: number, height: number, style: CardStyle): void {
  const L = faceLayoutOf(width, height, style);
  const area = FOIL_AREAS.of(style.foilArea);
  const gray = (v: number) => {
    const c = Math.round(clamp01(v) * 255);
    return `rgb(${c}, ${c}, ${c})`;
  };
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = gray(area.frame);
  roundRectPath(ctx, { x: 0, y: 0, w: width, h: height }, L.radius);
  ctx.fill();
  ctx.fillStyle = "#000000";
  roundRectPath(ctx, L.inner, L.radius * 0.6);
  ctx.fill();
  ctx.fillStyle = gray(area.text);
  for (const rect of [L.nameBar, L.typeBar, L.textBox]) ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = gray(area.art);
  ctx.fillRect(L.art.x, L.art.y, L.art.w, L.art.h);
}
