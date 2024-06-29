import { VariantTier } from "#app/enums/variant-tier.js";

export type Variant = 0 | 1 | 2;

export type VariantSet = [Variant, Variant, Variant];

export const variantData: any = {};

export const variantColorCache = {};

export function getVariantTint(variant: Variant): integer {
  switch (variant) {
  case 0:
    return 0xf8c020;
  case 1:
    return 0x20f8f0;
  case 2:
    return 0xe81048;
  }
}

export function getVariantIcon(variant: Variant): integer {
  switch (variant) {
  case 0:
    return VariantTier.STANDARD;
  case 1:
    return VariantTier.RARE;
  case 2:
    return VariantTier.EPIC;
  }
}
