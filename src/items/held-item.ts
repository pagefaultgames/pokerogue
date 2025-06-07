import { applyPostItemLostAbAttrs, PostItemLostAbAttr } from "#app/data/abilities/ability";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { HeldItemNames, type HeldItemId } from "#enums/held-item-id";
import i18next from "i18next";

export const ITEM_EFFECT = {
  ATTACK_TYPE_BOOST: 1,
  TURN_END_HEAL: 2,
  HIT_HEAL: 3,
  RESET_NEGATIVE_STAT_STAGE: 4,
  EXP_BOOSTER: 5,
  // Should we actually distinguish different berry effects?
  BERRY: 6,
  BASE_STAT_BOOSTER: 7,
  INSTANT_REVIVE: 8,
  STAT_BOOST: 9,
  CRIT_BOOST: 10,
  TURN_END_STATUS: 11,
  SURVIVE_CHANCE: 12,
  BYPASS_SPEED_CHANCE: 13,
  FLINCH_CHANCE: 14,
  FIELD_EFFECT: 15,
  FRIENDSHIP_BOOSTER: 16,
  NATURE_WEIGHT_BOOSTER: 17,
  ACCURACY_BOOSTER: 18,
  MULTI_HIT: 19,
  DAMAGE_MONEY_REWARD: 20,
  BATON: 21,
} as const;

export type ITEM_EFFECT = (typeof ITEM_EFFECT)[keyof typeof ITEM_EFFECT];

export class HeldItem {
  //  public pokemonId: number;
  public type: HeldItemId;
  public maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;

  constructor(type: HeldItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;

    this.isTransferable = true;
    this.isStealable = true;
    this.isSuppressable = true;
  }

  getName(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.name`) + " (new)";
  }

  getDescription(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.description`);
  }

  getIcon(): string {
    return `${HeldItemNames[this.type]?.toLowerCase()}`;
  }

  get name(): string {
    return "";
  }

  get description(): string {
    return "";
  }

  get iconName(): string {
    return "";
  }

  // TODO: Aren't these fine as just properties to set in the subclass definition?
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

  createSummaryIcon(stackCount: number): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    container.setScale(0.5);

    return container;
  }

  createPokemonIcon(stackCount: number, pokemon: Pokemon): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const pokemonIcon = globalScene.addPokemonIcon(pokemon, -2, 10, 0, 0.5, undefined, true);
    container.add(pokemonIcon);
    container.setName(pokemon.id.toString());

    const item = globalScene.add
      .sprite(16, 16, "items")
      .setScale(0.5)
      .setOrigin(0, 0.5)
      .setTexture("items", this.iconName);
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
    text.setOrigin(0);

    return text;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

export class ConsumableHeldItem extends HeldItem {
  // Sometimes berries are not eaten, some stuff may not proc unburden...
  consume(pokemon: Pokemon, isPlayer: boolean, remove = true, unburden = true): void {
    if (remove) {
      pokemon.heldItemManager.remove(this.type, 1);
      // TODO: Turn this into updateItemBar or something
      globalScene.updateModifiers(isPlayer);
    }
    if (unburden) {
      applyPostItemLostAbAttrs(PostItemLostAbAttr, pokemon, false);
    }
  }
}
