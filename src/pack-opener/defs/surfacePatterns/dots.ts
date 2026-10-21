import type { SurfacePatternDef } from "./types";

/** A halftone: dots that grow toward the bottom. */
export const DOTS_PATTERN: SurfacePatternDef = {
  id: "dots",
  label: "Halftone",
  draw: (ctx, width, height, ink) => {
    const spacing = width / 16;
    ctx.fillStyle = ink;
    for (let row = 0, y = spacing / 2; y < height + spacing; row++, y += spacing * 0.866) {
      const radius = spacing * (0.08 + 0.34 * (y / height));
      for (let x = (row % 2) * spacing * 0.5; x < width + spacing; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
};
