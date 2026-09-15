import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { PreserveBerryParams } from "#types/trainer-item-parameter";

// Berry Pouch
export class PreserveBerryTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.PRESERVE_BERRY> {
  public override readonly effect = TrainerItemEffect.PRESERVE_BERRY;

  private readonly chance: number;

  /**
   * @param chance The chance one Berry Pouch has to preserve a berry. This is multiplicative.
   */
  constructor(chance: number) {
    super();
    this.chance = chance;
  }

  public override apply({ pokemon, doPreserve }: PreserveBerryParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    doPreserve.value ||= pokemon.randBattleSeedInt(this.chance) < stack * 3;
  }
}
