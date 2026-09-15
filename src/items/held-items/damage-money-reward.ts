import { globalScene } from "#app/global-scene";
import { HeldItemEffect } from "#enums/held-item-effect";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { DamageMoneyRewardParams } from "#types/held-item-parameter";
import { ValueHolder } from "#utils/value-holder";

/**
 * Attribute used for held items that grant money based on damage dealt in battle.
 * Used for Golden Punch.
 * @sealed
 */
export class DamageMoneyRewardHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.DAMAGE_MONEY_REWARD> {
  public override readonly effect = HeldItemEffect.DAMAGE_MONEY_REWARD;

  private readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  public override apply({ pokemon, damage }: DamageMoneyRewardParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    const moneyAmount = new ValueHolder(Math.floor(damage * (this.value * stackCount)));
    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    globalScene.addMoney(moneyAmount.value);
  }
}
