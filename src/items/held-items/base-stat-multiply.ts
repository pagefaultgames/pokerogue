import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { getStatKey, type PermanentStat, Stat } from "#enums/stat";
import { HeldItemAttr } from "#items/held-item-attr";
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

/**
 * Class used for items that multiply a given base stat.
 * Used for the various Vitamin items.
 */
export class BaseStatMultiplyHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.BASE_STAT_MULTIPLY> {
  public override readonly effect = HeldItemEffect.BASE_STAT_MULTIPLY;
  /** The {@linkcode PermanentStat} to boost. */
  private readonly stat: PermanentStat;

  constructor(stat: PermanentStat) {
    super();
    this.stat = stat;
  }

  // TODO: Move to builder
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

  public override apply({ pokemon, baseStats }: BaseStatParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const { stat } = this;
    baseStats[stat] = Math.floor(baseStats[stat] * (1 + stackCount * 0.1));
  }
}
