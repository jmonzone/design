import type { SurfacePatternDef } from "./types";

export const STRIPES_PATTERN: SurfacePatternDef = {
  id: "stripes",
  label: "Stripes",
  draw: (ctx, width, height, ink) => {
    const spacing = width / 9;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 5);
    ctx.fillStyle = ink;
    const reach = Math.hypot(width, height);
    for (let x = -reach; x < reach; x += spacing) ctx.fillRect(x, -reach, spacing * 0.32, reach * 2);
    ctx.restore();
  },
};
