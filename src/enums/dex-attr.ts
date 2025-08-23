import type { ObjectValues } from "#types/type-helpers";

export const DexAttr = Object.freeze({
  NON_SHINY: 1n,
  SHINY: 2n,
  MALE: 4n,
  FEMALE: 8n,
  DEFAULT_VARIANT: 16n,
  VARIANT_2: 32n,
  VARIANT_3: 64n,
  DEFAULT_FORM: 128n,
});
export type DexAttr = ObjectValues<typeof DexAttr>;
