import type { Moves } from "#app/enums/moves";
import type { PlayerPokemon } from "#app/field/pokemon";
import { PokemonMove } from "#app/field/pokemon";
import { isNullOrUndefined } from "#app/utils/common";
import { EncounterPokemonRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { globalScene } from "#app/global-scene";

/**
 * {@linkcode CanLearnMoveRequirement} options
 */
export interface CanLearnMoveRequirementOptions {
  excludeLevelMoves?: boolean;
  excludeTmMoves?: boolean;
  excludeEggMoves?: boolean;
  includeFainted?: boolean;
  minNumberOfPokemon?: number;
  invertQuery?: boolean;
}

/**
 * Requires that a pokemon can learn a specific move/moveset.
 */
export class CanLearnMoveRequirement extends EncounterPokemonRequirement {
  private readonly requiredMoves: Moves[];
  private readonly excludeLevelMoves?: boolean;
  private readonly excludeTmMoves?: boolean;
  private readonly excludeEggMoves?: boolean;
  private readonly includeFainted?: boolean;

  constructor(requiredMoves: Moves | Moves[], options: CanLearnMoveRequirementOptions = {}) {
    super();
    this.requiredMoves = Array.isArray(requiredMoves) ? requiredMoves : [requiredMoves];

    this.excludeLevelMoves = options.excludeLevelMoves ?? false;
    this.excludeTmMoves = options.excludeTmMoves ?? false;
    this.excludeEggMoves = options.excludeEggMoves ?? false;
    this.includeFainted = options.includeFainted ?? false;
    this.minNumberOfPokemon = options.minNumberOfPokemon ?? 1;
    this.invertQuery = options.invertQuery ?? false;
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene
      .getPlayerParty()
      .filter(pkm => (this.includeFainted ? pkm.isAllowedInChallenge() : pkm.isAllowedInBattle()));

    if (isNullOrUndefined(partyPokemon) || this.requiredMoves?.length < 0) {
      return false;
    }

    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(pokemon =>
        // every required move should be included
        this.requiredMoves.every(requiredMove => this.getAllPokemonMoves(pokemon).includes(requiredMove)),
      );
    }
    return partyPokemon.filter(
      pokemon =>
        // none of the "required" moves should be included
        !this.requiredMoves.some(requiredMove => this.getAllPokemonMoves(pokemon).includes(requiredMove)),
    );
  }

  override getDialogueToken(__pokemon?: PlayerPokemon): [string, string] {
    return ["requiredMoves", this.requiredMoves.map(m => new PokemonMove(m).getName()).join(", ")];
  }

  private getPokemonLevelMoves(pkm: PlayerPokemon): Moves[] {
    return pkm.getLevelMoves().map(([_level, move]) => move);
  }

  private getAllPokemonMoves(pkm: PlayerPokemon): Moves[] {
    const allPokemonMoves: Moves[] = [];

    if (!this.excludeLevelMoves) {
      allPokemonMoves.push(...(this.getPokemonLevelMoves(pkm) ?? []));
    }

    if (!this.excludeTmMoves) {
      allPokemonMoves.push(...(pkm.compatibleTms ?? []));
    }

    if (!this.excludeEggMoves) {
      allPokemonMoves.push(...(pkm.getEggMoves() ?? []));
    }

    return allPokemonMoves;
  }
}
