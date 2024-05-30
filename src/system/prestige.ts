export enum PrestigeModifierAttribute {}

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
  [],
  // Level 2
  [],
  // Level 3
  [],
  // Level 4
  [],
  // Level 5
  [],
  // Level 6
  [],
  // Level 7
  [],
  // Level 8
  [],
  // Level 9
  [],
  // Level 10
  []
];

class PrestigeModifierNameNotImplementedError extends Error {
  constructor(attribute: PrestigeModifierAttribute) {
    super(`Attribute ${attribute} is not implemented`);
  }
}

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
   * Get the descriptions for the given prestige level
   *
   * @param prestigeLevel
   * @returns the description
   */
  public static getLevelDescriptionsUntil(prestigeLevel: integer): string[] {
    const modifiers = this.compileModifiers(this.getModifiersUntil(prestigeLevel));
    return this.getDescriptionsForModifiers(modifiers);
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

  /**
   * Compile the modifiers together to avoid attribute duplicates
   *
   * @param modifiers
   * @returns the compiled modifiers
   */
  private static compileModifiers(modifiers: PrestigeModifier[]): PrestigeModifier[] {
    return modifiers.reduce((acc, modifier) => {
      if (acc.some(m => m.attribute === modifier.attribute && m.operation === modifier.operation)) {
        return acc.map(m => {
          if (m.attribute === modifier.attribute) {
            switch (modifier.operation) {
            case PrestigeModifierOperation.ADD:
              return new PrestigeModifier(m.attribute, m.operation, m.value + modifier.value);
            case PrestigeModifierOperation.MULTIPLY:
              return new PrestigeModifier(m.attribute, m.operation, m.value * modifier.value);
            }
          }
          return m;
        });
      } else {
        return [...acc, modifier];
      }
    }, []);
  }

  /**
   * Get the descriptions for the given modifiers
   *
   * @param modifiers
   * @returns the descriptions
   */
  private static getDescriptionsForModifiers(modifiers: PrestigeModifier[]): string[] {
    return modifiers.sort((a, b) => a.attribute - b.attribute)
      .map(modifier => this.getDescriptionForModifier(modifier))
      .filter(description => description !== undefined);
  }

  private static getDescriptionForModifier(modifier: PrestigeModifier): string | undefined {
    switch (modifier.operation) {
    case PrestigeModifierOperation.ADD:
      if (modifier.value === 0) {
        return undefined;
      }
      const roundedValue = Math.abs(Math.round(modifier.value));
      if (modifier.value > 0) {
        return `${this.getModifierAttributeName(modifier.attribute)} + ${roundedValue}`;
      } else if (modifier.value < 0) {
        return `${this.getModifierAttributeName(modifier.attribute)} - ${roundedValue} `;
      }
    case PrestigeModifierOperation.MULTIPLY:
      if (modifier.value === 1) {
        return undefined;
      }
      const roundedPercentageValue = Math.abs(Math.round((modifier.value - 1) * 100));
      if (modifier.value > 1) {
        return `${this.getModifierAttributeName(modifier.attribute)} + ${roundedPercentageValue}%`;
      } else if (modifier.value < 1) {
        return `${this.getModifierAttributeName(modifier.attribute)} - ${roundedPercentageValue}%`;
      }
    }
  }

  /**
   * Get the attribute name for the given attribute
   *
   * @param attribute
   * @throws PrestigeModifierNameNotImplementedError if the attribute is not implemented
   * @returns the attribute name
   */
  private static getModifierAttributeName(attribute: PrestigeModifierAttribute): string {
    switch (attribute) {
    default:
      throw new PrestigeModifierNameNotImplementedError(attribute);
    }
  }
}
