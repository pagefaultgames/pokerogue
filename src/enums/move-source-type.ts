/**
 * Used for challenge types that modify movesets, these denote the various sources of moves for pokemon.
 */
export enum MoveSourceType {
  LEVEL_UP, // Currently unimplemented for move access
  RELEARNER, // Relearner moves currently unimplemented
  COMMON_TM,
  GREAT_TM,
  ULTRA_TM,
  COMMON_EGG,
  RARE_EGG,
}
