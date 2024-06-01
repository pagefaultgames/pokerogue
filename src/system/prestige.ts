import { Stat } from "#app/data/pokemon-stat";
import i18next from "i18next";

export enum PrestigeModifierAttribute {
  WILD_POKEMON_ATTACK = "wild_pokemon_attack",
  WILD_POKEMON_DEFENSE = "wild_pokemon_defense",
  WILD_POKEMON_SPEED = "wild_pokemon_speed",
  TRAINER_POKEMON_ATTACK = "trainer_pokemon_attack",
  TRAINER_POKEMON_DEFENSE = "trainer_pokemon_defense",
  TRAINER_POKEMON_SPEED = "trainer_pokemon_speed",
  SHOP_ITEM_PRICES = "shop_item_prices",
  POKEMON_EXP_GAIN = "pokemon_exp_gain",
  PARTY_LUCK = "party_luck",
  STARTER_PARTY_POINTS = "start_party_points"
}

enum PrestigeModifierOperation {
  ADD = "add",
  MULTIPLY = "multiply"
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
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -1)
  ],
  // Level 2
  [
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -1),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -2)
  ],
  // Level 3
  [
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.9),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -2),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -3)
  ],
  // Level 4
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.15),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.15),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.9),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -2),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -4)
  ],
  // Level 5
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.9),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -3),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -5)
  ],
  // Level 6
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.2),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.5),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.85),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -4),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -6)
  ],
  // Level 7
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.4),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.4),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.4),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.45),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.45),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.45),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.5),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.85),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -5),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -7)
  ],
  // Level 8
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.6),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.6),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.8),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.6),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.6),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.8),
    new PrestigeModifier(PrestigeModifierAttribute.SHOP_ITEM_PRICES, PrestigeModifierOperation.MULTIPLY, 1.8),
    new PrestigeModifier(PrestigeModifierAttribute.POKEMON_EXP_GAIN, PrestigeModifierOperation.MULTIPLY, 0.75),
    new PrestigeModifier(PrestigeModifierAttribute.PARTY_LUCK, PrestigeModifierOperation.ADD, -6),
    new PrestigeModifier(PrestigeModifierAttribute.STARTER_PARTY_POINTS, PrestigeModifierOperation.ADD, -8)
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
    return this.getModifiersForLevel(prestigeLevel)
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
  public static getLevelDescriptionsForLevel(prestigeLevel: integer): string[] {
    return this.getDescriptionsForModifiers(this.getModifiersForLevel(prestigeLevel));
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
   * Get the modifiers for the given prestige level
   *
   * @param prestigeLevel
   * @returns the modifiers
   */
  private static getModifiersForLevel(prestigeLevel: integer): PrestigeModifier[] {
    return PRESTIGE_MODIFIERS[Math.min(Math.max(prestigeLevel, 1), this.MAX_LEVEL)];
  }

  /**
   * Get the descriptions for the given modifiers
   *
   * @param modifiers
   * @returns the descriptions
   */
  private static getDescriptionsForModifiers(modifiers: PrestigeModifier[]): string[] {
    return modifiers.map(modifier => this.getDescriptionForModifier(modifier))
      .filter(description => description !== undefined);
  }

  /**
   * Get the description for the given modifier
   *
   * @param modifier
   * @returns the description
   */
  private static getDescriptionForModifier(modifier: PrestigeModifier): string | undefined {
    switch (modifier.operation) {
    case PrestigeModifierOperation.ADD:
      if (modifier.value === 0) {
        return undefined;
      }
      const roundedValue = Math.abs(Math.round(modifier.value));
      if (modifier.value > 0) {
        return i18next.t(`prestige:attributes.${modifier.attribute}`, { modifier: i18next.t(`prestige:operations.${modifier.operation}.+`, { value: roundedValue }) });
      } else if (modifier.value < 0) {
        return i18next.t(`prestige:attributes.${modifier.attribute}`, { modifier: i18next.t(`prestige:operations.${modifier.operation}.-`, { value: roundedValue }) });
      }
    case PrestigeModifierOperation.MULTIPLY:
      if (modifier.value === 1) {
        return undefined;
      }
      const roundedPercentageValue = Math.abs(Math.round((modifier.value - 1) * 100));
      if (modifier.value > 1) {
        return i18next.t(`prestige:attributes.${modifier.attribute}`, { modifier: i18next.t(`prestige:operations.${modifier.operation}.+`, { value: roundedPercentageValue }) });
      } else if (modifier.value < 1) {
        return i18next.t(`prestige:attributes.${modifier.attribute}`, { modifier: i18next.t(`prestige:operations.${modifier.operation}.-`, { value: roundedPercentageValue }) });
      }
    }
  }
}
