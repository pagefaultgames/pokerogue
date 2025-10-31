import { globalScene } from "#app/global-scene";
import { getBerryEffectDescription, getBerryEffectFunc, getBerryName, getBerryPredicate } from "#data/berry";
import { BerryType } from "#enums/berry-type";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { BerryUsedEvent } from "#events/battle-scene";
import { ConsumableHeldItem } from "#items/held-item";
import type { BerryParams } from "#types/held-item-parameter";
import type { ObjectValues } from "#types/type-helpers";
import { BooleanHolder } from "#utils/common";

type BerryTypeToHeldItemMap = {
  [key in ObjectValues<typeof BerryType>]: HeldItemId;
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

// TODO: Maybe split up into subclasses?
export class BerryHeldItem extends ConsumableHeldItem<[typeof HeldItemEffect.BERRY]> {
  public readonly effects = [HeldItemEffect.BERRY] as const;
  public berryType: BerryType;

  constructor(berryType: BerryType, maxStackCount = 1) {
    const type = berryTypeToHeldItem[berryType];
    super(type, maxStackCount);

    this.berryType = berryType;
  }

  get name(): string {
    return getBerryName(this.berryType);
  }

  get description(): string {
    return getBerryEffectDescription(this.berryType);
  }

  get iconName(): string {
    return `${BerryType[this.berryType].toLowerCase()}_berry`;
  }

  /**
   * Determine whether the Berry can be applied
   * @param pokemon - The user with the berry
   * @returns Whether the {@linkcode BerryModifier} should be applied
   */
  shouldApply(_effect: typeof HeldItemEffect.BERRY, { pokemon }: BerryParams): boolean {
    return getBerryPredicate(this.berryType)(pokemon);
  }

  /**
   * Applies {@linkcode BerryHeldItem}
   * @returns always `true`
   */
  apply(_effect: typeof HeldItemEffect.BERRY, { pokemon }: BerryParams): void {
    // TODO: This call should not be here?
    //    if (!this.shouldApply(pokemon)) {
    //      return false;
    //    }

    const preserve = new BooleanHolder(false);
    globalScene.applyPlayerItems(TrainerItemEffect.PRESERVE_BERRY, { pokemon, doPreserve: preserve });
    const consumed = !preserve.value;

    // munch the berry and trigger unburden-like effects
    getBerryEffectFunc(this.berryType)(pokemon);
    this.consume(pokemon, consumed);

    // TODO: Update this method to work with held items
    // Update berry eaten trackers for Belch, Harvest, Cud Chew, etc.
    // Don't recover it if we proc berry pouch (no item duplication)
    pokemon.recordEatenBerry(this.berryType, consumed);

    globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(pokemon, this.berryType));
  }
}
