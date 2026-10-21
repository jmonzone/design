import { hexToRgb } from "../../math/color";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("pack-opener: no 2D canvas context");
  return ctx;
}

export function roundRectPath(ctx: CanvasRenderingContext2D, rect: Rect, radius: number): void {
  const { x, y, w, h } = rect;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function inset(rect: Rect, by: number): Rect {
  return { x: rect.x + by, y: rect.y + by, w: rect.w - by * 2, h: rect.h - by * 2 };
}

/** A hex color as a CSS rgba() with `alpha`. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

/** Sets ctx.font to the largest size up to `size` at which `text` fits in `maxWidth`. */
export function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  family: string,
  weight: number | string = 700,
): number {
  let px = size;
  ctx.font = `${weight} ${px}px ${family}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth && width > 0) {
    px = Math.max(6, size * (maxWidth / width));
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

/** `image` scaled to fit inside `rect` without cropping, centered, or resting on its bottom edge. */
export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  rect: Rect,
  align: "center" | "bottom" = "center",
): void {
  if (!image.width || !image.height) return;
  const scale = Math.min(rect.w / image.width, rect.h / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  const x = rect.x + (rect.w - w) / 2;
  const y = align === "bottom" ? rect.y + rect.h - h : rect.y + (rect.h - h) / 2;
  ctx.drawImage(image, x, y, w, h);
}

export function formatValue(value: number): string {
  if (value >= 1000) return Math.round(value).toLocaleString("en-US");
  if (value >= 100) return value.toFixed(0);
  return value.toFixed(2);
}
