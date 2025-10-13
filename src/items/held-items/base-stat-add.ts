import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { DEFAULT_HELD_ITEM_FLAGS, HELD_ITEM_FLAG_TRANSFERABLE, HeldItem } from "#items/held-item";
import type { BaseStatParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Currently used by Old Gateau item
 */
export class OldGateauHeldItem extends HeldItem<[typeof HeldItemEffect.BASE_STAT_ADD]> {
  public readonly effects = [HeldItemEffect.BASE_STAT_ADD] as const;
  /**
   * Set of item flags for the held item
   * @defaultValue {@linkcode DEFAULT_HELD_ITEM_FLAGS} with {@linkcode HELD_ITEM_FLAG_TRANSFERABLE} removed
   */
  public flags = DEFAULT_HELD_ITEM_FLAGS & ~HELD_ITEM_FLAG_TRANSFERABLE;

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonBaseStatFlatModifierType.description");
  }

  public override apply(_effect: typeof HeldItemEffect.BASE_STAT_ADD, { pokemon, baseStats }: BaseStatParams): void {
    const stats = this.getStats(pokemon);
    const statModifier = 20;
    // Modifies the passed in baseStats[] array by a flat value, only if the stat is specified in this.stats
    baseStats.forEach((v, i) => {
      if (stats.includes(i)) {
        const newVal = Math.floor(v + statModifier);
        baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
      }
    });
  }

  /**
   * Get the lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef
   * @returns Array of 3 {@linkcode Stat}s to boost
   */
  private getStats(pokemon: Pokemon): [HpOrSpeed: Stat, AtkOrSpAtk: Stat, DefOrSpDef: Stat] {
    const baseStats = pokemon.getSpeciesForm().baseStats;
    return [
      baseStats[Stat.HP] < baseStats[Stat.SPD] ? Stat.HP : Stat.SPD,
      baseStats[Stat.ATK] < baseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK,
      baseStats[Stat.DEF] < baseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF,
    ];
  }
}

/**
 * Currently used by Shuckle Juice item
 */
export class ShuckleJuiceHeldItem extends HeldItem<[typeof HeldItemEffect.BASE_STAT_ADD]> {
  public readonly effects = [HeldItemEffect.BASE_STAT_ADD] as const;
  public flags = DEFAULT_HELD_ITEM_FLAGS & ~HELD_ITEM_FLAG_TRANSFERABLE;
  private readonly statModifier: number;

  constructor(type: HeldItemId, maxStackCount: number, statModifier: number) {
    super(type, maxStackCount);
    this.statModifier = statModifier;
  }

  override get name(): string {
    return i18next.t(
      this.statModifier > 0
        ? "modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.name"
        : "modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.name",
    );
  }

  // TODO: where is this description shown?
  override get description(): string {
    return i18next.t(
      this.statModifier > 0
        ? "modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.description"
        : "modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.description",
    );
  }

  override get iconName(): string {
    return this.statModifier > 0 ? "berry_juice_good" : "berry_juice_bad";
  }

  public override apply(_effect: typeof HeldItemEffect.BASE_STAT_ADD, { baseStats }: BaseStatParams): void {
    // Modifies the passed in baseStats[] array
    baseStats.forEach((v, i) => {
      // HP is affected by half as much as other stats
      const newVal = i === 0 ? Math.floor(v + this.statModifier / 2) : Math.floor(v + this.statModifier);
      baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
    });
  }
}
