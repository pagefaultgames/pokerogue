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

  return "";
}

export function getStatusEffectActivationText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return " is hurt\nby poison!";
  case StatusEffect.PARALYSIS:
    return " is paralyzed!\nIt can't move!";
  case StatusEffect.SLEEP:
    return " is fast asleep.";
  case StatusEffect.FREEZE:
    return " is\nfrozen solid!";
  case StatusEffect.BURN:
    return " is hurt\nby its burn!";
  }

  return "";
}

export function getStatusEffectOverlapText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return " is\nalready poisoned!";
  case StatusEffect.PARALYSIS:
    return " is\nalready paralyzed!";
  case StatusEffect.SLEEP:
    return " is\nalready asleep!";
  case StatusEffect.FREEZE:
    return " is\nalready frozen!";
  case StatusEffect.BURN:
    return " is\nalready burned!";
  }

  return "";
}

export function getStatusEffectHealText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return " was\ncured of its poison!";
  case StatusEffect.PARALYSIS:
    return " was\nhealed of paralysis!";
  case StatusEffect.SLEEP:
    return " woke up!";
  case StatusEffect.FREEZE:
    return " was\ndefrosted!";
  case StatusEffect.BURN:
    return " was\nhealed of its burn!";
  }

  return "";
}

export function getStatusEffectDescriptor(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return "poisoning";
  case StatusEffect.PARALYSIS:
    return "paralysis";
  case StatusEffect.SLEEP:
    return "sleep";
  case StatusEffect.FREEZE:
    return "freezing";
  case StatusEffect.BURN:
    return "burn";
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

/**
 * Gets all non volatile status effects
 * @returns A list containing all non volatile status effects
 */
export function getNonVolatileStatusEffects():Array<StatusEffect> {
  return [
    StatusEffect.POISON,
    StatusEffect.TOXIC,
    StatusEffect.PARALYSIS,
    StatusEffect.SLEEP,
    StatusEffect.FREEZE,
    StatusEffect.BURN
  ];
}

/**
 * Returns whether a statuss effect is non volatile.
 * Non-volatile status condition is a status that remains after being switched out.
 * @param status The status to check
 */
export function isNonVolatileStatusEffect(status: StatusEffect): boolean {
  return getNonVolatileStatusEffects().includes(status);
}
