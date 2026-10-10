import type { ValueOf } from "type-fest";

/** Defines the speed of hp-bar animations */
export const HpBarSpeed = {
  /** Unmodified animation speed */
  DEFAULT: 0,
  /** 2x speed */
  FAST: 1,
  /** 4x speed */
  FASTER: 2,
  /** Skip animation */
  SKIP: 3,
} as const;

export type HpBarSpeed = ValueOf<typeof HpBarSpeed>;
