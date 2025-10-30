import { allMoves } from "#data/data-lists";
import { ChallengeType } from "#enums/challenge-type";
import { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder, toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Wrapper class for the {@linkcode Move} class for Pokemon to interact with.
 * These are the moves assigned to a {@linkcode Pokemon} object.
 * It links to {@linkcode Move} class via the move ID.
 * Compared to {@linkcode Move}, this class also tracks things like
 * PP Ups received, PP used, etc.
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
   * Checks whether this move can be performed by a Pokemon, without consideration for the move's targets.
   * The move is unusable if it is out of PP, restricted by an effect, or unimplemented.
   *
   * Should not be confused with {@linkcode isSelectable}, which only checks if the move can be selected by a Pokemon.
   *
   * @param pokemon - The {@linkcode Pokemon} attempting to use this move
   * @param ignorePp - Whether to ignore checking if the move is out of PP; default `false`
   * @param forSelection - Whether this is being checked for move selection; default `false`
   * @returns A tuple containing a boolean indicating whether the move can be selected, and a string with the reason if it cannot
   */
  public isUsable(pokemon: Pokemon, ignorePp = false, forSelection = false): [usable: boolean, preventionText: string] {
    const move = this.getMove();
    const moveName = move.name;

    // TODO: Add Sky Drop's 1 turn stall
    if (this.moveId === MoveId.NONE || move.name.endsWith(" (N)")) {
      return [false, i18next.t("battle:moveNotImplemented", moveName.replace(" (N)", ""))];
    }

    if (!ignorePp && move.pp !== -1 && this.ppUsed >= this.getMovePp()) {
      return [false, i18next.t("battle:moveNoPp", { moveName: move.name })];
    }

    if (forSelection) {
      const result = pokemon.isMoveSelectable(this.moveId);
      if (!result[0]) {
        return result;
      }
    }

    const usability = new BooleanHolder(true);
    if (pokemon.isPlayer() && applyChallenges(ChallengeType.POKEMON_MOVE, this.moveId, usability) && !usability.value) {
      return [false, i18next.t("battle:moveCannotUseChallenge", { moveName: move.name })];
    }

    return [true, ""];
  }

  getMove(): Move {
    return allMoves[this.moveId];
  }

  /**
   * Determine whether the move can be selected by the pokemon based on its own requirements
   * @remarks
   * Does not check for PP, moves blocked by challenges, or unimplemented moves, all of which are handled by {@linkcode isUsable}
   * @param pokemon - The Pokemon under consideration
   * @returns An tuple containing a boolean indicating whether the move can be selected, and a string with the reason if it cannot
   */
  public isSelectable(pokemon: Pokemon): [selectable: boolean, preventionText: string] {
    return pokemon.isMoveSelectable(this.moveId);
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
