import { Group, PerspectiveCamera, Raycaster, Scene, SRGBColorSpace, Vector2, WebGLRenderer } from "three";
import type { PackCard, PackContents } from "../content/types";
import { DISMISS_DIRECTIONS } from "../defs/dismissDirections";
import { TEAR_INPUTS } from "../defs/tearInputs";
import { mixHex } from "../math/color";
import { clamp, clamp01 } from "../math/scalar";
import { normalize2, type Vec2 } from "../math/vec";
import { poseAt } from "../pose";
import { layoutOf, NO_INSETS, type Insets, type Layout, type Viewport } from "../pose/layout";
import { BackgroundView, DustView } from "../render/BackgroundView";
import { CardsView } from "../render/CardsView";
import { PackView } from "../render/PackView";
import { ParticlesView } from "../render/ParticlesView";
import type { CardFaceRenderer } from "../render/textures/cardFace";
import { DEFAULT_RIP_STYLE } from "../style/defaults";
import type { RipStyle } from "../style/types";
import { autoplayRecord, recordDuration } from "../timeline/autoplay";
import { eventsOf, type RipEvent, type TimedEvent } from "../timeline/events";
import { cloneRecord, emptyRecord, type RipRecord, type TearAttempt } from "../timeline/record";
import { resolveRip, type ResolvedRip } from "../timeline/resolve";
import { sameSnapshot, snapshotAt, type RipSnapshot } from "../timeline/snapshot";
import { cardTimesOf } from "../timeline/times";
import { GestureInput } from "./gestures";

/**
 * How the opener is driven. Interactive: the player tears, taps and swipes. Autoplay: the whole rip plays itself
 * (scrubbable, looping), for previews and attract screens. Replay: the last interactive rip, played back exactly.
 */
export type RipMode = "interactive" | "autoplay" | "replay";

export interface PackOpenerOptions {
  /** The element to fill; the opener adds its canvas to it and follows its size. */
  readonly container: HTMLElement;
  readonly pack: PackContents;
  readonly ripStyle?: RipStyle;
  readonly mode?: RipMode;
  /** Autoplay and replay start over when they end (default true). */
  readonly loop?: boolean;
  readonly paused?: boolean;
  /** Plays the clock faster or slower (slow motion for tuning), on top of the style's own speed. */
  readonly timeScale?: number;
  /** Room the host's UI takes over the canvas; the rip is framed in the rest. */
  readonly insets?: Insets;
  /** Draws card faces your way instead of the built-in face. */
  readonly renderFace?: CardFaceRenderer;
  /** Caps the device pixel ratio rendered at (default 2). */
  readonly maxPixelRatio?: number;
  /** Draws only the backdrop (gradient, glow, dust): the pack and cards are hidden and ignore input. For a menu or
   * title screen over the scene. */
  readonly backdropOnly?: boolean;
  readonly onEvent?: (event: RipEvent) => void;
}

/** A swipe has to cross this share of the pack's width to tear it all the way. */
const TEAR_SPAN = 0.8;
/** A revealed card dragged this far (card widths), or let go this fast (card widths per second), is sent away. */
const DISMISS_DISTANCE = 0.3;
const DISMISS_SPEED = 2.2;
/** A quick flick past this much of the commit point still tears it open. */
const FLICK_COMMIT_SHARE = 0.6;
const FLICK_SPEED_PX = 1500;

/**
 * A pack opening, drawn with three.js into a canvas inside `container`. Everything on screen is a pure function of
 * the rip's record and the clock (see timeline/ and pose/), so the same opener plays live, autoplays, scrubs and
 * replays. A host follows along through events (sounds, haptics), snapshots (its own prompts and buttons) and
 * frames (a scrub bar), and steers it with the methods below.
 */
export class PackOpener {
  readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(35, 1, 0.05, 100);
  private readonly raycaster = new Raycaster();
  private readonly background = new BackgroundView();
  private readonly dust = new DustView();
  private readonly packView: PackView;
  private readonly cardsView: CardsView;
  private readonly particles = new ParticlesView();
  /** The pack, cards and particles: everything but the backdrop. */
  private readonly foreground = new Group();
  private readonly gestures: GestureInput;
  private readonly resizeObserver: ResizeObserver;

  private pack: PackContents;
  private style: RipStyle;
  private rip: ResolvedRip;
  private record: RipRecord;
  private lastLive?: RipRecord;
  private mode: RipMode;
  private loop: boolean;
  private paused: boolean;
  private timeScale: number;
  private backdropOnly: boolean;
  private renderFace?: CardFaceRenderer;
  private readonly maxPixelRatio: number;
  private viewport: Viewport;
  private layout: Layout;
  private pointScale = 500;

  private time = 0;
  private firedUpTo = 0;
  private lastFrameAt?: number;
  private frameHandle = 0;
  private needsSync = true;
  private version = 0;
  private eventsCache?: { version: number; rip: ResolvedRip; list: TimedEvent[] };
  private snapshot: RipSnapshot;

  private dragKind?: "tear" | "card" | "inspect";
  private dragCard = -1;
  private readonly tilt = { x: 0, y: 0 };
  private hoverTilt = { x: 0, y: 0 };
  private inspectTilt = { x: 0, y: 0 };
  private deviceTilt?: { x: number; y: number };
  private orientationBase?: { beta: number; gamma: number };
  private orientationListener?: (event: DeviceOrientationEvent) => void;

  private readonly eventListeners = new Set<(event: RipEvent) => void>();
  private readonly snapshotListeners = new Set<() => void>();
  private readonly frameListeners = new Set<(time: number) => void>();
  private disposed = false;

  constructor(options: PackOpenerOptions) {
    this.container = options.container;
    this.pack = options.pack;
    this.style = options.ripStyle ?? DEFAULT_RIP_STYLE;
    this.mode = options.mode ?? "interactive";
    this.loop = options.loop ?? true;
    this.paused = options.paused ?? false;
    this.timeScale = options.timeScale ?? 1;
    this.backdropOnly = options.backdropOnly ?? false;
    this.renderFace = options.renderFace;
    this.maxPixelRatio = options.maxPixelRatio ?? 2;
    if (options.onEvent) this.eventListeners.add(options.onEvent);

    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      display: "block",
      width: "100%",
      height: "100%",
      touchAction: "none",
      userSelect: "none",
      webkitUserSelect: "none",
      outline: "none",
    });
    this.container.appendChild(this.canvas);
    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = SRGBColorSpace;

    this.packView = new PackView(this.requestSync);
    this.cardsView = new CardsView(this.requestSync);
    this.foreground.add(this.packView.root, this.cardsView.group, this.particles.points);
    this.foreground.visible = !this.backdropOnly;
    this.scene.add(this.background.mesh, this.dust.points, this.foreground);

    this.rip = resolveRip(this.pack, this.style);
    this.record = this.recordFor(this.mode);
    this.viewport = { width: 1, height: 1, insets: options.insets ?? NO_INSETS };
    this.layout = layoutOf(this.style, this.rip.cards.length, this.viewport);
    this.snapshot = snapshotAt(this.rip, this.record, 0);

    this.gestures = new GestureInput(this.canvas, {
      dragStart: (_x, _y, dx, dy) => this.onDragStart(dx, dy),
      dragMove: (_x, _y, dx, dy) => this.onDragMove(dx, dy),
      dragEnd: (vx, vy) => this.onDragEnd(vx, vy),
      tap: (x, y) => this.onTap(x, y),
      hover: (x, y, mouse) => {
        if (mouse) this.hoverTilt = { x: (x / this.viewport.width) * 2 - 1, y: (y / this.viewport.height) * 2 - 1 };
      },
      leave: () => {
        this.hoverTilt = { x: 0, y: 0 };
      },
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  // ---- What's going on ----

  get currentTime(): number {
    return this.time;
  }

  /** How long the rip on show runs (autoplay and replay); undefined while it's being played live. */
  get duration(): number | undefined {
    return this.mode === "interactive" ? undefined : recordDuration(this.rip, this.record);
  }

  get currentMode(): RipMode {
    return this.mode;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** The pack's cards in the order they come out (snapshots' and events' indices are into this). */
  get cards(): readonly PackCard[] {
    return this.rip.cards;
  }

  /** Whether there's a played rip to replay. */
  get canReplay(): boolean {
    return this.lastLive !== undefined || (this.mode === "interactive" && this.record.tears.length > 0);
  }

  readonly getSnapshot = (): RipSnapshot => this.snapshot;

  /** Calls `listener` whenever the snapshot changes. Returns the unsubscribe. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.snapshotListeners.add(listener);
    return () => {
      this.snapshotListeners.delete(listener);
    };
  };

  /** Calls `listener` with every beat of the rip as the clock passes it. Returns the unsubscribe. */
  onEvent(listener: (event: RipEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /** Calls `listener` with the clock every frame (for a scrub bar). Returns the unsubscribe. */
  onFrame(listener: (time: number) => void): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  /** A copy of everything that's happened in this rip: replay it, store it, send it. */
  getRecord(): RipRecord {
    return cloneRecord(this.record);
  }

  // ---- Settings ----

  setPack(pack: PackContents): void {
    if (pack === this.pack) return;
    this.pack = pack;
    this.rip = resolveRip(pack, this.style);
    this.lastLive = undefined;
    this.startOver();
  }

  setStyle(style: RipStyle): void {
    if (style === this.style) return;
    const before = this.rip.cards;
    this.style = style;
    this.rip = resolveRip(this.pack, style);
    const reordered = this.rip.cards.some((card, i) => card !== before[i]);
    if (this.mode === "autoplay") {
      this.record = autoplayRecord(this.rip);
      this.time = Math.min(this.time, this.duration ?? this.time);
      this.firedUpTo = this.time;
      this.changed();
    } else if (reordered) {
      this.lastLive = undefined;
      this.startOver();
    }
    this.needsSync = true;
  }

  setMode(mode: RipMode): void {
    if (mode === this.mode) return;
    this.keepLive();
    this.mode = mode;
    this.startOver();
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  play(): void {
    this.setPaused(false);
  }

  pause(): void {
    this.setPaused(true);
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  setBackdropOnly(backdropOnly: boolean): void {
    this.backdropOnly = backdropOnly;
    this.foreground.visible = !backdropOnly;
  }

  setInsets(insets: Insets): void {
    const now = this.viewport.insets;
    if (now.top === insets.top && now.right === insets.right && now.bottom === insets.bottom && now.left === insets.left) return;
    this.viewport = { ...this.viewport, insets };
    this.needsSync = true;
  }

  setRenderFace(renderFace: CardFaceRenderer | undefined): void {
    if (renderFace === this.renderFace) return;
    this.renderFace = renderFace;
    this.needsSync = true;
  }

  // ---- Control ----

  /** Starts this pack over (a replay or autoplay from its start). */
  restart(): void {
    this.keepLive();
    this.startOver();
  }

  /** Jumps to `time` (autoplay and replay only). */
  seek(time: number): void {
    if (this.mode === "interactive") return;
    this.time = clamp(time, 0, this.duration ?? time);
    this.firedUpTo = this.time;
    this.refreshSnapshot();
  }

  /** Plays back the last interactive rip exactly. Returns false if there isn't one. */
  replay(): boolean {
    this.keepLive();
    if (!this.lastLive) return false;
    this.mode = "replay";
    this.startOver();
    return true;
  }

  /** Tears the pack open as a tap would. Returns false unless it's waiting to be torn. */
  tear(): boolean {
    if (this.mode !== "interactive" || this.liveSnapshot().phase !== "ready") return false;
    this.record.tears.push({
      startedAt: this.time,
      fromRight: false,
      samples: [],
      releasedAt: this.time,
      releaseFrom: 0,
      settleS: this.rip.d.autoTear,
      committed: true,
    });
    this.scheduleOpen(this.time + this.rip.d.autoTear);
    return true;
  }

  /** Moves on from the revealed card (sending it `direction`, else the style's way). Returns false unless a card
   * is face up and waiting. */
  advance(direction?: Vec2): boolean {
    if (this.mode !== "interactive") return false;
    const snapshot = this.liveSnapshot();
    if (snapshot.phase !== "revealing" || !snapshot.cardRevealed) return false;
    const index = snapshot.cardIndex;
    if (index < this.rip.cards.length - 1) {
      const fallback = DISMISS_DIRECTIONS.of(this.style.reveal.dismissDirection).dir;
      const card = this.record.cards[index]!;
      card.dismissAt = this.time;
      card.dismissDir = normalize2(direction ?? fallback, fallback);
      this.record.cards[index + 1]!.presentAt = this.time + this.rip.d.nextDelay;
    } else {
      this.record.summaryAt = this.time;
    }
    this.changed();
    return true;
  }

  /** Skips the rest of the reveal straight to the summary. */
  skip(): boolean {
    if (this.mode !== "interactive") return false;
    const phase = this.liveSnapshot().phase;
    if (phase !== "opening" && phase !== "revealing") return false;
    this.record.summaryAt = this.time;
    this.changed();
    return true;
  }

  /** Brings card `index` up close in the summary. */
  focus(index: number): boolean {
    if (this.mode !== "interactive" || this.liveSnapshot().phase !== "summary" || !this.rip.cards[index]) return false;
    this.releaseFocus();
    this.record.focuses.push({ index, at: this.time });
    this.changed();
    return true;
  }

  unfocus(): void {
    if (this.releaseFocus()) this.changed();
  }

  /** Lets cards lean with the phone. On iOS this asks permission, so call it from a tap. */
  async enableDeviceTilt(): Promise<boolean> {
    const Orientation = (globalThis as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
      .DeviceOrientationEvent;
    if (!Orientation) return false;
    if (typeof Orientation.requestPermission === "function") {
      try {
        if ((await Orientation.requestPermission()) !== "granted") return false;
      } catch {
        return false;
      }
    }
    if (!this.orientationListener) {
      this.orientationListener = (event) => {
        if (event.beta === null || event.gamma === null) return;
        const base = (this.orientationBase ??= { beta: event.beta, gamma: event.gamma });
        base.beta += (event.beta - base.beta) * 0.01;
        base.gamma += (event.gamma - base.gamma) * 0.01;
        this.deviceTilt = {
          x: clamp((event.gamma - base.gamma) / 20, -1, 1),
          y: clamp((event.beta - base.beta) / 20, -1, 1),
        };
      };
      window.addEventListener("deviceorientation", this.orientationListener);
    }
    return true;
  }

  disableDeviceTilt(): void {
    if (this.orientationListener) window.removeEventListener("deviceorientation", this.orientationListener);
    this.orientationListener = undefined;
    this.orientationBase = undefined;
    this.deviceTilt = undefined;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameHandle);
    this.gestures.dispose();
    this.resizeObserver.disconnect();
    this.disableDeviceTilt();
    this.background.dispose();
    this.dust.dispose();
    this.packView.dispose();
    this.cardsView.dispose();
    this.particles.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
    this.eventListeners.clear();
    this.snapshotListeners.clear();
    this.frameListeners.clear();
  }

  // ---- Clock and drawing ----

  private readonly frame = (now: number) => {
    if (this.disposed) return;
    this.frameHandle = requestAnimationFrame(this.frame);
    const dt = this.lastFrameAt === undefined ? 0 : Math.min(0.1, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;
    if (!this.paused) this.advanceClock(dt * this.timeScale);
    if (this.needsSync) this.sync();
    const target = this.dragKind === "inspect" ? this.inspectTilt : (this.deviceTilt ?? this.hoverTilt);
    const k = 1 - Math.exp(-dt * 7);
    this.tilt.x += (target.x - this.tilt.x) * k;
    this.tilt.y += (target.y - this.tilt.y) * k;
    this.draw();
    for (const listener of this.frameListeners) listener(this.time);
  };

  private advanceClock(dt: number): void {
    this.time += dt;
    if (this.mode !== "interactive") {
      const end = this.duration ?? Infinity;
      if (this.time >= end) {
        if (this.loop) {
          this.fireUntil(end);
          this.time = 0;
          this.firedUpTo = 0;
        } else {
          this.time = end;
        }
      }
    } else {
      this.autoAdvance();
    }
    this.fireUntil(this.time);
    this.refreshSnapshot();
  }

  private draw(): void {
    const { rip, layout } = this;
    const pose = poseAt(rip, this.record, layout, this.time);
    const tease = this.teaseColor();
    this.camera.position.set(pose.shakeX, pose.shakeY, layout.cameraZ);
    this.camera.rotation.set(0, 0, pose.shakeRoll);

    const { width, height, insets } = this.viewport;
    const center = {
      x: (insets.left + (width - insets.left - insets.right) / 2) / width,
      y: 1 - (insets.top + (height - insets.top - insets.bottom) / 2) / height,
    };
    const glowColor = pose.glowIndex >= 0 ? rip.rarities[pose.glowIndex]!.color : tease;
    const flashColor = pose.flashIndex >= 0 ? mixHex(rip.rarities[pose.flashIndex]!.color, "#ffffff", 0.35) : "#ffffff";
    this.background.apply(this.style, pose.glow, glowColor, pose.flash, flashColor, width / height, center, this.time);
    this.dust.apply(this.style, layout, this.pointScale, this.time);
    if (!this.backdropOnly) {
      this.packView.apply(pose.pack, rip, this.tilt, tease, this.time);
      this.cardsView.apply(pose, rip, this.tilt, this.time);
      this.particles.apply(rip, this.record, layout, this.time, tease, this.pointScale);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private readonly requestSync = () => {
    this.needsSync = true;
  };

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.viewport = { ...this.viewport, width, height };
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
    this.renderer.setSize(width, height, false);
    this.needsSync = true;
  }

  private sync(): void {
    this.needsSync = false;
    this.layout = layoutOf(this.style, this.rip.cards.length, this.viewport);
    this.applyCamera();
    this.packView.sync(this.rip, this.layout);
    this.cardsView.sync(this.rip, this.layout, this.renderFace);
  }

  /** Frames the visible region: the camera sees the whole canvas, its lens shifted so the origin lands in the middle
   * of the region the host's insets leave. */
  private applyCamera(): void {
    const { width, height, insets } = this.viewport;
    const layout = this.layout;
    const fullHeight = height / layout.pxPerUnit;
    const fov = 2 * Math.atan(fullHeight / 2 / layout.cameraZ);
    this.camera.fov = (fov * 180) / Math.PI;
    this.camera.aspect = width / height;
    this.camera.near = 0.05;
    this.camera.far = layout.cameraZ + 30;
    this.camera.updateProjectionMatrix();
    const centerX = insets.left + (width - insets.left - insets.right) / 2;
    const centerY = insets.top + (height - insets.top - insets.bottom) / 2;
    const elements = this.camera.projectionMatrix.elements;
    elements[8] = -((2 * centerX) / width - 1);
    elements[9] = -(1 - (2 * centerY) / height);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    const buffer = this.renderer.getDrawingBufferSize(new Vector2());
    this.pointScale = buffer.y / (2 * Math.tan(fov / 2));
  }

  private teaseColor(): string {
    return this.style.tear.tease ? this.rip.best.color : this.style.pack.accent;
  }

  // ---- Record keeping ----

  private recordFor(mode: RipMode): RipRecord {
    if (mode === "autoplay") return autoplayRecord(this.rip);
    if (mode === "replay") return this.lastLive ? cloneRecord(this.lastLive) : autoplayRecord(this.rip);
    return emptyRecord(this.rip.cards.length);
  }

  private startOver(): void {
    this.record = this.recordFor(this.mode);
    this.time = 0;
    this.firedUpTo = 0;
    this.dragKind = undefined;
    this.changed();
    this.needsSync = true;
    this.refreshSnapshot();
  }

  /** Keeps the live rip for replay() if it got anywhere. */
  private keepLive(): void {
    if (this.mode === "interactive" && this.record.tears.length > 0) this.lastLive = cloneRecord(this.record);
  }

  private changed(): void {
    this.version++;
  }

  private events(): TimedEvent[] {
    const cache = this.eventsCache;
    if (cache && cache.version === this.version && cache.rip === this.rip) return cache.list;
    const list = eventsOf(this.rip, this.record);
    this.eventsCache = { version: this.version, rip: this.rip, list };
    return list;
  }

  private fireUntil(t: number): void {
    if (t <= this.firedUpTo) return;
    for (const { at, event } of this.events()) {
      if (at >= this.firedUpTo && at < t) this.emit(event);
    }
    this.firedUpTo = t;
  }

  private emit(event: RipEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("pack-opener: an event listener threw", error);
      }
    }
  }

  private liveSnapshot(): RipSnapshot {
    return snapshotAt(this.rip, this.record, this.time);
  }

  private refreshSnapshot(): void {
    const next = this.liveSnapshot();
    if (sameSnapshot(next, this.snapshot)) return;
    this.snapshot = next;
    for (const listener of this.snapshotListeners) listener();
  }

  private scheduleOpen(openedAt: number): void {
    if (this.rip.cards.length > 0) this.record.cards[0]!.presentAt = openedAt + this.rip.d.open;
    else this.record.summaryAt = openedAt + this.rip.d.open;
    this.changed();
  }

  private autoAdvance(): void {
    const after = this.rip.d.autoAdvance;
    if (after <= 0 || this.dragKind === "card") return;
    const snapshot = this.liveSnapshot();
    if (snapshot.phase !== "revealing" || !snapshot.cardRevealed) return;
    const times = cardTimesOf(this.rip, this.record, snapshot.cardIndex);
    if (times && this.time >= times.revealAt + after) this.advance();
  }

  private releaseFocus(): boolean {
    const open = this.record.focuses.findLast((focus) => focus.releasedAt === undefined);
    if (open) open.releasedAt = this.time;
    return open !== undefined;
  }

  private releaseTear(attempt: TearAttempt, progress: number, flicked = false): void {
    attempt.releasedAt = this.time;
    attempt.releaseFrom = progress;
    const commitAt = this.style.tear.commitAt;
    attempt.committed = progress >= commitAt || (flicked && progress >= commitAt * FLICK_COMMIT_SHARE);
    attempt.settleS = attempt.committed
      ? Math.max(0.06, this.rip.d.tearFinish * (1 - progress))
      : this.rip.d.springBack * Math.max(0.3, progress);
    if (attempt.committed) this.scheduleOpen(attempt.releasedAt + attempt.settleS);
    this.changed();
  }

  // ---- Input ----

  private get acceptsInput(): boolean {
    return this.mode === "interactive" && !this.paused && !this.backdropOnly;
  }

  private onDragStart(dx: number, dy: number): void {
    if (!this.acceptsInput) return;
    const snapshot = this.liveSnapshot();
    if (snapshot.phase === "ready" && TEAR_INPUTS.of(this.style.tear.input).swipe && Math.abs(dx) >= Math.abs(dy) * 0.6) {
      this.record.tears.push({
        startedAt: this.time,
        fromRight: dx < 0,
        samples: [{ t: this.time, p: 0 }],
        releaseFrom: 0,
        settleS: 0,
        committed: false,
      });
      this.dragKind = "tear";
      this.changed();
      this.onDragMove(dx, dy);
    } else if (snapshot.phase === "revealing" && snapshot.cardRevealed) {
      this.record.cards[snapshot.cardIndex]!.drags.push({ startedAt: this.time, samples: [{ t: this.time, x: 0, y: 0 }] });
      this.dragKind = "card";
      this.dragCard = snapshot.cardIndex;
      this.changed();
      this.onDragMove(dx, dy);
    } else if (snapshot.phase === "summary" && snapshot.focusIndex >= 0) {
      this.dragKind = "inspect";
      this.onDragMove(dx, dy);
    }
  }

  private onDragMove(dx: number, dy: number): void {
    if (this.dragKind === "tear") {
      const attempt = this.record.tears[this.record.tears.length - 1];
      if (!attempt || attempt.releasedAt !== undefined) return;
      const span = this.layout.packW * this.layout.packScale * this.layout.pxPerUnit * TEAR_SPAN;
      const progress = clamp01((attempt.fromRight ? -dx : dx) / span);
      const last = attempt.samples[attempt.samples.length - 1]!;
      if (progress > last.p) {
        const sample = { t: this.time, p: progress };
        if (last.t === this.time && attempt.samples.length > 1) attempt.samples[attempt.samples.length - 1] = sample;
        else attempt.samples.push(sample);
        this.changed();
      }
      if (progress >= 0.985) {
        this.releaseTear(attempt, progress);
        this.dragKind = undefined;
      }
    } else if (this.dragKind === "card") {
      const drag = this.record.cards[this.dragCard]?.drags.at(-1);
      if (!drag || drag.releasedAt !== undefined) return;
      const sample = { t: this.time, x: dx / this.layout.pxPerUnit, y: -dy / this.layout.pxPerUnit };
      const last = drag.samples[drag.samples.length - 1]!;
      if (last.t === this.time && drag.samples.length > 1) drag.samples[drag.samples.length - 1] = sample;
      else drag.samples.push(sample);
      this.changed();
    } else if (this.dragKind === "inspect") {
      this.inspectTilt = { x: clamp(dx / 140, -1, 1), y: clamp(dy / 140, -1, 1) };
    }
  }

  private onDragEnd(vx: number, vy: number): void {
    const kind = this.dragKind;
    this.dragKind = undefined;
    if (kind === "tear") {
      const attempt = this.record.tears[this.record.tears.length - 1];
      if (!attempt || attempt.releasedAt !== undefined) return;
      const progress = attempt.samples[attempt.samples.length - 1]?.p ?? 0;
      const along = attempt.fromRight ? -vx : vx;
      this.releaseTear(attempt, progress, along > FLICK_SPEED_PX);
    } else if (kind === "card") {
      const card = this.record.cards[this.dragCard];
      const drag = card?.drags.at(-1);
      if (!card || !drag || drag.releasedAt !== undefined) return;
      drag.releasedAt = this.time;
      const offset = drag.samples[drag.samples.length - 1]!;
      const speed = { x: vx / this.layout.pxPerUnit, y: -vy / this.layout.pxPerUnit };
      if (Math.hypot(offset.x, offset.y) > DISMISS_DISTANCE || Math.hypot(speed.x, speed.y) > DISMISS_SPEED) {
        this.advance({ x: offset.x + speed.x * 0.12, y: offset.y + speed.y * 0.12 });
      }
      this.changed();
    } else if (kind === "inspect") {
      this.inspectTilt = { x: 0, y: 0 };
    }
  }

  private onTap(x: number, y: number): void {
    if (!this.acceptsInput) return;
    const snapshot = this.liveSnapshot();
    if (snapshot.phase === "ready") {
      if (TEAR_INPUTS.of(this.style.tear.input).swipe) {
        this.record.nudges.push(this.time);
        this.changed();
      } else {
        this.tear();
      }
    } else if (snapshot.phase === "revealing") {
      if (snapshot.cardRevealed) this.advance();
    } else if (snapshot.phase === "summary" && snapshot.complete && this.style.reveal.inspect) {
      const hit = this.pickAt(x, y);
      if (hit >= 0 && hit !== snapshot.focusIndex) this.focus(hit);
      else this.unfocus();
    }
  }

  private pickAt(x: number, y: number): number {
    const ndc = new Vector2((x / this.viewport.width) * 2 - 1, -(y / this.viewport.height) * 2 + 1);
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.cardsView.pick(this.raycaster);
  }
}
