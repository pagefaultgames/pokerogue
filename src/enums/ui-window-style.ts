import type { ValueOf } from "type-fest";

export const UiWindowStyle = {
  /** #c73625 */
  RED_ORANGE: 1,
  /** #20B098 */
  TEAL: 2,
  /** #d7d7d7 */
  LIGHT_GRAY: 3,
  /**
   * Also known as vivid orange-yellow \
   * #ffb745
   */
  GOLDENROD: 4,
  /** #b2b2b2 */
  MEDIUM_GRAY: 5,
} as const;

export type UiWindowStyle = ValueOf<typeof UiWindowStyle>;
