import type { ValueOf } from "type-fest";

export const StatChangeSource = {
  STICKY_WEB: 1,
  MIRROR_ARMOR: 2,
  OPPORTUNIST: 3,
}

export type StatChangeSource = ValueOf<typeof StatChangeSource>;
