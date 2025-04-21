import { Abilities } from "#enums/abilities";
import type { AbAttrCondition } from "#app/@types/ability-types";
import type { AbAttr } from "#app/data/abilities/ab-attrs/ab-attr";
import i18next from "i18next";
import type { Localizable } from "#app/interfaces/locales";
import type { Constructor } from "#app/utils/common";

export class Ability implements Localizable {
  public id: Abilities;

  private nameAppend: string;
  public name: string;
  public description: string;
  public generation: number;
  public isBypassFaint: boolean;
  public isIgnorable: boolean;
  public isSuppressable = true;
  public isCopiable = true;
  public isReplaceable = true;
  public attrs: AbAttr[];
  public conditions: AbAttrCondition[];

  constructor(id: Abilities, generation: number) {
    this.id = id;

    this.nameAppend = "";
    this.generation = generation;
    this.attrs = [];
    this.conditions = [];

    this.isSuppressable = true;
    this.isCopiable = true;
    this.isReplaceable = true;

    this.localize();
  }

  public get isSwappable(): boolean {
    return this.isCopiable && this.isReplaceable;
  }
  localize(): void {
    const i18nKey = Abilities[this.id]
      .split("_")
      .filter(f => f)
      .map((f, i) => (i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()))
      .join("") as string;

    this.name = this.id ? `${i18next.t(`ability:${i18nKey}.name`) as string}${this.nameAppend}` : "";
    this.description = this.id ? (i18next.t(`ability:${i18nKey}.description`) as string) : "";
  }

  /**
   * Get all ability attributes that match `attrType`
   * @param attrType any attribute that extends {@linkcode AbAttr}
   * @returns Array of attributes that match `attrType`, Empty Array if none match.
   */
  getAttrs<T extends AbAttr>(attrType: Constructor<T>): T[] {
    return this.attrs.filter((a): a is T => a instanceof attrType);
  }

  /**
   * Check if an ability has an attribute that matches `attrType`
   * @param attrType any attribute that extends {@linkcode AbAttr}
   * @returns true if the ability has attribute `attrType`
   */
  hasAttr<T extends AbAttr>(attrType: Constructor<T>): boolean {
    return this.attrs.some(attr => attr instanceof attrType);
  }

  attr<T extends Constructor<AbAttr>>(AttrType: T, ...args: ConstructorParameters<T>): Ability {
    const attr = new AttrType(...args);
    this.attrs.push(attr);

    return this;
  }

  conditionalAttr<T extends Constructor<AbAttr>>(
    condition: AbAttrCondition,
    AttrType: T,
    ...args: ConstructorParameters<T>
  ): Ability {
    const attr = new AttrType(...args);
    attr.addCondition(condition);
    this.attrs.push(attr);

    return this;
  }

  bypassFaint(): Ability {
    this.isBypassFaint = true;
    return this;
  }

  ignorable(): Ability {
    this.isIgnorable = true;
    return this;
  }

  unsuppressable(): Ability {
    this.isSuppressable = false;
    return this;
  }

  uncopiable(): Ability {
    this.isCopiable = false;
    return this;
  }

  unreplaceable(): Ability {
    this.isReplaceable = false;
    return this;
  }

  condition(condition: AbAttrCondition): Ability {
    this.conditions.push(condition);

    return this;
  }

  partial(): this {
    this.nameAppend += " (P)";
    return this;
  }

  unimplemented(): this {
    this.nameAppend += " (N)";
    return this;
  }

  /**
   * Internal flag used for developers to document edge cases. When using this, please be sure to document the edge case.
   * @returns the ability
   */
  edgeCase(): this {
    return this;
  }
}
