import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { Localizable } from "#app/interfaces/locales";
import type { NumberHolder } from "#app/utils/common";
import { HeldItems } from "#enums/held-items";
import { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";

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
    for (const [item, props] of Object.entries(pokemon.heldItemManager.getHeldItems())) {
      if (allHeldItems[item] instanceof AttackTypeBoosterHeldItem) {
        allHeldItems[item].apply(props.stack, moveType, movePower);
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
