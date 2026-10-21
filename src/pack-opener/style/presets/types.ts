import type { Def } from "../../defs/registry";
import type { DeepPartial, RipStyle } from "../types";

/** A named starting point: the levers it sets over DEFAULT_RIP_STYLE. */
export interface RipPreset extends Def {
  readonly description: string;
  readonly style: DeepPartial<RipStyle>;
}
