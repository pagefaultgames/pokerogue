import { HeldItemId } from "#enums/held-item-id";
import { getStatKey, type PermanentStat, Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import i18next from "i18next";

export interface BaseStatBoosterParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The base stats of the {@linkcode pokemon} */
  baseStats: number[];
}

interface PermanentStatToHeldItemMap {
  [key: number]: HeldItemId;
}

export const permanentStatToHeldItem: PermanentStatToHeldItemMap = {
  [Stat.HP]: HeldItemId.HP_UP,
  [Stat.ATK]: HeldItemId.PROTEIN,
  [Stat.DEF]: HeldItemId.IRON,
  [Stat.SPATK]: HeldItemId.CALCIUM,
  [Stat.SPDEF]: HeldItemId.ZINC,
  [Stat.SPD]: HeldItemId.CARBOS,
};

export const statBoostItems: Record<PermanentStat, string> = {
  [Stat.HP]: "hp_up",
  [Stat.ATK]: "protein",
  [Stat.DEF]: "iron",
  [Stat.SPATK]: "calcium",
  [Stat.SPDEF]: "zinc",
  [Stat.SPD]: "carbos",
};

export class BaseStatBoosterHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.BASE_STAT_BOOSTER];
  public stat: PermanentStat;

  constructor(type: HeldItemId, maxStackCount: number, stat: PermanentStat) {
    super(type, maxStackCount);
    this.stat = stat;
  }

  get name(): string {
    return i18next.t(`modifierType:BaseStatBoosterItem.${statBoostItems[this.stat]}`);
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.BaseStatBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
    });
  }

  get iconName(): string {
    return statBoostItems[this.stat];
  }

  /**
   * Checks if {@linkcode BaseStatModifier} should be applied to the specified {@linkcode Pokemon}.
   * @param _pokemon - The {@linkcode Pokemon} to be modified
   * @param baseStats - The base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode Pokemon} should be modified
   */
  //  override shouldApply(_pokemon?: Pokemon, baseStats?: number[]): boolean {
  //      return super.shouldApply(_pokemon, baseStats) && Array.isArray(baseStats);
  //  }

  /**
   * Applies the {@linkcode BaseStatModifier} to the specified {@linkcode Pokemon}.
   */
  apply({ pokemon, baseStats }: BaseStatBoosterParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    baseStats[this.stat] = Math.floor(baseStats[this.stat] * (1 + stackCount * 0.1));
    return true;
  }
}
