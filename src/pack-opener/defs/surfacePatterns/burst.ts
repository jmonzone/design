import type { SurfacePatternDef } from "./types";

/** Sunburst rays fanning out from the middle. */
export const BURST_PATTERN: SurfacePatternDef = {
  id: "burst",
  label: "Sunburst",
  draw: (ctx, width, height, ink) => {
    const rays = 28;
    const reach = Math.hypot(width, height);
    ctx.save();
    ctx.translate(width / 2, height * 0.45);
    ctx.fillStyle = ink;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const half = Math.PI / rays / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - half) * reach, Math.sin(a - half) * reach);
      ctx.lineTo(Math.cos(a + half) * reach, Math.sin(a + half) * reach);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },
};
