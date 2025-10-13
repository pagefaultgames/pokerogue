import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { getStatKey, type PermanentStat, Stat } from "#enums/stat";
import { HeldItem } from "#items/held-item";
import type { BaseStatParams } from "#types/held-item-parameter";
import i18next from "i18next";

export const permanentStatToHeldItem = {
  [Stat.HP]: HeldItemId.HP_UP,
  [Stat.ATK]: HeldItemId.PROTEIN,
  [Stat.DEF]: HeldItemId.IRON,
  [Stat.SPATK]: HeldItemId.CALCIUM,
  [Stat.SPDEF]: HeldItemId.ZINC,
  [Stat.SPD]: HeldItemId.CARBOS,
} as const;

export const statBoostItems: Record<PermanentStat, string> = {
  [Stat.HP]: "hp_up",
  [Stat.ATK]: "protein",
  [Stat.DEF]: "iron",
  [Stat.SPATK]: "calcium",
  [Stat.SPDEF]: "zinc",
  [Stat.SPD]: "carbos",
};

export class BaseStatMultiplyHeldItem extends HeldItem<[typeof HeldItemEffect.BASE_STAT_MULTIPLY]> {
  public readonly effects = [HeldItemEffect.BASE_STAT_MULTIPLY] as const;
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
   * Applies the {@linkcode BaseStatModifier} to the specified {@linkcode Pokemon}.
   */
  public override apply(
    _effect: typeof HeldItemEffect.BASE_STAT_MULTIPLY,
    { pokemon, baseStats }: BaseStatParams,
  ): void {
    const stackCount = pokemon.heldItemManager.getAmount(this.type);
    const stat = this.stat;
    baseStats[stat] = Math.floor(baseStats[stat] * (1 + stackCount * 0.1));
  }
}
