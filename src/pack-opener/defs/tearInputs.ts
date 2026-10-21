import { registry, type Def } from "./registry";

/** How the player tears the pack open, and the prompt a host can show for it. */
export interface TearInputDef extends Def {
  /** The tear follows a finger dragged across the pack; a tap only nudges it. Otherwise a tap tears it. */
  readonly swipe: boolean;
  readonly hint: string;
}

export const TEAR_INPUTS = registry<TearInputDef>([
  { id: "swipe", label: "Swipe", swipe: true, hint: "Swipe across the pack to tear it open" },
  { id: "tap", label: "Tap", swipe: false, hint: "Tap the pack to open it" },
]);
