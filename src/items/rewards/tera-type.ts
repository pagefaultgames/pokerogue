import { globalScene } from "#app/global-scene";
import { PokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, type Reward, RewardGenerator } from "#items/reward";
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
    super(RewardId.TERA_SHARD);
    this.teraType = teraType;
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

  get iconName(): string {
    return `${PokemonType[this.teraType].toLowerCase()}_tera_shard`;
  }

  protected override getIneligibilityMessage(pokemon: PlayerPokemon): string | null {
    return TERA_LOCKED_SPECIES.some(s => pokemon.hasSpecies(s)) ? PartyUiHandler.NoEffectMessage : null;
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

  public override getAllAvailableItems(): PokemonType[] {
    if (!globalScene.trainerItems.hasItem(TrainerItemId.TERA_ORB)) {
      return [];
    }

    const excludedType = this.getSharedPartyTeraType();
    return getEnumValues(PokemonType).filter(t => t !== PokemonType.UNKNOWN && t !== excludedType);
  }

  protected override getEntry(reward: Reward): PokemonType | null {
    return reward instanceof ChangeTeraTypeReward ? reward.teraType : null;
  }

  /**
   * Stellar shards are rolled `1 / STELLAR_SHARD_ODDS` of the time; all other types are uniform.
   * Weighting Stellar by the number of other entries keeps its probability exact regardless of exclusions.
   */
  protected override getWeight(type: PokemonType, entries: readonly PokemonType[]): number {
    if (type === PokemonType.STELLAR) {
      return Math.max(entries.length - 1, 1);
    }
    return STELLAR_SHARD_ODDS - 1;
  }

  override generateReward(teraType: PokemonType): ChangeTeraTypeReward {
    return new ChangeTeraTypeReward(teraType);
  }
}
