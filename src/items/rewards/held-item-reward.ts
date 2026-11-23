import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import { type BerryItemId, berryItemIds, type HeldItemId } from "#enums/held-item-id";
import { PokemonType, type RegularPokemonType } from "#enums/pokemon-type";
import { PERMANENT_STATS, type PermanentStat } from "#enums/stat";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { getDefaultBerryWeight, getPartyAttackMoveTypeCounts } from "#items/held-item-pool";
import { PokemonReward, type PokemonRewardParams, type Reward, RewardGenerator } from "#items/reward";
import i18next from "i18next";

/**
 * Check whether a held item can currently be offered as a reward.
 * @param itemId - The item to check
 * @param party - The party that would receive the item
 * @returns `true` if at least one party member can hold another copy
 */
export function isHeldItemRewardAvailable(itemId: HeldItemId, party: readonly Pokemon[]): boolean {
  return party.some(p => !p.heldItemManager.isMaxStack(itemId));
}

/** A reward granting a single held item to a party member. */
export class HeldItemReward extends PokemonReward<HeldItemId> {
  constructor(itemId: HeldItemId) {
    super(itemId, { soundName: allHeldItems[itemId].soundName });
  }

  /**
   * The {@linkcode HeldItemId} granted by this reward.
   * @deprecated Alias of {@linkcode id}, kept until external callsites are migrated.
   */
  public get itemId(): HeldItemId {
    return this.id;
  }

  override get name(): string {
    return allHeldItems[this.id].name;
  }

  override get description(): string {
    return allHeldItems[this.id].description;
  }

  override get iconName(): string {
    return allHeldItems[this.id].iconName;
  }

  protected override getIneligibilityMessage(pokemon: PlayerPokemon): string | null {
    return pokemon.heldItemManager.isMaxStack(this.id)
      ? i18next.t("reward:pokemonHeldItem.extra.tooMany", { pokemonName: getPokemonNameWithAffix(pokemon) })
      : null;
  }

  public override equals(other: Reward): boolean {
    return other instanceof HeldItemReward && this.id === other.id;
  }

  override apply({ pokemon }: PokemonRewardParams): void {
    pokemon.heldItemManager.add(this.id);
  }
}

export class BerryRewardGenerator extends RewardGenerator<BerryItemId> {
  public override getAllAvailableItems(): BerryItemId[] {
    const party = globalScene.getPlayerParty();
    return berryItemIds.filter(item => isHeldItemRewardAvailable(item, party));
  }

  protected override getWeight(item: BerryItemId): number {
    return getDefaultBerryWeight(item);
  }

  override generateReward(item: BerryItemId): HeldItemReward {
    return new HeldItemReward(item);
  }
}

export class AttackTypeBoosterRewardGenerator extends RewardGenerator<RegularPokemonType> {
  public override getAllAvailableItems(): RegularPokemonType[] {
    const party = globalScene.getPlayerParty();
    const attackMoveTypeCounts = getPartyAttackMoveTypeCounts(party);
    const types: RegularPokemonType[] =
      attackMoveTypeCounts.size > 0 ? [...attackMoveTypeCounts.keys()] : [PokemonType.NORMAL];
    return types.filter(type => isHeldItemRewardAvailable(attackTypeToHeldItem[type], party));
  }

  /** Types with more attack moves in the party are weighted higher. */
  protected override getWeight(type: RegularPokemonType): number {
    return getPartyAttackMoveTypeCounts(globalScene.getPlayerParty()).get(type) ?? 1;
  }

  override generateReward(type: RegularPokemonType): HeldItemReward {
    return new HeldItemReward(attackTypeToHeldItem[type]);
  }
}

export class BaseStatBoosterRewardGenerator extends RewardGenerator<PermanentStat> {
  public override getAllAvailableItems(): PermanentStat[] {
    const party = globalScene.getPlayerParty();
    return PERMANENT_STATS.filter(stat => isHeldItemRewardAvailable(permanentStatToHeldItem[stat], party));
  }

  override generateReward(stat: PermanentStat): HeldItemReward {
    return new HeldItemReward(permanentStatToHeldItem[stat]);
  }
}
