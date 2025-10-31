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

  constructor(localeKey: string, iconImage: string, id: RewardId, restorePoints: number) {
    super(
      localeKey,
      iconImage,
      id,
      (_pokemon: PlayerPokemon) => {
        return null;
      },
      (pokemonMove: PokemonMove) => {
        if (!pokemonMove.ppUsed) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "ether",
    );

    this.restorePoints = restorePoints;
  }

  get description(): string {
    return this.restorePoints > -1
      ? i18next.t("modifierType:ModifierType.PokemonPpRestoreModifierType.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("modifierType:ModifierType.PokemonPpRestoreModifierType.extra.fully");
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

  constructor(localeKey: string, iconImage: string, id: RewardId, restorePoints: number) {
    super(
      localeKey,
      iconImage,
      (pokemon: PlayerPokemon) => {
        if (pokemon.getMoveset().filter(m => m.ppUsed).length === 0) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "elixir",
    );

    this.restorePoints = restorePoints;
    this.id = id;
  }

  get description(): string {
    return this.restorePoints > -1
      ? i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreModifierType.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreModifierType.extra.fully");
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
