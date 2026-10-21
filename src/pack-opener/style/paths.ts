/** A value inside a style (or anything) by its dotted path, e.g. "rarities.rare.glow"; undefined if it isn't there. */
export function getAtPath(obj: unknown, path: string): unknown {
  let node: unknown = obj;
  for (const key of path.split(".")) {
    if (!isPlainObject(node)) return undefined;
    node = node[key];
  }
  return node;
}

/** A copy of `obj` with the value at `path` replaced (and every object along the way copied, nothing else). */
export function setAtPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const set = (node: unknown, i: number): unknown => {
    const base = isPlainObject(node) ? node : {};
    const key = keys[i]!;
    return { ...base, [key]: i === keys.length - 1 ? value : set(base[key], i + 1) };
  };
  return set(obj, 0) as T;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
