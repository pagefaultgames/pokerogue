export enum MoveFlags {
  NONE = 0,
  MAKES_CONTACT = 1 << 0,
  IGNORE_PROTECT = 1 << 1,
  /**
   * Sound-based moves have the following effects:
   * - Pokemon with the {@linkcode Abilities.SOUNDPROOF Soundproof Ability} are unaffected by other Pokemon's sound-based moves.
   * - Pokemon affected by {@linkcode Moves.THROAT_CHOP Throat Chop} cannot use sound-based moves for two turns.
   * - Sound-based moves used by a Pokemon with {@linkcode Abilities.LIQUID_VOICE Liquid Voice} become Water-type moves.
   * - Sound-based moves used by a Pokemon with {@linkcode Abilities.PUNK_ROCK Punk Rock} are boosted by 30%. Pokemon with Punk Rock also take half damage from sound-based moves.
   * - All sound-based moves (except Howl) can hit Pokemon behind an active {@linkcode Moves.SUBSTITUTE Substitute}.
   *
   * cf https://bulbapedia.bulbagarden.net/wiki/Sound-based_move
   */
  SOUND_BASED = 1 << 2,
  HIDE_USER = 1 << 3,
  HIDE_TARGET = 1 << 4,
  BITING_MOVE = 1 << 5,
  PULSE_MOVE = 1 << 6,
  PUNCHING_MOVE = 1 << 7,
  SLICING_MOVE = 1 << 8,
  /**
   * Indicates a move should be affected by {@linkcode Abilities.RECKLESS}
   * @see {@linkcode Move.recklessMove()}
   */
  RECKLESS_MOVE = 1 << 9,
  /** Indicates a move should be affected by {@linkcode Abilities.BULLETPROOF} */
  BALLBOMB_MOVE = 1 << 10,
  /** Grass types and pokemon with {@linkcode Abilities.OVERCOAT} are immune to powder moves */
  POWDER_MOVE = 1 << 11,
  /** Indicates a move should trigger {@linkcode Abilities.DANCER} */
  DANCE_MOVE = 1 << 12,
  /** Indicates a move should trigger {@linkcode Abilities.WIND_RIDER} */
  WIND_MOVE = 1 << 13,
  /** Indicates a move should trigger {@linkcode Abilities.TRIAGE} */
  TRIAGE_MOVE = 1 << 14,
  IGNORE_ABILITIES = 1 << 15,
  /** Enables all hits of a multi-hit move to be accuracy checked individually */
  CHECK_ALL_HITS = 1 << 16,
  /** Indicates a move is able to bypass its target's Substitute (if the target has one) */
  IGNORE_SUBSTITUTE = 1 << 17,
  /** Indicates a move is able to be redirected to allies in a double battle if the attacker faints */
  REDIRECT_COUNTER = 1 << 18,
  /** Indicates a move is able to be reflected by {@linkcode Abilities.MAGIC_BOUNCE} and {@linkcode Moves.MAGIC_COAT} */
  REFLECTABLE = 1 << 19
}
