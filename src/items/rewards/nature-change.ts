import { globalScene } from "#app/global-scene";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { Nature } from "#enums/nature";
import { RewardId } from "#enums/reward-id";
import { Stat } from "#enums/stat";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { randSeedItem } from "#utils/common";
import { getEnumKeys, getEnumValues } from "#utils/enums";
import i18next from "i18next";

export class PokemonNatureChangeReward extends PokemonReward {
  protected nature: Nature;

  constructor(nature: Nature) {
    super(
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
      "mint",
    );

    this.nature = nature;
    this.id = RewardId.MINT;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeModifierType.name", {
      natureName: getNatureName(this.nature),
    });
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeModifierType.description", {
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

export class MintRewardGenerator extends RewardGenerator {
  override generateReward(pregenArgs?: Nature) {
    if (pregenArgs !== undefined) {
      return new PokemonNatureChangeReward(pregenArgs);
    }
    return new PokemonNatureChangeReward(randSeedItem(getEnumValues(Nature)));
  }
}
