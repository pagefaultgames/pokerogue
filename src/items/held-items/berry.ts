import { getBerryEffectDescription, getBerryEffectFunc, getBerryName } from "#app/data/berry";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { ConsumableHeldItem, ITEM_EFFECT } from "#app/items/held-item";
import { PreserveBerryModifier } from "#app/modifier/modifier";
import { BooleanHolder } from "#app/utils/common";
import { BerryType } from "#enums/berry-type";
import { HeldItems } from "#enums/held-items";

interface BerryTypeToHeldItemMap {
  [key: number]: HeldItems;
}

export const berryTypeToHeldItem: BerryTypeToHeldItemMap = {
  [BerryType.SITRUS]: HeldItems.SITRUS_BERRY,
  [BerryType.LUM]: HeldItems.LUM_BERRY,
  [BerryType.ENIGMA]: HeldItems.ENIGMA_BERRY,
  [BerryType.LIECHI]: HeldItems.LIECHI_BERRY,
  [BerryType.GANLON]: HeldItems.GANLON_BERRY,
  [BerryType.PETAYA]: HeldItems.PETAYA_BERRY,
  [BerryType.APICOT]: HeldItems.APICOT_BERRY,
  [BerryType.SALAC]: HeldItems.SALAC_BERRY,
  [BerryType.LANSAT]: HeldItems.LANSAT_BERRY,
  [BerryType.STARF]: HeldItems.STARF_BERRY,
  [BerryType.LEPPA]: HeldItems.LEPPA_BERRY,
};

export interface BERRY_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Whether the move was used by a player pokemon */
  isPlayer: boolean;
}

// TODO: Maybe split up into subclasses?
export class BerryHeldItem extends ConsumableHeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.BERRY];
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
  //  override shouldApply(pokemon: Pokemon): boolean {
  //    return !this.consumed && super.shouldApply(pokemon) && getBerryPredicate(this.berryType)(pokemon);
  //  }

  /**
   * Applies {@linkcode BerryHeldItem}
   * @param pokemon The {@linkcode Pokemon} that holds the berry
   * @returns always `true`
   */
  apply(params: BERRY_PARAMS): boolean {
    const pokemon = params.pokemon;
    const isPlayer = params.isPlayer;

    const preserve = new BooleanHolder(false);
    globalScene.applyModifiers(PreserveBerryModifier, pokemon.isPlayer(), pokemon, preserve);
    const consumed = !preserve.value;

    // munch the berry and trigger unburden-like effects
    getBerryEffectFunc(this.berryType)(pokemon);
    this.consume(pokemon, isPlayer, consumed);

    // TODO: Update this method to work with held items
    // Update berry eaten trackers for Belch, Harvest, Cud Chew, etc.
    // Don't recover it if we proc berry pouch (no item duplication)
    pokemon.recordEatenBerry(this.berryType, consumed);

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    if ([BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA].includes(this.berryType)) {
      return 2;
    }
    return 3;
  }
}
