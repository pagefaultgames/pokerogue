import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { PreserveBerryParams } from "#types/trainer-item-parameter";

// Berry Pouch
export class PreserveBerryTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.PRESERVE_BERRY> {
  public override readonly effect = TrainerItemEffect.PRESERVE_BERRY;

  public override apply({ pokemon, doPreserve }: PreserveBerryParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    doPreserve.value ||= pokemon.randBattleSeedInt(10) < stack * 3;
  }
}
