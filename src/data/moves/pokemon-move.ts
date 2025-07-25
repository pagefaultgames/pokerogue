import { allMoves } from "#data/data-lists";
import type { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { toDmgValue } from "#utils/common";

/**
 * Wrapper class for the {@linkcode Move} class for Pokemon to interact with.
 * These are the moves assigned to a {@linkcode Pokemon} object.
 * It links to {@linkcode Move} class via the move ID.
 * Compared to {@linkcode Move}, this class also tracks things like
 * PP Ups recieved, PP used, etc.
 * @see {@linkcode isUsable} - checks if move is restricted, out of PP, or not implemented.
 * @see {@linkcode getMove} - returns {@linkcode Move} object by looking it up via ID.
 * @see {@linkcode usePp} - removes a point of PP from the move.
 * @see {@linkcode getMovePp} - returns amount of PP a move currently has.
 * @see {@linkcode getPpRatio} - returns the current PP amount / max PP amount.
 * @see {@linkcode getName} - returns name of {@linkcode Move}.
 */
export class PokemonMove {
  public moveId: MoveId;
  public ppUsed: number;
  public ppUp: number;

  /**
   * If defined and nonzero, overrides the maximum PP of the move (e.g., due to move being copied by Transform).
   * This also nullifies all effects of `ppUp`.
   */
  public maxPpOverride?: number;

  constructor(moveId: MoveId, ppUsed = 0, ppUp = 0, maxPpOverride?: number) {
    this.moveId = moveId;
    this.ppUsed = ppUsed;
    this.ppUp = ppUp;
    this.maxPpOverride = maxPpOverride;
  }

  /**
   * Checks whether this move can be selected/performed by a Pokemon, without consideration for the move's targets.
   * The move is unusable if it is out of PP, restricted by an effect, or unimplemented.
   *
   * @param pokemon - The {@linkcode Pokemon} attempting to use this move
   * @param ignorePp - Whether to ignore checking if the move is out of PP; default `false`
   * @param ignoreRestrictionTags - Whether to skip checks for {@linkcode MoveRestrictionBattlerTag}s; default `false`
   * @returns Whether this {@linkcode PokemonMove} can be selected by this Pokemon.
   */
  isUsable(pokemon: Pokemon, ignorePp = false, ignoreRestrictionTags = false): boolean {
    // TODO: Add Sky Drop's 1 turn stall
    if (this.moveId && !ignoreRestrictionTags && pokemon.isMoveRestricted(this.moveId, pokemon)) {
      return false;
    }

    if (this.getMove().name.endsWith(" (N)")) {
      return false;
    }

    return ignorePp || this.ppUsed < this.getMovePp() || this.getMove().pp === -1;
  }

  getMove(): Move {
    return allMoves[this.moveId];
  }

  /**
   * Sets {@link ppUsed} for this move and ensures the value does not exceed {@link getMovePp}
   * @param count Amount of PP to use
   */
  usePp(count = 1) {
    this.ppUsed = Math.min(this.ppUsed + count, this.getMovePp());
  }

  getMovePp(): number {
    return this.maxPpOverride || this.getMove().pp + this.ppUp * toDmgValue(this.getMove().pp / 5);
  }

  getPpRatio(): number {
    return 1 - this.ppUsed / this.getMovePp();
  }

  getName(): string {
    return this.getMove().name;
  }

  /**
   * Copies an existing move or creates a valid {@linkcode PokemonMove} object from json representing one
   * @param source The data for the move to copy; can be a {@linkcode PokemonMove} or JSON object representing one
   * @returns A valid {@linkcode PokemonMove} object
   */
  static loadMove(source: PokemonMove | any): PokemonMove {
    return new PokemonMove(source.moveId, source.ppUsed, source.ppUp, source.maxPpOverride);
  }
}
