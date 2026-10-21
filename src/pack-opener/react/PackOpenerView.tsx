import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import type { PackContents } from "../content/types";
import { PackOpener, type RipMode } from "../engine/PackOpener";
import type { Insets } from "../pose/layout";
import type { CardFaceRenderer } from "../render/textures/cardFace";
import type { RipStyle } from "../style/types";
import type { RipEvent } from "../timeline/events";
import type { RipSnapshot } from "../timeline/snapshot";

export interface PackOpenerViewProps {
  readonly pack: PackContents;
  readonly ripStyle?: RipStyle;
  readonly mode?: RipMode;
  readonly loop?: boolean;
  readonly paused?: boolean;
  readonly timeScale?: number;
  readonly insets?: Insets;
  readonly renderFace?: CardFaceRenderer;
  readonly maxPixelRatio?: number;
  readonly backdropOnly?: boolean;
  readonly onEvent?: (event: RipEvent) => void;
  /** The opener once it exists (and null when it's gone), for hooks like useRipSnapshot. */
  readonly onOpener?: (opener: PackOpener | null) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * A PackOpener filling its parent. Props flow into the opener as they change; its ref is the opener itself, for
 * the imperative calls (advance, replay, seek...). Works with React 18 and 19.
 */
export const PackOpenerView = forwardRef<PackOpener | null, PackOpenerViewProps>(function PackOpenerView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [opener, setOpener] = useState<PackOpener | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const initial = latest.current;
    const created = new PackOpener({
      container: containerRef.current!,
      pack: initial.pack,
      ripStyle: initial.ripStyle,
      mode: initial.mode,
      loop: initial.loop,
      paused: initial.paused,
      timeScale: initial.timeScale,
      insets: initial.insets,
      renderFace: initial.renderFace,
      maxPixelRatio: initial.maxPixelRatio,
      backdropOnly: initial.backdropOnly,
      onEvent: (event) => latest.current.onEvent?.(event),
    });
    setOpener(created);
    latest.current.onOpener?.(created);
    return () => {
      latest.current.onOpener?.(null);
      created.dispose();
      setOpener(null);
    };
  }, []);

  useImperativeHandle(ref, () => opener as PackOpener, [opener]);

  const { pack, ripStyle, mode, loop, paused, timeScale, insets, renderFace, backdropOnly } = props;
  useEffect(() => opener?.setPack(pack), [opener, pack]);
  useEffect(() => {
    if (ripStyle) opener?.setStyle(ripStyle);
  }, [opener, ripStyle]);
  useEffect(() => {
    if (mode) opener?.setMode(mode);
  }, [opener, mode]);
  useEffect(() => {
    if (loop !== undefined) opener?.setLoop(loop);
  }, [opener, loop]);
  useEffect(() => {
    if (paused !== undefined) opener?.setPaused(paused);
  }, [opener, paused]);
  useEffect(() => {
    if (timeScale !== undefined) opener?.setTimeScale(timeScale);
  }, [opener, timeScale]);
  useEffect(() => {
    if (backdropOnly !== undefined) opener?.setBackdropOnly(backdropOnly);
  }, [opener, backdropOnly]);
  const insetTop = insets?.top ?? 0;
  const insetRight = insets?.right ?? 0;
  const insetBottom = insets?.bottom ?? 0;
  const insetLeft = insets?.left ?? 0;
  useEffect(() => {
    opener?.setInsets({ top: insetTop, right: insetRight, bottom: insetBottom, left: insetLeft });
  }, [opener, insetTop, insetRight, insetBottom, insetLeft]);
  useEffect(() => opener?.setRenderFace(renderFace), [opener, renderFace]);

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...props.style }}
    />
  );
});

const NO_SNAPSHOT = () => null;
const NO_SUBSCRIPTION = () => () => {};

/** The opener's snapshot, re-rendering only when it changes (between beats, never every frame). */
export function useRipSnapshot(opener: PackOpener | null): RipSnapshot | null {
  return useSyncExternalStore(opener?.subscribe ?? NO_SUBSCRIPTION, opener?.getSnapshot ?? NO_SNAPSHOT, opener?.getSnapshot ?? NO_SNAPSHOT);
}
