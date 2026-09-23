import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { type PermanentStat, Stat } from "#enums/stat";
import { HeldItemAttr } from "#items/held-item-attr";
import type { BaseStatParams } from "#types/held-item-parameter";

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

  public override apply({ pokemon, baseStats }: BaseStatParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const { stat } = this;
    baseStats[stat] = Math.floor(baseStats[stat] * (1 + stackCount * 0.1));
  }
}
