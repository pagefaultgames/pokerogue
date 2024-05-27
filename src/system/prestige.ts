export enum PrestigeModifierAttribute {
  SHOP_ITEM_PRICES
}

enum PrestigeModifierOperation {
  ADD,
  MULTIPLY
}

class PrestigeModifier {
  attribute: PrestigeModifierAttribute;
  value: number;
  operation: PrestigeModifierOperation;

  constructor(attribute: PrestigeModifierAttribute, operation: PrestigeModifierOperation, value: number) {
    this.attribute = attribute;
    this.operation = operation;
    this.value = value;
  }
}

const PRESTIGE_MODIFIERS: PrestigeModifier[][] = [
  // Level 0 - Should be empty
  [],
  // Level 1
  [
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.1),
  ],
  // Level 2
  [],
  // Level 3
  [],
  // Level 4
  [
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.2)
  ],
  // Level 5
  [],
  // Level 6
  [],
  // Level 7
  [],
  // Level 8
  [
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.3)
  ],
  // Level 9
  [],
  // Level 10
  [
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.4)
  ]
];

export abstract class Prestige {
  public static readonly MAX_LEVEL = PRESTIGE_MODIFIERS.length - 1;

  /**
   * Get the modified value for the given attribute knowing the prestige level
   *
   * @param prestigeLevel
   * @param attribute
   * @param value
   * @returns the modified value
   */
  public static getModifiedValue(prestigeLevel: integer, attribute: PrestigeModifierAttribute, value: number): number {
    if (prestigeLevel === 0) {
      return value;
    }
    return this.getModifiersUntil(prestigeLevel)
      .filter(modifier => modifier.attribute === attribute)
      .reduce((acc, modifier) => {
        switch (modifier.operation) {
        case PrestigeModifierOperation.ADD:
          return acc + modifier.value;
        case PrestigeModifierOperation.MULTIPLY:
          return acc * modifier.value;
        }
      }, value);
  }

  /**
   * Get the modifiers until the given prestige level
   *
   * @param prestigeLevel
   * @returns the modifiers
   */
  private static getModifiersUntil(prestigeLevel: integer): PrestigeModifier[] {
    return PRESTIGE_MODIFIERS.slice(0, Math.min(prestigeLevel + 1, this.MAX_LEVEL + 1)).flat();
  }
}
