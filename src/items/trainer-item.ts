import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import type { TrainerItemEffect } from "#enums/trainer-item-effect";
import { type TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import type { TrainerItemAttr, TrainerItemRecord } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { TrainerItemEffectParamMap } from "#types/trainer-item-parameter";
import { addTextObject } from "#ui/text";
import { hslToHex } from "#utils/common";
import i18next from "i18next";

export abstract class TrainerItemBase {
  public readonly type: TrainerItemId;
  public readonly maxStackCount: number;
  /** Whether this item will be removed after a set number of turns (using its stack count as a "timer" of sorts). */
  public readonly isLapsing: boolean = false;

  constructor(type: TrainerItemId, maxStackCount = 1) {
    this.type = type;
    this.maxStackCount = maxStackCount;
  }

  public get name(): string {
    return i18next.t(`modifierType:ModifierType.${TrainerItemNames[this.type]}.name`);
  }

  public get description(): string {
    return i18next.t(`modifierType:ModifierType.${TrainerItemNames[this.type]}.description`);
  }

  public get iconName(): string {
    return `${TrainerItemNames[this.type]?.toLowerCase()}`;
  }

  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  createIcon(stackCount: number): Phaser.GameObjects.Container {
    const container = globalScene.add.container();

    container.add(globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5));

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  public getIconStackText(stackCount: number): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1 || stackCount < 1) {
      return null;
    }

    const text = globalScene.add
      .bitmapText(10, 15, "item-count", stackCount.toString(), 11)
      .setLetterSpacing(-0.5)
      .setOrigin(0);
    if (stackCount >= this.getMaxStackCount()) {
      text.setTint(0xf89890);
    }

    return text;
  }

  getScoreMultiplier(): number {
    return 1;
  }
}

/**
 * Class for all non-marker trainer items
 * (i.e. ones that can have their effects applied during or outside of battle).
 *
 * @typeParam Attrs - A union of {@linkcode TrainerItemAttr}s that this class supports.
 * @see {@linkcode TrainerItemBuilder}
 * @privateRemarks
 * While exposing the exact kinds of attributes this class supports technically breaks encapsulation,
 * this is required for existing code to work without excessive type assertions.
 */
export abstract class TrainerItem<out Attrs extends TrainerItemAttr = TrainerItemAttr> extends TrainerItemBase {
  /**
   * An object matching each supported {@linkcode TrainerItemEffect} to the attributes that implement said effect.
   */
  public readonly effects: TrainerItemRecord<Attrs>;

  protected constructor({
    type,
    effects,
    maxStackCount = 1,
  }: {
    type: TrainerItemId;
    effects: TrainerItemRecord<Attrs>;
    maxStackCount?: number;
  }) {
    super(type, maxStackCount);
    this.effects = effects;
  }

  /**
   * Check whether this item handles the given effect at runtime.
   * Narrows the item's effect set to include `E`.
   * @param effect - The {@linkcode TrainerItemEffect} to check
   * @returns Whether this item has at least 1 attribute for `effect`
   * @sealed
   */
  public hasEffect<E extends TrainerItemEffect>(effect: E): this is TrainerItem<Attrs | TrainerItemAttr<E>> {
    return this.effects[effect].length > 0;
  }

  /**
   * Apply all of this item's attributes that pertain to the given effect, subject to their individual
   * {@linkcode TrainerItemAttr.shouldApply | shouldApply} conditions.
   * @param effect - The {@linkcode TrainerItemEffect | effect} to apply
   * @param params - The parameters to pass to the item attributes' `apply` methods
   * @remarks
   * The execution order of multiple attributes is not guaranteed and should not be relied upon.
   * @sealed
   */
  public apply<E extends Attrs["effect"]>(
    effect: E,
    params: TrainerItemEffectParamMap[E],
    manager: TrainerItemManager,
  ): void {
    for (const attr of this.getAttrs(effect) as readonly TrainerItemAttr<E>[]) {
      if (attr.shouldApply(params, manager)) {
        attr.apply(params, manager);
      }
    }
  }

  /**
   * Retrieve all attributes of this item pertaining to the given effect.
   * @param effect - The {@linkcode TrainerItemEffect | effect} to retrieve
   * @returns An array containing all attributes this item has for `effect`.
   * Is guaranteed to be non-empty for properly constructed `TrainerItem`s.
   * @remarks
   * The order of the attributes within the returned array is not guaranteed and should not be relied upon.
   * @sealed
   */
  public getAttrs<E extends Attrs["effect"]>(effect: E): readonly Extract<Attrs, TrainerItemAttr<E>>[] {
    return this.effects[effect];
  }
}

// TODO: Rework to not be its own class (either make it a mixin or have `TrainerItemBase` handle things itself)
export class LapsingTrainerItem extends TrainerItem {
  public readonly isLapsing = true;

  public override createIcon(battleCount: number): Phaser.GameObjects.Container {
    const item = globalScene.add.sprite(0, 12, "items").setFrame(this.iconName).setOrigin(0, 0.5);

    // Linear interpolation on hue
    const hue = Math.floor(120 * (battleCount / this.getMaxStackCount()) + 5);

    // Generates the color hex code with a constant saturation and lightness but varying hue
    const typeHex = hslToHex(hue, 0.5, 0.9);
    const strokeHex = hslToHex(hue, 0.7, 0.3);

    const battleCountText = addTextObject(27, 0, battleCount.toString(), TextStyle.PARTY, {
      fontSize: "66px",
      color: typeHex,
    })
      .setShadow(0, 0)
      .setStroke(strokeHex, 16)
      .setOrigin(1, 0);

    return globalScene.add.container(0, 0, [item, battleCountText]);
  }
}
