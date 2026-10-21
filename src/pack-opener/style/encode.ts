import { DEFAULT_RIP_STYLE } from "./defaults";
import { allLeversOf } from "./levers";
import { getAtPath, setAtPath } from "./paths";
import { sanitizeStyle } from "./sanitize";
import type { DeepPartial, RipStyle } from "./types";

/** Only the levers where `style` differs from `base`, nested as a style is. */
export function styleDiff(style: RipStyle, base: RipStyle = DEFAULT_RIP_STYLE): DeepPartial<RipStyle> {
  let diff: DeepPartial<RipStyle> = {};
  for (const lever of allLeversOf(style)) {
    const value = getAtPath(style, lever.path);
    if (value !== getAtPath(base, lever.path)) diff = setAtPath(diff, lever.path, value);
  }
  return diff;
}

/**
 * A style as a short URL-safe string: its differences from `base`, as JSON, base64url-encoded. Empty when it
 * matches `base`. What a share link carries: tune on one site, paste into another.
 */
export function encodeStyle(style: RipStyle, base: RipStyle = DEFAULT_RIP_STYLE): string {
  const diff = styleDiff(style, base);
  return Object.keys(diff).length === 0 ? "" : toBase64Url(JSON.stringify(diff));
}

/** The style an encodeStyle string describes, over `base` and checked lever by lever; undefined if it's garbled. */
export function decodeStyle(code: string, base: RipStyle = DEFAULT_RIP_STYLE): RipStyle | undefined {
  if (code === "") return base;
  try {
    return sanitizeStyle(JSON.parse(fromBase64Url(code)), base);
  } catch {
    return undefined;
  }
}

function toBase64Url(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "===".slice((base64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}
