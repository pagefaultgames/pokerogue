import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import type { TrainerItemEffect } from "#enums/trainer-item-effect";
import { type TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import type { TrainerItemAttr, TrainerItemRecord } from "#items/trainer-item-attr";
import type { TrainerItemBuilder } from "#items/trainer-item-builder";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { TrainerItemEffectParamMap } from "#types/trainer-item-parameter";
import { addTextObject } from "#ui/text";
import { hslToHex } from "#utils/color-utils";
import i18next from "i18next";
import type { NonEmptyTuple } from "type-fest";

export abstract class TrainerItemBase {
  public readonly type: TrainerItemId;

  /**
   * Private backing property for `maxStackCount`
   */
  // TODO: This is added for the SOLE purpose of supporting endure tokens' dynamic max stack count.
  readonly #maxStackCount: number | (() => number);
  public get maxStackCount(): number {
    return typeof this.#maxStackCount === "function" ? this.#maxStackCount() : this.#maxStackCount;
  }
  // TODO: Remove as we now expose the base property
  getMaxStackCount(): number {
    return this.maxStackCount;
  }

  /**
   * Whether this item will be removed after a set number of turns (using its stack count as a "timer" of sorts).
   * @defaultValue `false`
   */
  public readonly isLapsing: boolean;

  constructor(type: TrainerItemId, maxStackCount: number | (() => number), isLapsing = false) {
    this.type = type;
    this.#maxStackCount = maxStackCount;
    this.isLapsing = isLapsing;
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

  public createIcon(stackCount: number): Phaser.GameObjects.Container {
    const item = globalScene.add
      .sprite(0, 12, "items") //
      .setFrame(this.iconName)
      .setOrigin(0, 0.5);
    const container = globalScene.add.container().add(item);

    const stackText = this.getIconStackText(stackCount);
    if (stackText) {
      container.add(stackText);
    }

    return container;
  }

  private getIconStackText(stackCount: number): Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text | undefined {
    if (this.isLapsing) {
      // Generate the text with a linearly interpolated hue based on remaining duration
      // Ranges from #f2dbd9 / #822017 (≈ 0% duration) to #d9f2db / #178220 (100% duration)
      const hue = Math.floor(120 * (stackCount / this.getMaxStackCount()) + 5);
      const typeHex = hslToHex(hue, 0.5, 0.9);
      const strokeHex = hslToHex(hue, 0.7, 0.3);

      return addTextObject(27, 0, stackCount.toString(), TextStyle.PARTY, {
        fontSize: "66px",
        color: typeHex,
      })
        .setShadow(0, 0)
        .setStroke(strokeHex, 16)
        .setOrigin(1, 0);
    }

    if (this.getMaxStackCount() === 1 || stackCount < 1) {
      return;
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

  // TODO: This is unused
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

  // #region Localization

  /**
   * Optional parameters used to localize this item's name.
   * If omitted, will use the default implementation provided from {@linkcode TrainerItemBase}.
   */
  private readonly nameParams?: Parameters<typeof i18next.t> | undefined;
  /**
   * Optional parameters used to localize this item's description.
   * If omitted, will use the default implementation provided from {@linkcode TrainerItemBase}.
   */
  private readonly descriptionParams?: Parameters<typeof i18next.t> | undefined;
  public readonly customIconName?: string | undefined;

  public override get name(): string {
    return this.nameParams ? i18next.t(...this.nameParams) : super.name;
  }

  public override get description(): string {
    return this.descriptionParams ? i18next.t(...this.descriptionParams) : super.description;
  }

  public override get iconName(): string {
    return this.customIconName ?? super.iconName;
  }

  // #endregion Localization

  protected constructor({
    type,
    effects,
    lapsing = false,
    maxStackCount = 1,
    nameParams,
    descriptionParams,
    iconName,
  }: {
    type: TrainerItemId;
    effects: TrainerItemRecord<Attrs>;
    maxStackCount?: number;
    nameParams?: Parameters<typeof i18next.t> | undefined;
    descriptionParams?: Parameters<typeof i18next.t> | undefined;
    iconName?: string | undefined;
    lapsing?: boolean;
  }) {
    super(type, maxStackCount, lapsing);

    this.effects = effects;
    this.nameParams = nameParams;
    this.descriptionParams = descriptionParams;
    this.customIconName = iconName;
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
  public getAttrs<E extends Attrs["effect"]>(effect: E): NonEmptyTuple<Extract<Attrs, TrainerItemAttr<E>>> {
    return this.effects[effect] as NonEmptyTuple<Extract<Attrs, TrainerItemAttr<E>>>;
  }
}

export class MarkerTrainerItem extends TrainerItemBase {
  private declare readonly _: never;
}
