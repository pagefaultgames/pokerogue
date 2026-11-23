import { globalScene } from "#app/global-scene";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { Nature } from "#enums/nature";
import { RewardId } from "#enums/reward-id";
import { Stat } from "#enums/stat";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { getEnumKeys, getEnumValues } from "#utils/enums";
import i18next from "i18next";

export class PokemonNatureChangeReward extends PokemonReward {
  protected nature: Nature;

  constructor(nature: Nature) {
    super(
      RewardId.MINT,
      "",
      `mint_${
        getEnumKeys(Stat)
          .find(s => getNatureStatMultiplier(nature, Stat[s]) > 1)
          ?.toLowerCase() || "neutral"
      }`,
      (pokemon: PlayerPokemon) => {
        if (pokemon.getNature() === this.nature) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
    );

    this.nature = nature;
  }

  /**
   * Return the deduplication match key for a mint.
   * @param nature - The {@linkcode Nature} to build the key for
   */
  public static getVariantMatchKey(nature: Nature): string {
    return `mint:${nature}`;
  }

  override get matchKey(): string {
    return PokemonNatureChangeReward.getVariantMatchKey(this.nature);
  }

  get name(): string {
    return i18next.t("reward:pokemonNatureChange.name", {
      natureName: getNatureName(this.nature),
    });
  }

  get description(): string {
    return i18next.t("reward:pokemonNatureChange.description", {
      natureName: getNatureName(this.nature, true, true, true),
    });
  }

  /**
   * Applies {@linkcode PokemonNatureChangeConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} to apply the {@linkcode Nature} change to
   * @returns
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    pokemon.setCustomNature(this.nature);
    globalScene.gameData.unlockSpeciesNature(pokemon.species, this.nature);

    return true;
  }
}

export class MintRewardGenerator extends RewardGenerator<Nature> {
  override getAvailableItems(exclusions?: ReadonlySet<string>): Nature[] {
    return getEnumValues(Nature).filter(
      nature => !exclusions?.has(PokemonNatureChangeReward.getVariantMatchKey(nature)),
    );
  }

  override generateReward(nature: Nature): PokemonNatureChangeReward {
    return new PokemonNatureChangeReward(nature);
  }
}
