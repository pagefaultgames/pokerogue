import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import type { BerryType } from "#enums/berry-type";
import type { HeldItemId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { PermanentStat } from "#enums/stat";
import type { PlayerPokemon } from "#field/pokemon";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { berryTypeToHeldItem } from "#items/berry";
import { getNewAttackTypeBoosterHeldItem, getNewBerryHeldItem, getNewVitaminHeldItem } from "#items/held-item-pool";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import i18next from "i18next";

export class HeldItemReward extends PokemonReward {
  public itemId: HeldItemId;
  constructor(itemId: HeldItemId, group?: string, soundName?: string) {
    super(
      "",
      "",
      (pokemon: PlayerPokemon) => {
        const hasItem = pokemon.heldItemManager.hasItem(this.itemId);
        const maxStackCount = allHeldItems[this.itemId].getMaxStackCount();
        if (!maxStackCount) {
          return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.inoperable", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        if (hasItem && pokemon.heldItemManager.getAmount(this.itemId) === maxStackCount) {
          return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.tooMany", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        return null;
      },
      group,
      soundName,
    );
    this.itemId = itemId;
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

export class BerryRewardGenerator extends RewardGenerator {
  override generateReward(pregenArgs?: BerryType): HeldItemReward {
    if (pregenArgs !== undefined) {
      const item = berryTypeToHeldItem[pregenArgs];
      return new HeldItemReward(item);
    }
    const item = getNewBerryHeldItem();
    return new HeldItemReward(item);
  }
}

export class AttackTypeBoosterRewardGenerator extends RewardGenerator {
  override generateReward(pregenArgs?: PokemonType) {
    if (pregenArgs !== undefined) {
      const item = attackTypeToHeldItem[pregenArgs];
      return new HeldItemReward(item);
    }

    const item = getNewAttackTypeBoosterHeldItem(globalScene.getPlayerParty());

    return item ? new HeldItemReward(item) : null;
  }
}

export class BaseStatBoosterRewardGenerator extends RewardGenerator {
  override generateReward(pregenArgs?: PermanentStat) {
    if (pregenArgs !== undefined) {
      const item = permanentStatToHeldItem[pregenArgs];
      return new HeldItemReward(item);
    }
    return new HeldItemReward(getNewVitaminHeldItem());
  }
}
