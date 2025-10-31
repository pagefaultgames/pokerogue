import { globalScene } from "#app/global-scene";
import { PokemonType } from "#enums/pokemon-type";
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
  private teraType: PokemonType;

  constructor(teraType: PokemonType) {
    super(
      "",
      `${PokemonType[teraType].toLowerCase()}_tera_shard`,
      (pokemon: PlayerPokemon) => {
        if (
          [pokemon.species.speciesId, pokemon.fusionSpecies?.speciesId].filter(
            s => s === SpeciesId.TERAPAGOS || s === SpeciesId.OGERPON || s === SpeciesId.SHEDINJA,
          ).length > 0
        ) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "tera_shard",
    );

    this.teraType = teraType;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.ChangeTeraTypeModifierType.name", {
      teraType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.teraType])}`),
    });
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.ChangeTeraTypeModifierType.description", {
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
} // todo: denest

export class TeraTypeRewardGenerator extends RewardGenerator {
  override generateReward(pregenArgs?: PokemonType) {
    if (pregenArgs !== undefined) {
      return new ChangeTeraTypeReward(pregenArgs[0]);
    }
    if (!globalScene.trainerItems.hasItem(TrainerItemId.TERA_ORB)) {
      return null;
    }

    const shardType = this.getTeraType();
    return new ChangeTeraTypeReward(shardType);
  }

  private getTeraType(): PokemonType {
    // If all party members have a given Tera Type, omit it from the pool
    const excludedType = globalScene.getPlayerParty().reduce((prevType, p) => {
      if (
        // Ignore Pokemon with fixed Tera Types
        p.hasSpecies(SpeciesId.TERAPAGOS)
        || p.hasSpecies(SpeciesId.OGERPON)
        || p.hasSpecies(SpeciesId.SHEDINJA)
      ) {
        return prevType;
      }
      return prevType === p.teraType ? prevType : PokemonType.UNKNOWN;
    }, PokemonType.UNKNOWN);

    const validTypes = getEnumValues(PokemonType).filter(t => t !== excludedType);
    // 1/64 chance for tera stellar
    return randSeedInt(64) ? randSeedItem(validTypes) : PokemonType.STELLAR;
  }
}
