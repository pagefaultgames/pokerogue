import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import { type BerryItemId, berryItemIds, HeldItemId } from "#enums/held-item-id";
import { PokemonType, type RegularPokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { PERMANENT_STATS, type PermanentStat } from "#enums/stat";
import type { PlayerPokemon } from "#field/pokemon";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { getNewAttackTypeBoosterHeldItem, getNewBerryHeldItem, getNewVitaminHeldItem } from "#items/held-item-pool";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import i18next from "i18next";

export class HeldItemReward extends PokemonReward {
  public itemId: HeldItemId;
  constructor(id: RewardId, itemId: HeldItemId, soundName?: string | undefined) {
    super(
      id,
      "",
      "",
      (pokemon: PlayerPokemon) => {
        const hasItem = pokemon.heldItemManager.hasItem(this.itemId);
        const maxStackCount = allHeldItems[this.itemId].maxStackCount;
        if (!maxStackCount) {
          return i18next.t("reward:pokemonHeldItem.extra.inoperable", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        if (hasItem && pokemon.heldItemManager.getStack(this.itemId) === maxStackCount) {
          return i18next.t("reward:pokemonHeldItem.extra.tooMany", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        return null;
      },
      soundName,
    );
    this.itemId = itemId;
  }

  /**
   * Return the deduplication match key for a held item ID.
   * @param itemId - Held item ID
   * @returns Match key string
   */
  public static getItemMatchKey(itemId: HeldItemId): string {
    return `held:${itemId}`;
  }

  override get matchKey(): string {
    return HeldItemReward.getItemMatchKey(this.itemId);
  }

  get name(): string {
    return allHeldItems[this.itemId].name;
  }

  get description(): string {
    return allHeldItems[this.itemId].description;
  }

  get iconName(): string {
    return allHeldItems[this.itemId].iconName;
  }

  apply({ pokemon }: PokemonRewardParams): boolean {
    return pokemon.heldItemManager.add(this.itemId);
  }
}

export class BerryRewardGenerator extends RewardGenerator<BerryItemId> {
  override getAvailableItems(exclusions?: ReadonlySet<string>): BerryItemId[] {
    const party = globalScene.getPlayerParty();
    return berryItemIds.filter(item => {
      if (exclusions?.has(`held:${item}`)) {
        return false;
      }
      return party.some(p => !p.heldItemManager.isMaxStack(item));
    });
  }

  override generateReward(pregenArgs?: BerryItemId): HeldItemReward {
    if (pregenArgs !== undefined) {
      return new HeldItemReward(RewardId.BERRY, pregenArgs);
    }
    const variants = this.getAvailableItems();
    const customWeights: Record<number, number> = {};
    for (const item of variants) {
      const isPreferred =
        item === HeldItemId.SITRUS_BERRY || item === HeldItemId.LUM_BERRY || item === HeldItemId.LEPPA_BERRY;
      customWeights[item] = isPreferred ? 2 : 1;
    }
    return new HeldItemReward(RewardId.BERRY, getNewBerryHeldItem(customWeights));
  }
}

export class AttackTypeBoosterRewardGenerator extends RewardGenerator<PokemonType> {
  override getAvailableItems(exclusions?: ReadonlySet<string>): PokemonType[] {
    const party = globalScene.getPlayerParty();
    const attackMoveTypes = party
      .values()
      .flatMap(p =>
        p
          .getMoveset()
          .filter(pm => pm.getMove().is("AttackMove"))
          .map(pm => p.getMoveType(pm.getMove()))
          .filter((type): type is RegularPokemonType => type !== PokemonType.UNKNOWN && type !== PokemonType.STELLAR),
      )
      .toArray();

    const uniqueTypes = [...new Set(attackMoveTypes.length > 0 ? attackMoveTypes : [PokemonType.NORMAL])];
    return uniqueTypes.filter(type => {
      const item = attackTypeToHeldItem[type];
      return !exclusions?.has(`held:${item}`) && party.some(p => !p.heldItemManager.isMaxStack(item));
    });
  }

  override generateReward(pregenArgs?: PokemonType): HeldItemReward {
    if (pregenArgs !== undefined) {
      const item = attackTypeToHeldItem[pregenArgs];
      return new HeldItemReward(RewardId.ATTACK_TYPE_BOOSTER, item);
    }
    const item = getNewAttackTypeBoosterHeldItem(undefined, globalScene.getPlayerParty());
    return new HeldItemReward(RewardId.ATTACK_TYPE_BOOSTER, item);
  }
}

export class BaseStatBoosterRewardGenerator extends RewardGenerator<PermanentStat> {
  override getAvailableItems(exclusions?: ReadonlySet<string>): PermanentStat[] {
    const party = globalScene.getPlayerParty();
    return PERMANENT_STATS.filter(stat => {
      const item = permanentStatToHeldItem[stat];
      return !exclusions?.has(`held:${item}`) && party.some(p => !p.heldItemManager.isMaxStack(item));
    });
  }

  override generateReward(pregenArgs?: PermanentStat): HeldItemReward {
    if (pregenArgs !== undefined) {
      const item = permanentStatToHeldItem[pregenArgs];
      return new HeldItemReward(RewardId.VITAMIN, item);
    }
    return new HeldItemReward(RewardId.VITAMIN, getNewVitaminHeldItem());
  }
}
