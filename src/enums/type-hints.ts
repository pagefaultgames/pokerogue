/** Enum regulating the display mode of type effectiveness hints. */
export enum TypeHints {
  /** No hints. */
  OFF,
  /** Show hints for moves using the default colors. */
  ON,
  /**
   * Show hints for moves using a high-contrast palette (blue for super effective moves
   * instead of green), accessible to people with protanopia (red-green colorblindness).
   */
  HIGH_CONTRAST,
}
