import { globalScene } from "#app/global-scene";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { Nature } from "#enums/nature";
import { RewardId } from "#enums/reward-id";
import { Stat } from "#enums/stat";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, type Reward, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { getEnumKeys, getEnumValues } from "#utils/enums";
import i18next from "i18next";

export class PokemonNatureChangeReward extends PokemonReward {
  public readonly nature: Nature;

  constructor(nature: Nature) {
    super(RewardId.MINT);
    this.nature = nature;
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

  get iconName(): string {
    const boostedStat = getEnumKeys(Stat).find(s => getNatureStatMultiplier(this.nature, Stat[s]) > 1);
    return `mint_${boostedStat?.toLowerCase() || "neutral"}`;
  }

  protected override getIneligibilityMessage(pokemon: PlayerPokemon): string | null {
    return pokemon.getNature() === this.nature ? PartyUiHandler.NoEffectMessage : null;
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
  public override getAllAvailableItems(): Nature[] {
    return getEnumValues(Nature);
  }

  protected override getEntry(reward: Reward): Nature | null {
    return reward instanceof PokemonNatureChangeReward ? reward.nature : null;
  }

  override generateReward(nature: Nature): PokemonNatureChangeReward {
    return new PokemonNatureChangeReward(nature);
  }
}
