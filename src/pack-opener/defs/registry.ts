/** What every variant in a registry has: a stable id (what a style stores) and a label (what a panel shows). */
export interface Def {
  readonly id: string;
  readonly label: string;
}

/** One pick in a choice lever. */
export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
}

/** A list of variants with lookup by id; an unknown id falls back to the first variant. */
export interface Registry<T extends Def> {
  readonly all: readonly T[];
  readonly options: readonly ChoiceOption[];
  of(id: string): T;
  has(id: string): boolean;
}

export function registry<T extends Def>(all: readonly T[]): Registry<T> {
  const byId = new Map(all.map((def) => [def.id, def] as const));
  return {
    all,
    options: all.map((def) => ({ value: def.id, label: def.label })),
    of: (id) => byId.get(id) ?? all[0]!,
    has: (id) => byId.has(id),
  };
}
