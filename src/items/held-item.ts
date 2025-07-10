import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { HeldItemNames, type HeldItemId } from "#enums/held-item-id";
import i18next from "i18next";

export const HELD_ITEM_EFFECT = {
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
  TURN_END_ITEM_STEAL: 22,
  CONTACT_ITEM_STEAL_CHANCE: 23,
  EVO_TRACKER: 40,
  BASE_STAT_TOTAL: 50,
  BASE_STAT_FLAT: 51,
  INCREMENTING_STAT: 52,
} as const;

export type HELD_ITEM_EFFECT = (typeof HELD_ITEM_EFFECT)[keyof typeof HELD_ITEM_EFFECT];

export class HeldItem {
  //  public pokemonId: number;
  public type: HeldItemId;
  public maxStackCount: number;
  public isTransferable = true;
  public isStealable = true;
  public isSuppressable = true;

  //TODO: If this is actually never changed by any subclass, perhaps it should not be here
  public soundName = "se/restore";

  constructor(type: HeldItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;

    this.isTransferable = true;
    this.isStealable = true;
    this.isSuppressable = true;
  }

  get name(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.name`);
  }

  get description(): string {
    return i18next.t(`modifierType:ModifierType.${HeldItemNames[this.type]}.description`);
  }

  get iconName(): string {
    return `${HeldItemNames[this.type]?.toLowerCase()}`;
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

  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114950716
  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createSummaryIcon(pokemon?: Pokemon, overrideStackCount?: number): Phaser.GameObjects.Container {
    const stackCount = overrideStackCount ?? (pokemon ? this.getStackCount(pokemon) : 0);

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

  createPokemonIcon(pokemon: Pokemon): Phaser.GameObjects.Container {
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

    const stackText = this.getIconStackText(this.getStackCount(pokemon));
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
      // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114955458
      text.setTint(0xf89890);
    }
    text.setOrigin(0);

    return text;
  }

  getStackCount(pokemon: Pokemon): number {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return stackCount;
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
      globalScene.updateItems(isPlayer);
    }
    if (unburden) {
      applyAbAttrs("PostItemLostAbAttr", { pokemon: pokemon });
    }
  }
}
