import type { ValueOf } from "type-fest";

export const SpriteSet = {
  CONSISTENT: 0,
  EXPERIMENTAL: 1,
} as const;

export type SpriteSet = ValueOf<typeof SpriteSet>;
