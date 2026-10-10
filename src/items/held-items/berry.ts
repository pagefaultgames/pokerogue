import { globalScene } from "#app/global-scene";
import { getBerryEffectFunc, getBerryPredicate } from "#data/berry";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { BerryItemId } from "#enums/held-item-id";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { BerryUsedEvent } from "#events/battle-scene";
import { ConsumableHeldItemAttr } from "#items/held-item-attr";
import type { BerryParams } from "#types/held-item-parameter";
import { BooleanHolder } from "#utils/common";

// TODO: Split up the berry effect into multiple ones if/when berry phase is reworked
export class BerryHeldItemAttr extends ConsumableHeldItemAttr<typeof HeldItemEffect.BERRY> {
  public override readonly effect = HeldItemEffect.BERRY;
  public readonly berryType: BerryItemId;

  constructor(berryType: BerryItemId) {
    super();
    this.berryType = berryType;
  }

  public override shouldApply({ pokemon }: BerryParams): boolean {
    return getBerryPredicate(this.berryType)(pokemon);
  }

  public override apply({ pokemon }: BerryParams): void {
    const preserve = new BooleanHolder(false);
    globalScene.applyPlayerItems(TrainerItemEffect.PRESERVE_BERRY, { pokemon, doPreserve: preserve });
    const consumed = !preserve.value;

    getBerryEffectFunc(this.berryType)(pokemon);
    this.consume(pokemon, consumed);

    // Update berry eaten trackers for Belch, Harvest, Cud Chew, etc.
    // Don't recover if we proc berry pouch (no item duplication)
    pokemon.recordEatenBerry(this.berryType, consumed);
    // TODO: remove event emission after battle move flyout PR is merged (which moves it into `getBerryEffectFunc`)

    globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(pokemon, this.berryType));
  }
}
