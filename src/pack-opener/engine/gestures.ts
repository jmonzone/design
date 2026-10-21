/** What the opener hears from the pointer, in CSS pixels relative to the canvas. */
export interface GestureHandlers {
  /** A press that has moved far enough to be a drag. `dx`/`dy` is how far it's moved so far. */
  dragStart(x: number, y: number, dx: number, dy: number): void;
  dragMove(x: number, y: number, dx: number, dy: number): void;
  /** Let go, with the pointer's speed over its last moments (pixels per second). */
  dragEnd(vx: number, vy: number): void;
  tap(x: number, y: number): void;
  /** Any pointer movement, pressed or not; `mouse` for a hovering mouse. */
  hover(x: number, y: number, mouse: boolean): void;
  leave(): void;
}

const DRAG_THRESHOLD_PX = 8;
const VELOCITY_WINDOW_MS = 100;

/** Turns one pointer at a time into taps and drags. */
export class GestureInput {
  private pointerId?: number;
  private startX = 0;
  private startY = 0;
  private dragging = false;
  private trail: { t: number; x: number; y: number }[] = [];

  constructor(
    private readonly element: HTMLElement,
    private readonly handlers: GestureHandlers,
  ) {
    element.addEventListener("pointerdown", this.down);
    element.addEventListener("pointermove", this.move);
    element.addEventListener("pointerup", this.up);
    element.addEventListener("pointercancel", this.cancel);
    element.addEventListener("pointerleave", this.leave);
  }

  private local(event: PointerEvent): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    const scaleX = rect.width > 0 ? this.element.clientWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? this.element.clientHeight / rect.height : 1;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  private readonly down = (event: PointerEvent) => {
    if (this.pointerId !== undefined || (event.pointerType === "mouse" && event.button !== 0)) return;
    const { x, y } = this.local(event);
    this.pointerId = event.pointerId;
    this.startX = x;
    this.startY = y;
    this.dragging = false;
    this.trail = [{ t: event.timeStamp, x, y }];
    this.element.setPointerCapture?.(event.pointerId);
  };

  private readonly move = (event: PointerEvent) => {
    const { x, y } = this.local(event);
    this.handlers.hover(x, y, event.pointerType === "mouse" && this.pointerId === undefined);
    if (event.pointerId !== this.pointerId) return;
    const dx = x - this.startX;
    const dy = y - this.startY;
    this.trail.push({ t: event.timeStamp, x, y });
    while (this.trail.length > 2 && event.timeStamp - this.trail[0]!.t > VELOCITY_WINDOW_MS) this.trail.shift();
    if (!this.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      this.dragging = true;
      this.handlers.dragStart(this.startX, this.startY, dx, dy);
    }
    if (this.dragging) this.handlers.dragMove(x, y, dx, dy);
  };

  private readonly up = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;
    const { x, y } = this.local(event);
    if (this.dragging) {
      const first = this.trail[0]!;
      const span = Math.max(1, event.timeStamp - first.t) / 1000;
      this.handlers.dragEnd((x - first.x) / span, (y - first.y) / span);
    } else {
      this.handlers.tap(x, y);
    }
    this.release(event.pointerId);
  };

  private readonly cancel = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;
    if (this.dragging) this.handlers.dragEnd(0, 0);
    this.release(event.pointerId);
  };

  private readonly leave = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && this.pointerId === undefined) this.handlers.leave();
  };

  private release(pointerId: number): void {
    if (this.element.hasPointerCapture?.(pointerId)) this.element.releasePointerCapture(pointerId);
    this.pointerId = undefined;
    this.dragging = false;
  }

  dispose(): void {
    this.element.removeEventListener("pointerdown", this.down);
    this.element.removeEventListener("pointermove", this.move);
    this.element.removeEventListener("pointerup", this.up);
    this.element.removeEventListener("pointercancel", this.cancel);
    this.element.removeEventListener("pointerleave", this.leave);
  }
}
