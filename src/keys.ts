import { useEffect, useRef } from "react";

/** A touch screen: its buttons don't show key badges. */
export const isTouchDevice =
  typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

type Handler = () => void;
interface Entry {
  id: number;
  handler: Handler;
  /** Makes this a hold binding: `handler` fires once on press (key repeat
   * ignored) and this on release. */
  onRelease?: Handler;
}
const _stacks = new Map<string, Entry[]>();
/** Hold bindings whose key is down right now, by key — released by the same
 * entry that was pressed, even if another binding was pushed over it since. */
const _held = new Map<string, Entry>();
let _nextId = 0;
let _listening = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  const stack = _stacks.get(e.key);
  const top = stack?.[stack.length - 1];
  if (!top) return;
  e.preventDefault();
  if (top.onRelease) {
    if (e.repeat || _held.has(e.key)) return;
    _held.set(e.key, top);
  }
  top.handler();
}

function onKeyUp(e: KeyboardEvent) {
  const entry = _held.get(e.key);
  if (!entry) return;
  _held.delete(e.key);
  entry.onRelease?.();
}

// A key held while the window loses focus never sends its keyup.
function releaseAll() {
  const held = [..._held.values()];
  _held.clear();
  held.forEach((entry) => entry.onRelease?.());
}

// On the first binding, not on import, so importing this has no side effects.
function listen() {
  if (_listening || typeof window === "undefined") return;
  _listening = true;
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseAll);
}

/** The app's key bindings, one stack per key: only the latest binding still
 * pushed for a key gets it, so a modal's Enter beats the screen's under it.
 * Button's hotkeys go through it too. */
export const KeyHandlerManager = {
  push(key: string, handler: Handler, onRelease?: Handler): number {
    listen();
    const id = _nextId++;
    if (!_stacks.has(key)) _stacks.set(key, []);
    _stacks.get(key)!.push({ id, handler, onRelease });
    return id;
  },
  pop(id: number): void {
    for (const [, stack] of _stacks) {
      const next = stack.filter((e) => e.id !== id);
      if (next.length !== stack.length) {
        stack.length = 0;
        stack.push(...next);
        return;
      }
    }
  },
};

/** Binds keys while mounted (and `enabled`). A key that also has an entry in
 * `options.releases` is a hold binding: its handler fires once on press, key
 * repeat ignored, and the release handler when it's let go. */
export function useKeyHandler(
  bindings: Partial<Record<string, () => void>>,
  options?: { enabled?: boolean; releases?: Partial<Record<string, () => void>> },
) {
  const enabled = options?.enabled ?? true;
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const releasesRef = useRef(options?.releases);
  releasesRef.current = options?.releases;

  const keysSig = Object.keys(bindings)
    .sort()
    .map((key) => (options?.releases?.[key] ? `${key}+` : key))
    .join("\0");

  useEffect(() => {
    if (!enabled) return;
    const keys = Object.keys(bindingsRef.current);
    const ids = keys.map((key) =>
      KeyHandlerManager.push(
        key,
        () => bindingsRef.current[key]?.(),
        releasesRef.current?.[key] ? () => releasesRef.current?.[key]?.() : undefined,
      ),
    );
    return () => ids.forEach((id) => KeyHandlerManager.pop(id));
  }, [enabled, keysSig]); // eslint-disable-line react-hooks/exhaustive-deps
}
