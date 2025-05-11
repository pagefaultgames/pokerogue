import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { Localizable } from "#app/interfaces/locales";
import type { NumberHolder } from "#app/utils/common";
import { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";

export const HeldItems = {
  NONE: 0x0000,

  SITRUS_BERRY: 0x0101,
  LEPPA_BERRY: 0x0102,

  SILK_SCARF: 0x0201,
  BLACK_BELT: 0x0202,
  SHARP_BEAK: 0x0203,
  POISON_BARB: 0x0204,
  SOFT_SAND: 0x0205,
  HARD_STONE: 0x0206,
  SILVER_POWDER: 0x0207,
  SPELL_TAG: 0x0208,
  METAL_COAT: 0x0209,
  CHARCOAL: 0x020a,
  MYSTIC_WATER: 0x020b,
  MIRACLE_SEED: 0x020c,
  MAGNET: 0x020d,
  TWISTED_SPOON: 0x020e,
  NEVER_MELT_ICE: 0x020f,
  DRAGON_FANG: 0x0210,
  BLACK_GLASSES: 0x0211,
  FAIRY_FEATHER: 0x0212,

  REVIVER_SEED: 0x0301,
  SOOTHE_BELL: 0x0302,
  SOUL_DEW: 0x0303,
  GOLDEN_PUNCH: 0x0304,
  GRIP_CLAW: 0x0305,
  BATON: 0x0306,
  FOCUS_BAND: 0x0307,
  QUICK_CLAW: 0x0308,
  KINGS_ROCK: 0x0309,
  LEFTOVERS: 0x030a,
  SHELL_BELL: 0x030b,
};

export type HeldItems = (typeof HeldItems)[keyof typeof HeldItems];

export const HeldItemCategories = {
  NONE: 0x0000,
  BERRY: 0x0100,
  ATTACK_TYPE_BOOSTER: 0x0200,
  BASE_STAT_BOOSTER: 0x0400,
};

export type HeldItemCategories = (typeof HeldItemCategories)[keyof typeof HeldItemCategories];

export class HeldItem implements Localizable {
  //  public pokemonId: number;
  public type: HeldItems;
  public maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;

  public name = "";
  public description = "";
  public icon = "";

  constructor(type: HeldItems, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;

    this.isTransferable = true;
    this.isStealable = true;
    this.isSuppressable = true;
  }

  localize(): void {
    this.name = this.getName();
    this.description = this.getDescription();
    this.icon = this.getIcon();
  }

  getName(): string {
    return "";
  }

  getDescription(): string {
    return "";
  }

  getIcon(): string {
    return "";
  }

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

  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createIcon(stackCount: number, _forSummary?: boolean): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items");
    item.setFrame(this.getIcon());
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

interface AttackTypeToHeldItemMap {
  [key: number]: HeldItems;
}

export const attackTypeToHeldItem: AttackTypeToHeldItemMap = {
  [PokemonType.NORMAL]: HeldItems.SILK_SCARF,
  [PokemonType.FIGHTING]: HeldItems.BLACK_BELT,
  [PokemonType.FLYING]: HeldItems.SHARP_BEAK,
  [PokemonType.POISON]: HeldItems.POISON_BARB,
  [PokemonType.GROUND]: HeldItems.SOFT_SAND,
  [PokemonType.ROCK]: HeldItems.HARD_STONE,
  [PokemonType.BUG]: HeldItems.SILVER_POWDER,
  [PokemonType.GHOST]: HeldItems.SPELL_TAG,
  [PokemonType.STEEL]: HeldItems.METAL_COAT,
  [PokemonType.FIRE]: HeldItems.CHARCOAL,
  [PokemonType.WATER]: HeldItems.MYSTIC_WATER,
  [PokemonType.GRASS]: HeldItems.MIRACLE_SEED,
  [PokemonType.ELECTRIC]: HeldItems.MAGNET,
  [PokemonType.PSYCHIC]: HeldItems.TWISTED_SPOON,
  [PokemonType.ICE]: HeldItems.NEVER_MELT_ICE,
  [PokemonType.DRAGON]: HeldItems.DRAGON_FANG,
  [PokemonType.DARK]: HeldItems.BLACK_GLASSES,
  [PokemonType.FAIRY]: HeldItems.FAIRY_FEATHER,
};

export class AttackTypeBoosterHeldItem extends HeldItem {
  public moveType: PokemonType;
  public powerBoost: number;

  constructor(type: HeldItems, maxStackCount = 1, moveType: PokemonType, powerBoost: number) {
    super(type, maxStackCount);
    this.moveType = moveType;
    this.powerBoost = powerBoost;
    this.localize();
  }

  getName(): string {
    return i18next.t(`modifierType:AttackTypeBoosterItem.${HeldItems[this.type]?.toLowerCase()}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
      moveType: i18next.t(`pokemonInfo:Type.${PokemonType[this.moveType]}`),
    });
  }

  getIcon(): string {
    return `${HeldItems[this.type]?.toLowerCase()}`;
  }

  apply(stackCount: number, moveType: PokemonType, movePower: NumberHolder): void {
    if (moveType === this.moveType && movePower.value >= 1) {
      movePower.value = Math.floor(movePower.value * (1 + stackCount * this.powerBoost));
    }
  }
}

export function applyAttackTypeBoosterHeldItem(pokemon: Pokemon, moveType: PokemonType, movePower: NumberHolder) {
  if (pokemon) {
    for (const [item, stackCount] of pokemon.heldItemManager.getHeldItems()) {
      if (allHeldItems[item] instanceof AttackTypeBoosterHeldItem) {
        allHeldItems[item].apply(stackCount, moveType, movePower);
      }
    }
  }
}

export const allHeldItems = {};

export function initHeldItems() {
  // SILK_SCARF, BLACK_BELT, etc...
  for (const [typeKey, heldItemType] of Object.entries(attackTypeToHeldItem)) {
    const pokemonType = Number(typeKey) as PokemonType;
    allHeldItems[heldItemType] = new AttackTypeBoosterHeldItem(heldItemType, 99, pokemonType, 0.2);
  }
}
