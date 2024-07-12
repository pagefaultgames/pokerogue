import BattleScene from "#app/battle-scene.js";
import { Moves } from "#app/enums/moves.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { isNullOrUndefined } from "#app/utils.js";
import { EncounterPokemonRequirement } from "../mystery-encounter-requirements";

/**
 * {@linkcode CanLearnMoveRequirement} options
 */
export interface CanlearnMoveRequirementOptions {
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

  constructor(
    requiredMoves: Moves | Moves[],
    options: CanlearnMoveRequirementOptions = {}
  ) {
    super();
    this.requiredMoves = Array.isArray(requiredMoves)
      ? requiredMoves
      : [requiredMoves];

    const {
      excludeLevelMoves,
      excludeTmMoves,
      excludeEggMoves,
      includeFainted,
      minNumberOfPokemon,
      invertQuery,
    } = options;

    this.excludeLevelMoves = excludeLevelMoves ?? false;
    this.excludeTmMoves = excludeTmMoves ?? false;
    this.excludeEggMoves = excludeEggMoves ?? false;
    this.includeFainted = includeFainted ?? false;
    this.minNumberOfPokemon = minNumberOfPokemon ?? 1;
    this.invertQuery = invertQuery;
  }

  override meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene
      .getParty()
      .filter((pkm) =>
        this.includeFainted ? pkm.isAllowed() : pkm.isAllowedInBattle()
      );

    if (isNullOrUndefined(partyPokemon) || this?.requiredMoves?.length < 0) {
      return false;
    }

    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) =>
        // every required move should be included
        this.requiredMoves.every((requiredMove) =>
          this.getAllPokemonMoves(pokemon).includes(requiredMove)
        )
      );
    } else {
      return partyPokemon.filter(
        (pokemon) =>
          // none of the "required" moves should be included
          !this.requiredMoves.some((requiredMove) =>
            this.getAllPokemonMoves(pokemon).includes(requiredMove)
          )
      );
    }
  }

  override getDialogueToken(
    _scene: BattleScene,
    _pokemon?: PlayerPokemon
  ): [string, string] {
    return ["requiredMoves", this.requiredMoves.join(", ")];
  }

  private getPokemonLevelMoves(pkm: PlayerPokemon): Moves[] {
    return pkm.getLevelMoves().map(([_level, move]) => move);
  }

  private getAllPokemonMoves(pkm: PlayerPokemon): Moves[] {
    const allPokemonMoves: Moves[] = [];

    if (!this.excludeLevelMoves) {
      allPokemonMoves.push(...this.getPokemonLevelMoves(pkm));
    }

    if (!this.excludeTmMoves) {
      allPokemonMoves.push(...pkm.compatibleTms);
    }

    if (!this.excludeEggMoves) {
      allPokemonMoves.push(...pkm.getEggMoves());
    }

    return allPokemonMoves;
  }
}
