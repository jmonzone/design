import { registry, type Def } from "./registry";

/** Where a card's foil catches the light: how strongly (0–1) in each region of the default face. */
export interface FoilAreaDef extends Def {
  readonly art: number;
  readonly frame: number;
  readonly text: number;
}

export const FOIL_AREAS = registry<FoilAreaDef>([
  { id: "art", label: "Art window", art: 1, frame: 0, text: 0 },
  { id: "frame", label: "Frame", art: 0, frame: 1, text: 0.15 },
  { id: "full", label: "Full card", art: 1, frame: 1, text: 0.45 },
]);
