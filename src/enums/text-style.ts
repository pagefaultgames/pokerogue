export const TextStyle = Object.freeze({
  MESSAGE: 1,
  WINDOW: 2,
  WINDOW_ALT: 3,
  BATTLE_INFO: 4,
  PARTY: 5,
  PARTY_RED: 6,
  SUMMARY: 7,
  SUMMARY_ALT: 8,
  SUMMARY_RED: 9,
  SUMMARY_BLUE: 10,
  SUMMARY_PINK: 11,
  SUMMARY_GOLD: 12,
  SUMMARY_GRAY: 13,
  SUMMARY_GREEN: 14,
  MONEY: 15, // Money default styling (pale yellow)
  /** Money displayed in Windows (needs different colors based on theme) */
  MONEY_WINDOW: 16,
  STATS_LABEL: 17,
  STATS_VALUE: 18,
  SETTINGS_VALUE: 19,
  SETTINGS_LABEL: 20,
  SETTINGS_SELECTED: 21,
  SETTINGS_LOCKED: 22,
  TOOLTIP_TITLE: 23,
  TOOLTIP_CONTENT: 24,
  MOVE_INFO_CONTENT: 25,
  MOVE_PP_FULL: 26,
  MOVE_PP_HALF_FULL: 27,
  MOVE_PP_NEAR_EMPTY: 28,
  MOVE_PP_EMPTY: 29,
  SMALLER_WINDOW_ALT: 30,
  BGM_BAR: 31,
  PERFECT_IV: 32,
  /** Default style for choices in ME */
  ME_OPTION_DEFAULT: 33,
  /** Style for choices with special requirements in ME */
  ME_OPTION_SPECIAL: 34,
  SHADOW_TEXT: 35

})
export type TextStyle = typeof TextStyle[keyof typeof TextStyle];