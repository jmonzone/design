import type { SurfacePatternDef } from "./types";

/** An argyle of outlined diamonds. */
export const DIAMONDS_PATTERN: SurfacePatternDef = {
  id: "diamonds",
  label: "Diamonds",
  draw: (ctx, width, height, ink) => {
    const w = width / 6;
    const h = w * 1.4;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, width / 220);
    for (let row = -1, y = -h / 2; y < height + h; row++, y += h / 2) {
      for (let x = (row % 2 === 0 ? 0 : w / 2) - w; x < width + w; x += w) {
        ctx.beginPath();
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x, y + h / 2);
        ctx.lineTo(x - w / 2, y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  },
};
