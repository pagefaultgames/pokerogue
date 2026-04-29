import { globalScene } from "#app/global-scene";
import { getBerryEffectFunc, getBerryPredicate } from "#data/berry";
import { BerryType } from "#enums/berry-type";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { BerryUsedEvent } from "#events/battle-scene";
import type { BerryItemId } from "#items/all-held-items";
import { ConsumableHeldItemAttr } from "#items/held-item-attr";
import type { BerryParams } from "#types/held-item-parameter";
import { BooleanHolder } from "#utils/common";

type BerryTypeToHeldItemMap = {
  [key in BerryType]: BerryItemId;
};

// TODO: Rework this to use a bitwise XOR
export const berryTypeToHeldItem = {
  [BerryType.SITRUS]: HeldItemId.SITRUS_BERRY,
  [BerryType.LUM]: HeldItemId.LUM_BERRY,
  [BerryType.ENIGMA]: HeldItemId.ENIGMA_BERRY,
  [BerryType.LIECHI]: HeldItemId.LIECHI_BERRY,
  [BerryType.GANLON]: HeldItemId.GANLON_BERRY,
  [BerryType.PETAYA]: HeldItemId.PETAYA_BERRY,
  [BerryType.APICOT]: HeldItemId.APICOT_BERRY,
  [BerryType.SALAC]: HeldItemId.SALAC_BERRY,
  [BerryType.LANSAT]: HeldItemId.LANSAT_BERRY,
  [BerryType.STARF]: HeldItemId.STARF_BERRY,
  [BerryType.LEPPA]: HeldItemId.LEPPA_BERRY,
} satisfies BerryTypeToHeldItemMap;

// TODO: Split up the berry effect into multiple ones if/when berry phase is reworked
export class BerryHeldItemAttr extends ConsumableHeldItemAttr<typeof HeldItemEffect.BERRY> {
  public override readonly effect = HeldItemEffect.BERRY;
  public readonly berryType: BerryType;

  constructor(berryType: BerryType) {
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
