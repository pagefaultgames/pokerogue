import type Pokemon from "#app/field/pokemon";
import { HeldItems } from "#enums/held-items";
import { getStatKey, type PermanentStat, Stat } from "#enums/stat";
import i18next from "i18next";
import { HeldItem, ITEM_EFFECT } from "../held-item";

export interface BASE_STAT_BOOSTER_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  baseStats: number[];
}

interface PermanentStatToHeldItemMap {
  [key: number]: HeldItems;
}

export const permanentStatToHeldItem: PermanentStatToHeldItemMap = {
  [Stat.HP]: HeldItems.HP_UP,
  [Stat.ATK]: HeldItems.PROTEIN,
  [Stat.DEF]: HeldItems.IRON,
  [Stat.SPATK]: HeldItems.CALCIUM,
  [Stat.SPDEF]: HeldItems.ZINC,
  [Stat.SPD]: HeldItems.CARBOS,
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
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.BASE_STAT_BOOSTER];
  public stat: PermanentStat;

  constructor(type: HeldItems, maxStackCount = 1, stat: PermanentStat) {
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
   * @param _pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode Pokemon} should be modified
   */
  //  override shouldApply(_pokemon?: Pokemon, baseStats?: number[]): boolean {
  //      return super.shouldApply(_pokemon, baseStats) && Array.isArray(baseStats);
  //  }

  /**
   * Applies the {@linkcode BaseStatModifier} to the specified {@linkcode Pokemon}.
   * @param _pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns always `true`
   */
  apply(params: BASE_STAT_BOOSTER_PARAMS): boolean {
    const pokemon = params.pokemon;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const baseStats = params.baseStats;
    baseStats[this.stat] = Math.floor(baseStats[this.stat] * (1 + stackCount * 0.1));
    return true;
  }
}
