import type { RewardId } from "#enums/reward-id";
import { PokemonMoveReward, type PokemonMoveRewardParams } from "#items/reward";
import type { PokemonMove } from "#moves/pokemon-move";
import { PartyUiHandler } from "#ui/party-ui-handler";
import i18next from "i18next";

export class PokemonPpUpReward extends PokemonMoveReward {
  protected upPoints: number;

  constructor(id: RewardId, localeKey: string, iconImage: string, upPoints: number) {
    super(id, { localeKey, iconName: iconImage });

    this.upPoints = upPoints;
  }

  override get description(): string {
    return i18next.t("reward:pokemonPpUp.description", { upPoints: this.upPoints });
  }

  protected override getMoveIneligibilityMessage(pokemonMove: PokemonMove): string | null {
    if (pokemonMove.getMove().pp < 5 || pokemonMove.ppUp >= 3 || pokemonMove.maxPpOverride) {
      return PartyUiHandler.NoEffectMessage;
    }
    return null;
  }

  /**
   * Applies {@linkcode PokemonPpUpConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that gets a pp up on move-slot {@linkcode moveIndex}
   * @returns
   */
  apply({ pokemon, moveIndex }: PokemonMoveRewardParams): boolean {
    const move = pokemon.getMoveset()[moveIndex];

    if (move && !move.maxPpOverride) {
      move.ppUp = Math.min(move.ppUp + this.upPoints, 3);
    }

    return true;
  }
}
