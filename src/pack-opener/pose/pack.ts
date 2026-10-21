import { easingOf } from "../defs/easings";
import { lerp, smoothstep, spanProgress } from "../math/scalar";
import type { RipRecord } from "../timeline/record";
import type { ResolvedRip } from "../timeline/resolve";
import { openedAtOf, tearAttemptAt, tearFromRightAt, tearProgressAt } from "../timeline/tear";
import type { Layout } from "./layout";
import type { FlapPose, PackPose } from "./types";

const ATTACHED_FLAP: FlapPose = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1, opacity: 1 };

/** The pack at `t`: dropping in, floating while it waits, held still and trembling as it tears, then jolting open
 * as the strip flies off and falling away under the rising cards. */
export function packPoseAt(rip: ResolvedRip, record: RipRecord, layout: Layout, t: number): PackPose {
  const { style, d } = rip;
  const intro = easingOf(style.timing.introEase)(spanProgress(t, 0, d.intro));
  const tear = tearProgressAt(record, t);
  const fromRight = tearFromRightAt(record, t);
  const attempt = tearAttemptAt(record, t);
  const working = attempt !== undefined && (attempt.releasedAt === undefined || t < attempt.releasedAt + attempt.settleS);
  // It holds steadier while it's being torn, so the finger has a still target.
  const calm = working ? 0.25 : 1;
  const bob = style.pack.bob * calm;
  const sway = style.pack.sway * calm;

  let y = lerp(layout.viewH * 0.9, 0, intro) + Math.sin(t * 1.7) * 0.035 * bob;
  let rotX = Math.sin(t * 0.61 + 1) * 0.06 * sway;
  let rotY = Math.sin(t * 0.83) * 0.16 * sway;
  let rotZ = lerp(-0.35, 0, intro) + Math.sin(t * 1.13) * 0.03 * sway;

  for (const at of record.nudges) {
    const since = t - at;
    if (since >= 0 && since < 0.5) rotZ += Math.sin(since * 40) * 0.06 * (1 - since / 0.5);
  }
  if (working && tear > 0 && tear < 1) {
    rotZ += Math.sin(t * 53) * 0.004;
    y += Math.sin(t * 61) * 0.003;
  }

  let visible = true;
  let opacity = 1;
  let tiltWeight = 1;
  let leak = style.tear.leak * smoothstep(0, 0.12, tear);
  let flap = ATTACHED_FLAP;

  const openedAt = openedAtOf(record);
  if (openedAt !== undefined && t >= openedAt) {
    const since = t - openedAt;
    const dir = fromRight ? -1 : 1;
    const fling = style.tear.flapFling;
    const f = easingOf("easeOutCubic")(spanProgress(t, openedAt, d.open * 0.6));
    flap = {
      x: dir * f * (0.3 + 1.3 * fling) * layout.packW,
      y: (f * 0.9 - f * f * 0.45) * (0.3 + fling) * layout.packH,
      z: f * 0.5,
      rotX: -f * 1.2 * fling,
      rotY: dir * f * 0.6 * fling,
      rotZ: -dir * f * (0.4 + 2.4 * fling),
      scale: 1,
      opacity: 1 - smoothstep(0.55, 1, f),
    };
    rotZ += Math.exp(-since * 9) * Math.sin(since * 44) * 0.05 * style.effects.shake;
    const fall = easingOf("easeInCubic")(spanProgress(t, openedAt + d.open * 0.3, d.open * 0.6));
    y -= fall * layout.viewH;
    rotX += fall * 0.5;
    opacity = 1 - smoothstep(0.65, 1, fall);
    leak = style.tear.leak * (1 + 2.5 * Math.exp(-since * 4)) * (1 - fall);
    tiltWeight = 1 - fall;
    visible = t < openedAt + d.open;
  }

  const guide =
    style.tear.guide && openedAt === undefined && !working
      ? spanProgress(t, d.intro * 0.8, 0.5) * (1 - smoothstep(0, 0.05, tear))
      : 0;

  return {
    x: 0,
    y,
    z: 0,
    rotX,
    rotY,
    rotZ,
    scale: layout.packScale,
    visible,
    opacity,
    tear,
    fromRight,
    flap,
    leak,
    guide,
    tiltWeight,
  };
}
