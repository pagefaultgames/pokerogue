import type { RewardId } from "#enums/reward-id";
import type { PlayerPokemon } from "#field/pokemon";
import {
  PokemonMoveReward,
  type PokemonMoveRewardParams,
  PokemonReward,
  type PokemonRewardParams,
} from "#items/reward";
import type { PokemonMove } from "#moves/pokemon-move";
import { PartyUiHandler } from "#ui/party-ui-handler";
import i18next from "i18next";

export class PokemonPpRestoreReward extends PokemonMoveReward {
  protected restorePoints: number;

  constructor(id: RewardId, localeKey: string, iconImage: string, restorePoints: number) {
    super(id, { localeKey, iconName: iconImage });

    this.restorePoints = restorePoints;
  }

  override get description(): string {
    return this.restorePoints > -1
      ? i18next.t("reward:pokemonPpRestore.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("reward:pokemonPpRestore.extra.fully");
  }

  protected override getMoveIneligibilityMessage(pokemonMove: PokemonMove): string | null {
    return pokemonMove.ppUsed ? null : PartyUiHandler.NoEffectMessage;
  }

  /**
   * Applies {@linkcode PokemonPpRestoreConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get move pp restored
   * @returns always `true`
   */
  apply({ pokemon, moveIndex }: PokemonMoveRewardParams): boolean {
    const move = pokemon.getMoveset()[moveIndex];

    if (move) {
      move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;
    }

    return true;
  }
}

export class PokemonAllMovePpRestoreReward extends PokemonReward {
  protected restorePoints: number;

  constructor(id: RewardId, localeKey: string, iconImage: string, restorePoints: number) {
    super(id, { localeKey, iconName: iconImage });

    this.restorePoints = restorePoints;
  }

  override get description(): string {
    return this.restorePoints > -1
      ? i18next.t("reward:pokemonAllMovePpRestore.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("reward:pokemonAllMovePpRestore.extra.fully");
  }

  protected override getIneligibilityMessage(pokemon: PlayerPokemon): string | null {
    return pokemon.getMoveset().some(m => m.ppUsed) ? null : PartyUiHandler.NoEffectMessage;
  }

  /**
   * Applies {@linkcode PokemonAllMovePpRestoreConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get all move pp restored
   * @returns always `true`
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    for (const move of pokemon.getMoveset()) {
      if (move) {
        move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;
      }
    }

    return true;
  }
}
