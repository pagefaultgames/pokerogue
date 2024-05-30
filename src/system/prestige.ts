import { Stat } from "#app/data/pokemon-stat";

export enum PrestigeModifierAttribute {
  WILD_POKEMON_ATTACK,
  WILD_POKEMON_DEFENSE,
  WILD_POKEMON_SPEED,
  TRAINER_POKEMON_ATTACK,
  TRAINER_POKEMON_DEFENSE,
  TRAINER_POKEMON_SPEED,
  SHOP_ITEM_PRICES,
  POKEMON_EXP_GAIN,
  PARTY_LUCK,
  STARTER_PARTY_POINTS
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
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -2)
  ],
  // Level 2
  [
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -1)
  ],
  // Level 3
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.9)
  ],
  // Level 4
  [
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.2)
  ],
  // Level 5
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -2)
  ],
  // Level 6
  [
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.85),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -3)
  ],
  // Level 7
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1)
  ],
  // Level 8
  [
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -3)
  ],
  // Level 9
  [
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1)
  ],
  // Level 10
  [
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 2),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.4),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.8),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -4),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -4)
  ]
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
   * Get the modifier attribute for the given stat and if the pokemon is wild or not
   *
   * @param stat
   * @param isWildPokemon
   * @returns the modifier attribute
   */
  public static getModifierAttributeFromStat(stat: Stat, isWildPokemon: boolean = true): PrestigeModifierAttribute {
    switch (stat) {
    case Stat.ATK:
    case Stat.SPATK:
      return isWildPokemon ? PrestigeModifierAttribute.WILD_POKEMON_ATTACK : PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK;
    case Stat.DEF:
    case Stat.SPDEF:
      return isWildPokemon ? PrestigeModifierAttribute.WILD_POKEMON_DEFENSE : PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE;
    case Stat.SPD:
      return isWildPokemon ? PrestigeModifierAttribute.WILD_POKEMON_SPEED : PrestigeModifierAttribute.TRAINER_POKEMON_SPEED;
    default:
      return null;
    }
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
    case PrestigeModifierAttribute.WILD_POKEMON_ATTACK:
      return "Wild Pokémon Attack";
    case PrestigeModifierAttribute.WILD_POKEMON_DEFENSE:
      return "Wild Pokémon Defense";
    case PrestigeModifierAttribute.WILD_POKEMON_SPEED:
      return "Wild Pokémon Speed";
    case PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK:
      return "Trainer Pokémon Attack";
    case PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE:
      return "Trainer Pokémon Defense";
    case PrestigeModifierAttribute.TRAINER_POKEMON_SPEED:
      return "Trainer Pokémon Speed";
    case PrestigeModifierAttribute.SHOP_ITEM_PRICES:
      return "Shop Item Prices";
    case PrestigeModifierAttribute.POKEMON_EXP_GAIN:
      return "Pokémon Exp. Gain";
    case PrestigeModifierAttribute.PARTY_LUCK:
      return "Party Luck";
    case PrestigeModifierAttribute.STARTER_PARTY_POINTS:
      return "Starter Party Points";
    default:
      throw new PrestigeModifierNameNotImplementedError(attribute);
    }
  }
}
