import { getBerryEffectDescription, getBerryEffectFunc, getBerryName, getBerryPredicate } from "#app/data/berry";
import { BerryUsedEvent } from "#app/events/battle-scene";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { ConsumableHeldItem, HeldItemEffect } from "#app/items/held-item";
import { BooleanHolder } from "#app/utils/common";
import { BerryType } from "#enums/berry-type";
import { HeldItemId } from "#enums/held-item-id";
import { TRAINER_ITEM_EFFECT } from "../trainer-item";

interface BerryTypeToHeldItemMap {
  [key: number]: HeldItemId;
}

export const berryTypeToHeldItem: BerryTypeToHeldItemMap = {
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
};

export interface BERRY_PARAMS {
  /** The pokemon with the berry */
  pokemon: Pokemon;
}

// TODO: Maybe split up into subclasses?
export class BerryHeldItem extends ConsumableHeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.BERRY];
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
   * Checks if {@linkcode BerryModifier} should be applied
   * @param pokemon The {@linkcode Pokemon} that holds the berry
   * @returns `true` if {@linkcode BerryModifier} should be applied
   */
  shouldApply(pokemon: Pokemon): boolean {
    return getBerryPredicate(this.berryType)(pokemon);
  }

  /**
   * Applies {@linkcode BerryHeldItem}
   * @param pokemon The {@linkcode Pokemon} that holds the berry
   * @returns always `true`
   */
  apply(params: BERRY_PARAMS): boolean {
    const pokemon = params.pokemon;

    if (!this.shouldApply(pokemon)) {
      return false;
    }

    const preserve = new BooleanHolder(false);
    globalScene.applyPlayerItems(TRAINER_ITEM_EFFECT.PRESERVE_BERRY, { pokemon: pokemon, doPreserve: preserve });
    const consumed = !preserve.value;

    // munch the berry and trigger unburden-like effects
    getBerryEffectFunc(this.berryType)(pokemon);
    this.consume(pokemon, pokemon.isPlayer(), consumed);

    // TODO: Update this method to work with held items
    // Update berry eaten trackers for Belch, Harvest, Cud Chew, etc.
    // Don't recover it if we proc berry pouch (no item duplication)
    pokemon.recordEatenBerry(this.berryType, consumed);

    globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(pokemon, this.berryType));

    return true;
  }
}
