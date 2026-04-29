import { HeldItemEffect } from "#enums/held-item-effect";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { HeldItemAttr } from "#items/held-item-attr";
import type { BaseStatParams } from "#types/held-item-parameter";

// TODO: Consider combining these 2 into a single base class for extensibility

const OLD_GATEAU_STAT_MODIFIER = 20;

/**
 * Class to add +20 base stats to the lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef.
 * Used for Old Gateau.
 * @sealed
 */
export class OldGateauHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.BASE_STAT_ADD> {
  public override readonly effect = HeldItemEffect.BASE_STAT_ADD;

  public override apply({ pokemon, baseStats }: BaseStatParams): void {
    const stats = this.getStats(pokemon);
    // TODO: This is inefficient and clunky
    baseStats.forEach((v, i) => {
      if (stats.includes(i)) {
        baseStats[i] = Phaser.Math.Clamp(v + OLD_GATEAU_STAT_MODIFIER, 1, 999999);
      }
    });
  }

  /**
   * Get the lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef
   * @returns Array of 3 {@linkcode Stat}s to boost
   */
  private getStats(pokemon: Pokemon): [hpOrSpd: Stat, atkOrSpAtk: Stat, defOrSpDef: Stat] {
    const baseStats = pokemon.getSpeciesForm().baseStats;
    return [
      baseStats[Stat.HP] < baseStats[Stat.SPD] ? Stat.HP : Stat.SPD,
      baseStats[Stat.ATK] < baseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK,
      baseStats[Stat.DEF] < baseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF,
    ];
  }
}

/**
 * Attribute for the Shuckle Juice mystery encounter items. \
 * Adds {@linkcode statModifier} to all base stats (HP gains half the modifier).
 */
export class ShuckleJuiceHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.BASE_STAT_ADD> {
  public override readonly effect = HeldItemEffect.BASE_STAT_ADD;
  public readonly statModifier: number;

  constructor(statModifier: number) {
    super();
    this.statModifier = statModifier;
  }

  public override apply({ baseStats }: BaseStatParams): void {
    baseStats.forEach((value, index) => {
      // HP is affected by half as much as other stats
      const mod = index === 0 ? this.statModifier / 2 : this.statModifier;
      const newVal = Math.floor(value + mod);
      baseStats[index] = Phaser.Math.Clamp(newVal, 1, 999999);
    });
  }
}
