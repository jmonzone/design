import { registry, type Def } from "./registry";

/** A typeface for the text printed on cards, wrappers and slab labels: system stacks only, so nothing loads. */
export interface CardFontDef extends Def {
  readonly family: string;
}

export const CARD_FONTS = registry<CardFontDef>([
  { id: "sans", label: "Sans", family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { id: "rounded", label: "Rounded", family: "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', system-ui, sans-serif" },
  { id: "serif", label: "Serif", family: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif" },
  { id: "condensed", label: "Condensed", family: "'Avenir Next Condensed', 'Arial Narrow', 'Roboto Condensed', sans-serif" },
  { id: "mono", label: "Mono", family: "ui-monospace, Menlo, Consolas, monospace" },
]);
