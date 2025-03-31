import { VariantTier } from "#app/enums/variant-tier";

export type Variant = 0 | 1 | 2;

export type VariantSet = [Variant, Variant, Variant];

export const variantData: any = {};

export const variantColorCache = {};

export function getVariantTint(variant: Variant): number {
  switch (variant) {
    case 0:
      return 0xf8c020;
    case 1:
      return 0x20f8f0;
    case 2:
      return 0xe81048;
  }
}

export function getVariantIcon(variant: Variant): number {
  switch (variant) {
    case 0:
      return VariantTier.STANDARD;
    case 1:
      return VariantTier.RARE;
    case 2:
      return VariantTier.EPIC;
  }
}

/** Delete all of the keys in variantData */
export function clearVariantData() {
  for (const key in variantData) {
    delete variantData[key];
  }
}

/** Update the variant data to use experiment sprite files for variants that have experimental sprites. */
export async function mergeExperimentalData(mainData: any, expData: any) {
  if (!expData) {
    return;
  }

  for (const key of Object.keys(expData)) {
    if (typeof expData[key] === "object" && !Array.isArray(expData[key])) {
      // If the value is an object, recursively merge.
      if (!mainData[key]) {
        mainData[key] = {};
      }
      this.mergeExperimentalData(mainData[key], expData[key]);
    } else {
      // Otherwise, replace the value
      mainData[key] = expData[key];
    }
  }
}
