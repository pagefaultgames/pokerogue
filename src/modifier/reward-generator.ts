import { AttackMove } from "#app/data/moves/move";
import type Pokemon from "#app/field/pokemon";
import { PokemonType } from "#enums/pokemon-type";
import { attackTypeToHeldItem } from "./held-items";
import { HeldItemReward, type Reward } from "./reward";

function getRandomWeightedSelection<T>(weights: Map<T, number>): T | null {
  const totalWeight = Array.from(weights.values()).reduce((sum, weight) => sum + weight, 0);

  if (totalWeight === 0) {
    return null;
  }

  const randInt = Math.floor(Math.random() * totalWeight);

  let accumulatedWeight = 0;
  for (const [item, weight] of weights.entries()) {
    accumulatedWeight += weight;
    if (randInt < accumulatedWeight) {
      return item;
    }
  }

  return null;
}

export class RewardGenerator<T extends number> {
  options: T[];
  tempWeights: Map<T, number>;

  constructor(options: T[]) {
    this.options = options;
    this.tempWeights = new Map(this.options.map(option => [option, 1]));
  }

  generate(party: Pokemon[], overrideWeightFunction?: Function) {
    const weights = overrideWeightFunction ? overrideWeightFunction(party) : this.weightFunction(party);

    for (const [option, tempWeight] of this.tempWeights.entries()) {
      if (tempWeight === 0 && weights.has(option)) {
        weights.set(option, 0);
      }
    }

    const value: T | null = getRandomWeightedSelection(weights);

    if (value) {
      this.tempWeights.set(value, 0);
      return this.generateReward(value);
    }

    return null;
  }

  weightFunction(_party: Pokemon[]): Map<T, number> {
    const defaultWeightMap = new Map<T, number>();

    this.options.forEach(option => {
      defaultWeightMap.set(option, 1);
    });

    return defaultWeightMap;
  }

  generateReward(_value: T): Reward | null {
    return null;
  }
}

export class AttackTypeBoosterHeldItemRewardGenerator extends RewardGenerator<PokemonType> {
  constructor() {
    //TODO: we can also construct this, but then have to handle options being null
    const options = [
      PokemonType.NORMAL,
      PokemonType.FIGHTING,
      PokemonType.FLYING,
      PokemonType.POISON,
      PokemonType.GROUND,
      PokemonType.ROCK,
      PokemonType.BUG,
      PokemonType.GHOST,
      PokemonType.STEEL,
      PokemonType.FIRE,
      PokemonType.WATER,
      PokemonType.GRASS,
      PokemonType.ELECTRIC,
      PokemonType.PSYCHIC,
      PokemonType.ICE,
      PokemonType.DRAGON,
      PokemonType.DARK,
      PokemonType.FAIRY,
    ];
    super(options);
  }

  weightFunction(party: Pokemon[]): Map<PokemonType, number> {
    const attackMoveTypes = party.flatMap(p =>
      p
        .getMoveset()
        .map(m => m.getMove())
        .filter(m => m instanceof AttackMove)
        .map(m => m.type),
    );

    const attackMoveTypeWeights = new Map<PokemonType, number>();

    for (const type of attackMoveTypes) {
      const currentWeight = attackMoveTypeWeights.get(type) ?? 0;
      if (currentWeight < 3) {
        attackMoveTypeWeights.set(type, currentWeight + 1);
      }
    }

    return attackMoveTypeWeights;
  }

  generateReward(value: PokemonType) {
    return new HeldItemReward(attackTypeToHeldItem[value]);
  }
}
