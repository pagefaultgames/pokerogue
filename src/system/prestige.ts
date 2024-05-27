import { Stat } from "#app/data/pokemon-stat";

export enum PrestigeModifierAttribute {
  WILD_POKEMON_ATTACK,
  WILD_POKEMON_DEFENSE,
  WILD_POKEMON_SPEED,
  TRAINER_POKEMON_ATTACK,
  TRAINER_POKEMON_DEFENSE,
  TRAINER_POKEMON_SPEED
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
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.05)
  ],
  // Level 2
  [],
  // Level 3
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.05),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.05)
  ],
  // Level 4
  [],
  // Level 5
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3),
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 1.3)
  ],
  // Level 6
  [],
  // Level 7
  [
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_ATTACK, PrestigeModifierOperation.MULTIPLY, 1.1),
    new PrestigeModifier(PrestigeModifierAttribute.WILD_POKEMON_DEFENSE, PrestigeModifierOperation.MULTIPLY, 1.1)
  ],
  // Level 8
  [],
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
    new PrestigeModifier(PrestigeModifierAttribute.TRAINER_POKEMON_SPEED, PrestigeModifierOperation.MULTIPLY, 2)
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
}
