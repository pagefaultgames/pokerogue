/*
 * SPDX-Copyright-Text: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type AbAttr, AbilityAttrs } from "#abilities/ab-attrs";
import { AbilityId } from "#enums/ability-id";
import type { AbAttrCondition, AbAttrMap, AbAttrString } from "#types/ability-types";
import type { Constructor } from "#types/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

//#region Bit sets
/** Bit set for an ability's `bypass faint` flag */
const AB_FLAG_BYPASS_FAINT = 1 << 0;
/** Bit set for an ability's `ignorable` flag */
const AB_FLAG_IGNORABLE = 1 << 1;
/** Bit set for an ability's `suppressable` flag */
const AB_FLAG_UNSUPPRESSABLE = 1 << 2;
/** Bit set for an ability's `uncopiable` flag */
const AB_FLAG_UNCOPIABLE = 1 << 3;
/** Bit set for an ability's `unreplaceable` flag */
const AB_FLAG_UNREPLACEABLE = 1 << 4;
/** Bit set for an ability's `unimplemented` flag */
const AB_FLAG_UNIMPLEMENTED = 1 << 5;
/** Bit set for an ability's `partial` flag */
const AB_FLAG_PARTIAL = 1 << 6;
/** Bit set for an unswappable ability */
const AB_FLAG_UNSWAPPABLE = AB_FLAG_UNCOPIABLE | AB_FLAG_UNREPLACEABLE;

//#endregion Bit sets

/**
 * An Ability is a class representing the various Abilities Pokemon may have. \
 * Each has one or more {@linkcode AbAttr | attributes} that can apply independently
 * of one another.
 */
export class Ability {
  /** The ability's unique identifier */
  public readonly id: AbilityId;
  /** The locales key for the ability's name. */
  private readonly i18nKey: string;
  /**
   * The localized ability name.
   * @remarks
   * Includes the `"(P)"` or `"(N)"` suffix if the ability is partial/unimplemented
   */
  public get name(): string {
    if (this.id === AbilityId.NONE) {
      return "";
    }
    const name = i18next.t(`ability:${this.i18nKey}.name`);

    // TODO: Make a `getDisplayName` method (or another getter) that puts the (N) and (P) markers after the name
    // Also, consider whether these markers should be localized
    if (this.unimplemented) {
      return name + " (N)";
    }
    if (this.partial) {
      return name + " (P)";
    }
    return name;
  }
  public readonly attrs: readonly AbAttr[];
  public readonly conditions: readonly AbAttrCondition[];

  /** The localized ability description */
  public get description(): string {
    if (this.id === AbilityId.NONE) {
      return "";
    }
    return i18next.t(`ability:${this.i18nKey}.description`);
  }

  /**
   * Whether this ability can activate even if the user faints.
   * @remarks
   * If `true`, the ability will also activate when revived via Reviver Seed.
   */
  public get bypassFaint(): boolean {
    return (this.flags & AB_FLAG_BYPASS_FAINT) !== 0;
  }
  /**
   * Whether this ability can be ignored by effects like
   * {@linkcode MoveId.SUNSTEEL_STRIKE | Sunsteel Strike} or {@linkcode AbilityId.MOLD_BREAKER | Mold Breaker}.
   */
  public get ignorable(): boolean {
    return (this.flags & AB_FLAG_IGNORABLE) !== 0;
  }
  /**
   * Whether this ability can be suppressed by effects like
   * {@linkcode MoveId.GASTRO_ACID | Gastro Acid} or {@linkcode AbilityId.NEUTRALIZING_GAS | Neutralizing Gas}.
   */
  public get suppressable(): boolean {
    return !(this.flags & AB_FLAG_UNSUPPRESSABLE);
  }
  /**
   * Whether this ability can be copied by effects like
   * {@linkcode MoveId.ROLE_PLAY | Role Play} or {@linkcode AbilityId.TRACE | Trace}.
   */
  public get copiable(): boolean {
    return !(this.flags & AB_FLAG_UNCOPIABLE);
  }
  /**
   * Whether this ability can be replaced by effects like
   * {@linkcode MoveId.SIMPLE_BEAM | Simple Beam} or {@linkcode MoveId.ENTRAINMENT | Entrainment}.
   */
  public get replaceable(): boolean {
    return !(this.flags & AB_FLAG_UNREPLACEABLE);
  }
  /**
   * Whether this ability is partially implemented.
   * @remarks
   * Mutually exclusive with {@linkcode unimplemented}
   */
  public get partial(): boolean {
    return (this.flags & AB_FLAG_PARTIAL) !== 0;
  }
  /**
   * Whether this ability is unimplemented.
   * @remarks
   * Mutually exclusive with {@linkcode partial}
   */
  public get unimplemented(): boolean {
    return (this.flags & AB_FLAG_UNIMPLEMENTED) !== 0;
  }
  /**
   * Whether this ability can be swapped via effects like {@linkcode MoveId.SKILL_SWAP | Skill Swap}.
   * @remarks
   * Logically equivalent to `this.copiable && this.replaceable`, albeit slightly faster
   * due to using a pre-computed bitmask.
   */
  public get swappable(): boolean {
    return !(this.flags & AB_FLAG_UNSWAPPABLE);
  }

  /** The generation the ability was introduced in */
  public readonly generation: number;

  /** The ability's post summon priority order */
  public readonly postSummonPriority: number;

  /** Holder for the ability's flags */
  protected readonly flags: number;

  private constructor(builder: AbBuilder) {
    this.id = builder.id;
    this.generation = builder.generation;
    this.i18nKey = toCamelCase(AbilityId[this.id]);
    this.flags = builder.flags;
    this.postSummonPriority = builder.postSummonPriority;
    this.attrs = builder.attrs;
    this.conditions = builder.conditions;
  }

  /**
   * Check if an ability has an attribute that matches `attrType`
   * @param attrType - any attribute that extends {@linkcode AbAttr}
   * @returns true if the ability has attribute `attrType`
   */
  hasAttr<T extends AbAttrString>(attrType: T): boolean {
    const targetAttr = AbilityAttrs[attrType];
    if (!targetAttr) {
      return false;
    }
    return this.attrs.some(attr => attr instanceof targetAttr);
  }

  /**
   * Get all ability attributes that match `attrType`
   * @param attrType - any attribute that extends {@linkcode AbAttr}
   * @returns Array of attributes that match `attrType`, Empty Array if none match.
   */
  getAttrs<T extends AbAttrString>(attrType: T): AbAttrMap[T][] {
    const targetAttr = AbilityAttrs[attrType];
    if (!targetAttr) {
      return [];
    }
    // TODO: figure out how to remove the `as AbAttrMap[T][]` cast
    return this.attrs.filter((a): a is AbAttrMap[T] => a instanceof targetAttr) as AbAttrMap[T][];
  }
}

/**
 * Builder class for creating new {@linkcode Ability} instances.
 */
export class AbBuilder {
  public readonly id: AbilityId;
  /** The generation the ability was introduced */
  public readonly generation: number;
  public readonly postSummonPriority: number;
  public flags = 0;
  public readonly attrs: AbAttr[] = [];
  public readonly conditions: AbAttrCondition[] = [];

  constructor(id: AbilityId, generation: number, postSummonPriority = 0) {
    this.id = id;
    this.generation = generation;
    this.postSummonPriority = postSummonPriority;
  }

  /**
   * Construct the ability set by this builder
   * @returns A new {@linkcode Ability} instance with the parameters set in this builder.
   */
  public build(): Ability {
    // @ts-expect-error: Typescript doesn't support friend classes, but we only
    // want this builder to be able to create new abilities.
    return new Ability(this);
  }

  /**
   * Create a new {@linkcode AbAttr} instance and add it to this {@linkcode Ability}.
   * @param attrType - The constructor of the {@linkcode AbAttr} to create.
   * @param args - The arguments needed to instantiate the given class.
   * @returns `this`
   */
  attr<T extends Constructor<AbAttr>>(attrType: T, ...args: ConstructorParameters<T>): this {
    const attr = new attrType(...args);
    this.attrs.push(attr);

    return this;
  }

  /**
   * Create a new {@linkcode AbAttr} instance with the given condition and add it to this {@linkcode Ability}.
   * Checked before all other conditions, and is unique to the individual {@linkcode AbAttr} being created.
   * @param condition - The {@linkcode AbAttrCondition} to add.
   * @param attrType - The constructor of the {@linkcode AbAttr} to create.
   * @param args - The arguments needed to instantiate the given class.
   * @returns `this`
   */
  conditionalAttr<T extends Constructor<AbAttr>>(
    condition: AbAttrCondition,
    attrType: T,
    ...args: ConstructorParameters<T>
  ): this {
    const attr = new attrType(...args);
    attr.addCondition(condition);
    this.attrs.push(attr);

    return this;
  }

  /**
   * Make this ability trigger even if the user faints.
   * @returns `this`
   * @remarks
   * This is also required for abilities to trigger when revived via Reviver Seed.
   */
  bypassFaint(): this {
    this.flags |= AB_FLAG_BYPASS_FAINT;
    return this;
  }

  /**
   * Make this ability ignorable by effects like {@linkcode MoveId.SUNSTEEL_STRIKE | Sunsteel Strike} or {@linkcode AbilityId.MOLD_BREAKER | Mold Breaker}.
   * @returns `this`
   */
  ignorable(): this {
    this.flags |= AB_FLAG_IGNORABLE;
    return this;
  }

  /**
   * Make this ability unsuppressable by effects like {@linkcode MoveId.GASTRO_ACID | Gastro Acid} or {@linkcode AbilityId.NEUTRALIZING_GAS | Neutralizing Gas}.
   * @returns `this`
   */
  unsuppressable(): this {
    this.flags |= AB_FLAG_UNSUPPRESSABLE;
    return this;
  }

  /**
   * Make this ability uncopiable by effects like {@linkcode MoveId.ROLE_PLAY | Role Play} or {@linkcode AbilityId.TRACE | Trace}.
   * @returns `this`
   */
  uncopiable(): this {
    this.flags |= AB_FLAG_UNCOPIABLE;
    return this;
  }

  /**
   * Make this ability unreplaceable by effects like {@linkcode MoveId.SIMPLE_BEAM | Simple Beam} or {@linkcode MoveId.ENTRAINMENT | Entrainment}.
   * @returns `this`
   */
  unreplaceable(): this {
    this.flags |= AB_FLAG_UNREPLACEABLE;
    return this;
  }

  /**
   * Add a condition for this ability to be applied.
   * Applies to **all** attributes of the given ability.
   * @param condition - The {@linkcode AbAttrCondition} to add
   * @returns `this`
   * @see {@linkcode AbAttr.canApply} for setting conditions per attribute type
   * @see {@linkcode conditionalAttr} for setting individual conditions per attribute instance
   * @todo Review if this is necessary anymore - this is used extremely sparingly
   */
  condition(condition: AbAttrCondition): this {
    this.conditions.push(condition);

    return this;
  }

  /**
   * Mark an ability as partially implemented.
   * Partial abilities are expected to have some of their core functionality implemented, but may lack
   * certain notable features or interactions with other moves or abilities.
   * @returns `this`
   */
  partial(): this {
    this.flags |= AB_FLAG_PARTIAL;
    return this;
  }

  /**
   * Mark an ability as unimplemented.
   * Unimplemented abilities are ones which have _none_ of their basic functionality enabled.
   * @returns `this`
   */
  unimplemented(): this {
    this.flags |= AB_FLAG_UNIMPLEMENTED;
    return this;
  }

  /**
   * Mark an ability as having one or more edge cases.
   * It may lack certain niche interactions with other moves/abilities, but still functions
   * as intended in most cases.
   * Does not show up in game and is solely for internal dev use.
   *
   * When using this, make sure to **document the edge case** (or else this becomes pointless).
   * @returns `this`
   */
  edgeCase(): this {
    return this;
  }
}
