import { RewardId } from "#enums/reward-id";
import type { PlayerPokemon } from "#field/pokemon";
import { type PokemonFusionRewardParams, PokemonReward } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import i18next from "i18next";

export class FusePokemonReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (pokemon: PlayerPokemon) => {
      if (pokemon.isFusion()) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });
    this.id = RewardId.DNA_SPLICERS;
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.FusePokemonModifierType.description");
  }

  /**
   * Applies {@linkcode FusePokemonConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns always Promise<true>
   */
  apply({ pokemon, pokemon2 }: PokemonFusionRewardParams): boolean {
    pokemon.fuse(pokemon2);
    return true;
  }
}
