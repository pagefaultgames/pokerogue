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
  const sourceClause = sourceText ? ` ${statusEffect !== StatusEffect.SLEEP ? "by" : "from"} ${sourceText}` : "";
  switch (statusEffect) {
  case StatusEffect.POISON:
    return `\nwas poisoned${sourceClause}! a modif`;
  case StatusEffect.TOXIC:
    return `\nwas badly poisoned${sourceClause}! a modif`;
  case StatusEffect.PARALYSIS:
    return ` was paralyzed${sourceClause}!\nIt may be unable to move! a modif`;
  case StatusEffect.SLEEP:
    return `\nfell asleep${sourceClause}! a modif`;
  case StatusEffect.FREEZE:
    return `\nwas frozen solid${sourceClause}! a modif`;
  case StatusEffect.BURN:
    return `\nwas burned${sourceClause}! a modif`;
  }

  return "";
}

export function getStatusEffectActivationText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return " is hurt\nby poison! a modif";
  case StatusEffect.PARALYSIS:
    return " is paralyzed!\nIt can't move! a modif";
  case StatusEffect.SLEEP:
    return " is fast asleep. a modif";
  case StatusEffect.FREEZE:
    return " is\nfrozen solid! a modif";
  case StatusEffect.BURN:
    return " is hurt\nby its burn! a modif";
  }

  return "";
}

export function getStatusEffectOverlapText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return " is\nalready poisoned! a modif";
  case StatusEffect.PARALYSIS:
    return " is\nalready paralyzed! a modif";
  case StatusEffect.SLEEP:
    return " is\nalready asleep! a modif";
  case StatusEffect.FREEZE:
    return " is\nalready frozen! a modif";
  case StatusEffect.BURN:
    return " is\nalready burned! a modif";
  }

  return "";
}

export function getStatusEffectHealText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return " was\ncured of its poison! a modif";
  case StatusEffect.PARALYSIS:
    return " was\nhealed of paralysis! a modif";
  case StatusEffect.SLEEP:
    return " woke up! a modif";
  case StatusEffect.FREEZE:
    return " was\ndefrosted! a modif";
  case StatusEffect.BURN:
    return " was\nhealed of its burn! a modif";
  }

  return "";
}

export function getStatusEffectDescriptor(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return "poisoning a modif";
  case StatusEffect.PARALYSIS:
    return "paralysis a modif";
  case StatusEffect.SLEEP:
    return "sleep a modif";
  case StatusEffect.FREEZE:
    return "freezing a modif";
  case StatusEffect.BURN:
    return "burn a modif";
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

/**
* Returns a random non-volatile StatusEffect
*/
export function generateRandomStatusEffect(): StatusEffect {
  return Utils.randIntRange(1, 6);
}

/**
* Returns a random non-volatile StatusEffect between the two provided
* @param statusEffectA The first StatusEffect
* @param statusEffectA The second StatusEffect
*/
export function getRandomStatusEffect(statusEffectA: StatusEffect, statusEffectB: StatusEffect): StatusEffect {
  if (statusEffectA === StatusEffect.NONE || statusEffectA === StatusEffect.FAINT) {
    return statusEffectB;
  }
  if (statusEffectB === StatusEffect.NONE || statusEffectB === StatusEffect.FAINT) {
    return statusEffectA;
  }

  return Utils.randIntRange(0, 2) ? statusEffectA : statusEffectB;
}

/**
* Returns a random non-volatile StatusEffect between the two provided
* @param statusA The first Status
* @param statusB The second Status
*/
export function getRandomStatus(statusA: Status, statusB: Status): Status {
  if (statusA === undefined || statusA.effect === StatusEffect.NONE || statusA.effect === StatusEffect.FAINT) {
    return statusB;
  }
  if (statusB === undefined || statusB.effect === StatusEffect.NONE || statusB.effect === StatusEffect.FAINT) {
    return statusA;
  }


  return Utils.randIntRange(0, 2) ? statusA : statusB;
}
