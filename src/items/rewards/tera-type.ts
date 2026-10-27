import { globalScene } from "#app/global-scene";
import { PokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { randSeedInt, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

export class ChangeTeraTypeReward extends PokemonReward {
  public readonly teraType: PokemonType;

  constructor(teraType: PokemonType) {
    super(RewardId.TERA_SHARD, "", `${PokemonType[teraType].toLowerCase()}_tera_shard`, (pokemon: PlayerPokemon) => {
      if (
        [pokemon.species.speciesId, pokemon.fusionSpecies?.speciesId].filter(
          s => s === SpeciesId.TERAPAGOS || s === SpeciesId.OGERPON || s === SpeciesId.SHEDINJA,
        ).length > 0
      ) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });

    this.teraType = teraType;
  }

  override get matchKey(): string {
    return `tera:${this.teraType}`;
  }

  get name(): string {
    return i18next.t("reward:changeTeraType.name", {
      teraType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.teraType])}`),
    });
  }

  get description(): string {
    return i18next.t("reward:changeTeraType.description", {
      teraType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.teraType])}`),
    });
  }

  /**
   * Checks if {@linkcode TerrastalizeConsumable} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if the {@linkcode TerrastalizeConsumable} should be applied
   */
  shouldApply({ pokemon }: PokemonRewardParams): boolean {
    return (
      pokemon.teraType !== this.teraType
      && ![SpeciesId.SHEDINJA, SpeciesId.OGERPON, SpeciesId.TERAPAGOS].some(s => pokemon.hasSpecies(s))
    );
  }

  /**
   * Applies {@linkcode TerrastalizeConsumable}
   * @param pokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if hp was restored
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    pokemon.teraType = this.teraType;
    return true;
  }
}

export class TeraTypeRewardGenerator extends RewardGenerator<PokemonType> {
  override getAvailableItems(exclusions?: ReadonlySet<string>): PokemonType[] {
    if (!globalScene.trainerItems.hasItem(TrainerItemId.TERA_ORB)) {
      return [];
    }

    const excludedType = globalScene.getPlayerParty().reduce((prevType, p) => {
      if (p.hasSpecies(SpeciesId.TERAPAGOS) || p.hasSpecies(SpeciesId.OGERPON) || p.hasSpecies(SpeciesId.SHEDINJA)) {
        return prevType;
      }
      return prevType === p.teraType ? prevType : PokemonType.UNKNOWN;
    }, PokemonType.UNKNOWN);

    return getEnumValues(PokemonType).filter(t => t !== excludedType && !exclusions?.has(`tera:${t}`));
  }

  override generateReward(pregenArgs?: PokemonType): ChangeTeraTypeReward | null {
    if (pregenArgs !== undefined) {
      return new ChangeTeraTypeReward(pregenArgs);
    }
    const variants = this.getAvailableItems();
    if (variants.length === 0) {
      return null;
    }

    const shardType =
      randSeedInt(64) || !variants.includes(PokemonType.STELLAR) ? randSeedItem(variants) : PokemonType.STELLAR;
    return new ChangeTeraTypeReward(shardType);
  }
}
