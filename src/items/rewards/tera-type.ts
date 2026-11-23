import { globalScene } from "#app/global-scene";
import { PokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { getEnumValues } from "#utils/enums";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

/** Species whose Tera type cannot be changed by Tera Shards. */
const TERA_LOCKED_SPECIES: readonly SpeciesId[] = [SpeciesId.TERAPAGOS, SpeciesId.OGERPON, SpeciesId.SHEDINJA];

/** Stellar shards are generated with a `1 / STELLAR_SHARD_ODDS` chance. */
const STELLAR_SHARD_ODDS = 64;

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

  /**
   * Return the deduplication match key for a Tera Shard.
   * @param teraType - The {@linkcode PokemonType} to build the key for
   */
  public static getVariantMatchKey(teraType: PokemonType): string {
    return `tera:${teraType}`;
  }

  override get matchKey(): string {
    return ChangeTeraTypeReward.getVariantMatchKey(this.teraType);
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
    return pokemon.teraType !== this.teraType && !TERA_LOCKED_SPECIES.some(s => pokemon.hasSpecies(s));
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
  /**
   * Get the Tera type shared by every eligible party member, if any.
   * Offering that type would be useless, so it is excluded from generation.
   */
  private getSharedPartyTeraType(): PokemonType | undefined {
    const teraTypes = globalScene
      .getPlayerParty()
      .filter(p => !TERA_LOCKED_SPECIES.some(s => p.hasSpecies(s)))
      .map(p => p.teraType);
    return teraTypes.length > 0 && teraTypes.every(t => t === teraTypes[0]) ? teraTypes[0] : undefined;
  }

  override getAvailableItems(exclusions?: ReadonlySet<string>): PokemonType[] {
    if (!globalScene.trainerItems.hasItem(TrainerItemId.TERA_ORB)) {
      return [];
    }

    const excludedType = this.getSharedPartyTeraType();
    return getEnumValues(PokemonType).filter(
      t =>
        t !== PokemonType.UNKNOWN && t !== excludedType && !exclusions?.has(ChangeTeraTypeReward.getVariantMatchKey(t)),
    );
  }

  /**
   * Stellar shards are rolled `1 / STELLAR_SHARD_ODDS` of the time; all other types are uniform.
   * Weighting Stellar by the number of other variants keeps its probability exact regardless of exclusions.
   */
  protected override getWeight(type: PokemonType, variants: readonly PokemonType[]): number {
    if (type === PokemonType.STELLAR) {
      return Math.max(variants.length - 1, 1);
    }
    return STELLAR_SHARD_ODDS - 1;
  }

  override generateReward(teraType: PokemonType): ChangeTeraTypeReward {
    return new ChangeTeraTypeReward(teraType);
  }
}
