import type Pokemon from "#app/field/pokemon";
import { HeldItem, HELD_ITEM_EFFECT } from "../held-item";
import { Stat } from "#enums/stat";
import type { NumberHolder } from "#app/utils/common";
import i18next from "i18next";

export interface INCREMENTING_STAT_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  stat: Stat;
  statHolder: NumberHolder;
}

/**
 * Currently used by Macho Brace item
 */
export class IncrementingStatHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.INCREMENTING_STAT];
  public isTransferable = false;

  /**
   * Checks if the {@linkcode PokemonIncrementingStatModifier} should be applied to the {@linkcode Pokemon}.
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @param stat The affected {@linkcode Stat}
   * @param statHolder The {@linkcode NumberHolder} that holds the stat
   * @returns `true` if the {@linkcode PokemonBaseStatFlatModifier} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, stat?: Stat, statHolder?: NumberHolder): boolean {
  //    return super.shouldApply(pokemon, stat, statHolder) && !!statHolder;
  //  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE.name") + " (new)";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE.description");
  }

  /**
   * Applies the {@linkcode PokemonIncrementingStatModifier}
   * @param _pokemon The {@linkcode Pokemon} that holds the item
   * @param stat The affected {@linkcode Stat}
   * @param statHolder The {@linkcode NumberHolder} that holds the stat
   * @returns always `true`
   */
  apply(params: INCREMENTING_STAT_PARAMS): boolean {
    const pokemon = params.pokemon;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const statHolder = params.statHolder;

    // Modifies the passed in stat number holder by +2 per stack for HP, +1 per stack for other stats
    // If the Macho Brace is at max stacks (50), adds additional 10% to total HP and 5% to other stats
    const isHp = params.stat === Stat.HP;

    if (isHp) {
      statHolder.value += 2 * stackCount;
      if (stackCount === this.maxStackCount) {
        statHolder.value = Math.floor(statHolder.value * 1.1);
      }
    } else {
      statHolder.value += stackCount;
      if (stackCount === this.maxStackCount) {
        statHolder.value = Math.floor(statHolder.value * 1.05);
      }
    }

    return true;
  }
}
