import * as Utils from "../utils";

export enum StatusEffect {
  NONE,
  POISON,
  TOXIC,
  PARALYSIS,
  SLEEP,
  FREEZE,
  BURN,
  FAINT
}

export class Status {
  public effect: StatusEffect;
  public turnCount: integer;
  public cureTurn: integer;

  constructor(effect: StatusEffect, turnCount: integer = 0, cureTurn?: integer) {
    this.effect = effect;
    this.turnCount = turnCount === undefined ? 0 : turnCount;
    this.cureTurn = cureTurn;
  }

  incrementTurn(): void {
    this.turnCount++;
  }

  isPostTurn(): boolean {
    return this.effect === StatusEffect.POISON || this.effect === StatusEffect.TOXIC || this.effect === StatusEffect.BURN;
  }
}

export function getStatusEffectObtainText(statusEffect: StatusEffect, sourceText?: string): string {
  const sourceClause = sourceText ? ` ${statusEffect !== StatusEffect.SLEEP ? 'by' : 'from'} ${sourceText}` : '';
  switch (statusEffect) {
    case StatusEffect.POISON:
      return `\nwas poisoned${sourceClause}!`;
    case StatusEffect.TOXIC:
      return `\nwas badly poisoned${sourceClause}!`;
    case StatusEffect.PARALYSIS:
      return ` was paralyzed${sourceClause}!\nIt may be unable to move!`;
    case StatusEffect.SLEEP:
      return `\nfell asleep${sourceClause}!`;
    case StatusEffect.FREEZE:
      return `\nwas frozen solid${sourceClause}!`;
    case StatusEffect.BURN:
      return `\nwas burned${sourceClause}!`;
  }

  return '';
}

export function getStatusEffectActivationText(statusEffect: StatusEffect, pokemon: Pokemon): string {
  switch (statusEffect) {
    case StatusEffect.POISON:
    case StatusEffect.TOXIC:
      // Placeholder, idk how to fix this, too new to typeScript, but it functions as normal anyway because of the pokemon && clause always returning the else value
      if (pokemon && pokemon.getAbility().id === Abilities.POISON_HEAL) {
        console.log("Poison Heal ability detected");
        return ' had its HP restored!';
      } else {
        console.log("No Poison Heal ability detected");
        return ' is hurt by poison!';
      }
    case StatusEffect.PARALYSIS:
      return ' is paralyzed! It can\'t move!';
    case StatusEffect.SLEEP:
      return ' is fast asleep.';
    case StatusEffect.FREEZE:
      return ' is frozen solid!';
    case StatusEffect.BURN:
      return ' is hurt by its burn!';
  }

  return '';
}

export function getStatusEffectOverlapText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
    case StatusEffect.POISON:
    case StatusEffect.TOXIC:
      return ' is\nalready poisoned!';
    case StatusEffect.PARALYSIS:
      return ' is\nalready paralyzed!';
    case StatusEffect.SLEEP:
      return ' is\nalready asleep!';
    case StatusEffect.FREEZE:
      return ' is\nalready frozen!';
    case StatusEffect.BURN:
      return ' is\nalready burned!';
  }

  return '';
}

export function getStatusEffectHealText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
    case StatusEffect.POISON:
    case StatusEffect.TOXIC:
      return ' was\ncured of its poison!';
    case StatusEffect.PARALYSIS:
      return ' was\nhealed of paralysis!';
    case StatusEffect.SLEEP:
      return ' woke up!';
    case StatusEffect.FREEZE:
      return ' was\ndefrosted!';
    case StatusEffect.BURN:
      return ' was\nhealed of its burn!';
  }

  return '';
}

export function getStatusEffectDescriptor(statusEffect: StatusEffect): string {
  switch (statusEffect) {
    case StatusEffect.POISON:
    case StatusEffect.TOXIC:
      return 'poisoning';
    case StatusEffect.PARALYSIS:
      return 'paralysis';
    case StatusEffect.SLEEP:
      return 'sleep';
    case StatusEffect.FREEZE:
      return 'freezing';
    case StatusEffect.BURN:
      return 'burn';
  }
}

export function getStatusEffectCatchRateMultiplier(statusEffect: StatusEffect): number {
  switch (statusEffect) {
    case StatusEffect.POISON:
    case StatusEffect.TOXIC:
    case StatusEffect.PARALYSIS:
    case StatusEffect.BURN:
      return 1.5;
    case StatusEffect.SLEEP:
    case StatusEffect.FREEZE:
      return 2.5;
  }

  return 1;
}
