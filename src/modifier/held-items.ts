import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { Localizable } from "#app/interfaces/locales";
import type { Constructor, NumberHolder } from "#app/utils";
import { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";

export enum HeldItemType {
  NONE,

  SITRUS_BERRY = 1,
  LEPPA_BERRY,

  SILK_SCARF = 101,
  BLACK_BELT,
  SHARP_BEAK,
  POISON_BARB,
  SOFT_SAND,
  HARD_STONE,
  SILVER_POWDER,
  SPELL_TAG,
  METAL_COAT,
  CHARCOAL,
  MYSTIC_WATER,
  MIRACLE_SEED,
  MAGNET,
  TWISTED_SPOON,
  NEVER_MELT_ICE,
  DRAGON_FANG,
  BLACK_GLASSES,
  FAIRY_FEATHER,
}

export class HeldItem implements Localizable {
  //  public pokemonId: number;
  public type: HeldItemType;
  public maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;
  public attrs: HeldItemAttr[];

  public name: string;
  public description: string;
  public icon: string;

  constructor(type: HeldItemType, maxStackCount = 1, name, description, icon) {
    this.type = type;
    this.maxStackCount = maxStackCount;

    this.isTransferable = true;
    this.isStealable = true;
    this.isSuppressable = true;

    this.name = name;
    this.description = description;
    this.icon = icon;
  }

  //TODO: we might want to change things to make this work... otherwise it's pointless
  // to derive from Localizable.
  localize(): void {}

  //  get name(): string {
  //    return i18next.t(`modifierType:AttackTypeBoosterItem.${AttackTypeBoosterItem[this.moveType]?.toLowerCase()}`);
  //  }

  //  getDescription(): string {
  //    return
  //  }

  untransferable(): HeldItem {
    this.isTransferable = false;
    return this;
  }

  unstealable(): HeldItem {
    this.isStealable = false;
    return this;
  }

  unsuppressable(): HeldItem {
    this.isSuppressable = false;
    return this;
  }

  attr<T extends Constructor<HeldItemAttr>>(AttrType: T, ...args: ConstructorParameters<T>): HeldItem {
    const attr = new AttrType(...args);
    this.attrs.push(attr);

    return this;
  }

  /**
   * Get all ability attributes that match `attrType`
   * @param attrType any attribute that extends {@linkcode AbAttr}
   * @returns Array of attributes that match `attrType`, Empty Array if none match.
   */
  getAttrs<T extends HeldItemAttr>(attrType: Constructor<T>): T[] {
    return this.attrs.filter((a): a is T => a instanceof attrType);
  }

  hasAttr<T extends HeldItemAttr>(attrType: Constructor<T>): boolean {
    return this.getAttrs(attrType).length > 0;
  }

  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  getIcon(stackCount: number, _forSummary?: boolean): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items");
    item.setFrame(this.icon);
    item.setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  getIconStackText(stackCount: number): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1) {
      return null;
    }

    const text = globalScene.add.bitmapText(10, 15, "item-count", stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (stackCount >= this.getMaxStackCount()) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0, 0);

    return text;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

export abstract class HeldItemAttr {
  public showItem: boolean;

  constructor(showItem = false) {
    this.showItem = showItem;
  }

  /**
   * Applies ability effects without checking conditions
   * @param pokemon - The pokemon to apply this ability to
   * @param itemType - Whether or not the ability is a passive
   * @param args - Extra args passed to the function. Handled by child classes.
   * @see {@linkcode canApply}
   */
  apply(..._args: any[]): void {}

  getTriggerMessage(_pokemon: Pokemon, _itemType: HeldItemType, ..._args: any[]): string | null {
    return null;
  }

  //TODO: May need to add back some condition logic... we'll deal with that later on
}

export class AttackTypeBoosterHeldItemAttr extends HeldItemAttr {
  public moveType: PokemonType;
  public powerBoost: number;

  constructor(moveType: PokemonType, powerBoost: number) {
    super();
    this.moveType = moveType;
    this.powerBoost = powerBoost;
  }

  override apply(stackCount: number, args: any[]): void {
    const moveType = args[0];
    const movePower = args[1];

    if (moveType === this.moveType && movePower.value >= 1) {
      (movePower as NumberHolder).value = Math.floor(
        (movePower as NumberHolder).value * (1 + stackCount * this.powerBoost),
      );
    }
  }
}

export function applyHeldItemAttrs(attrType: Constructor<HeldItemAttr>, pokemon: Pokemon, ...args: any[]) {
  if (pokemon) {
    for (const [item, stackCount] of pokemon.heldItemManager.getHeldItems()) {
      if (allHeldItems[item].hasAttr(attrType)) {
        attrType.apply(stackCount, ...args);
      }
    }
  }
}

export const allHeldItems = [new HeldItem(HeldItemType.NONE, 0, "", "", "")];

export function initHeldItems() {
  allHeldItems.push(
    new HeldItem(
      HeldItemType.SILK_SCARF,
      99,
      i18next.t("modifierType:AttackTypeBoosterItem.silk_scarf"),
      i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
        moveType: i18next.t("pokemonInfo:Type.NORMAL"),
      }),
      "silk_scarf",
    ).attr(AttackTypeBoosterHeldItemAttr, PokemonType.NORMAL, 0.2),
    new HeldItem(
      HeldItemType.BLACK_BELT,
      99,
      i18next.t("modifierType:AttackTypeBoosterItem.black_belt"),
      i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
        moveType: i18next.t("pokemonInfo:Type.FIGHTING"),
      }),
      "black_belt",
    ).attr(AttackTypeBoosterHeldItemAttr, PokemonType.FIGHTING, 0.2),
  );
}

//TODO: I hate this. Can we just make it an interface?
export function getHeldItem(itemType: HeldItemType): HeldItem {
  return allHeldItems.find(item => item.type === itemType)!; // TODO: is this bang correct?
}
