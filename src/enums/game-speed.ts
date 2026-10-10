import type { ValueOf } from "type-fest";

export const GameSpeed = {
  SLOW: 2,
  NORMAL: 3,
  FAST: 4,
  TURBO: 5,
} as const;

export type GameSpeed = ValueOf<typeof GameSpeed>;
