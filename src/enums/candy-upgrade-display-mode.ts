import type { ValueOf } from "type-fest";

export const CandyUpgradeDisplayMode = {
  ICON: 0,
  ANIMATION: 1,
} as const;

export type CandyUpgradeDisplayMode = ValueOf<typeof CandyUpgradeDisplayMode>;
