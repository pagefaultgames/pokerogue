import type { ValueOf } from "type-fest";

export const CandyUpgradeNotificationMode = {
  OFF: 0,
  PASSIVES_ONLY: 1,
  ON: 2,
} as const;

export type CandyUpgradeNotificationMode = ValueOf<typeof CandyUpgradeNotificationMode>;
