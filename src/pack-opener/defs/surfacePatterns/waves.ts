import type { SurfacePatternDef } from "./types";

/** Flowing horizontal wave lines. */
export const WAVES_PATTERN: SurfacePatternDef = {
  id: "waves",
  label: "Waves",
  draw: (ctx, width, height, ink) => {
    const spacing = height / 22;
    const amplitude = spacing * 0.45;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, width / 160);
    for (let y = 0; y < height + spacing; y += spacing) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += width / 48) {
        const yy = y + Math.sin((x / width) * Math.PI * 4 + y * 0.05) * amplitude;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  },
};
