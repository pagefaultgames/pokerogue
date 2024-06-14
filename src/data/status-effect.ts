import * as Utils from "../utils";
import i18next from "i18next";

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
  const sourceClause = sourceText ? ` ${statusEffect !== StatusEffect.SLEEP ? i18next.t("statusEffectSourceClause:by") : i18next.t("statusEffectSourceClause:from")} ${sourceText}` : "";
  switch (statusEffect) {
  case StatusEffect.POISON:
    return i18next.t("statusEffectObtainText:poison", { sourceClause });
  case StatusEffect.TOXIC:
    return i18next.t("statusEffectObtainText:toxic", { sourceClause });
  case StatusEffect.PARALYSIS:
    return i18next.t("statusEffectObtainText:paralysis", { sourceClause });
  case StatusEffect.SLEEP:
    return i18next.t("statusEffectObtainText:sleep", { sourceClause });
  case StatusEffect.FREEZE:
    return i18next.t("statusEffectObtainText:freeze", { sourceClause });
  case StatusEffect.BURN:
    return i18next.t("statusEffectObtainText:burn", { sourceClause });
  }

  return "";
}

export function getStatusEffectActivationText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return i18next.t("statusEffectActivationText:poison");
  case StatusEffect.PARALYSIS:
    return i18next.t("statusEffectActivationText:paralysis");
  case StatusEffect.SLEEP:
    return i18next.t("statusEffectActivationText:sleep");
  case StatusEffect.FREEZE:
    return i18next.t("statusEffectActivationText:freeze");
  case StatusEffect.BURN:
    return i18next.t("statusEffectActivationText:burn");
  }

  return "";
}

export function getStatusEffectOverlapText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return i18next.t("statusEffectOverlapText:poison");
  case StatusEffect.PARALYSIS:
    return i18next.t("statusEffectOverlapText:paralysis");
  case StatusEffect.SLEEP:
    return i18next.t("statusEffectOverlapText:sleep");
  case StatusEffect.FREEZE:
    return i18next.t("statusEffectOverlapText:freeze");
  case StatusEffect.BURN:
    return i18next.t("statusEffectOverlapText:burn");
  }

  return "";
}

export function getStatusEffectHealText(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return i18next.t("statusEffectHealText:poison");
  case StatusEffect.PARALYSIS:
    return i18next.t("statusEffectHealText:paralysis");
  case StatusEffect.SLEEP:
    return i18next.t("statusEffectHealText:sleep");
  case StatusEffect.FREEZE:
    return i18next.t("statusEffectHealText:freeze");
  case StatusEffect.BURN:
    return i18next.t("statusEffectHealText:burn");
  }

  return "";
}

export function getStatusEffectDescriptor(statusEffect: StatusEffect): string {
  switch (statusEffect) {
  case StatusEffect.POISON:
  case StatusEffect.TOXIC:
    return i18next.t("statusEffectDescriptor:poison");
  case StatusEffect.PARALYSIS:
    return i18next.t("statusEffectDescriptor:paralysis");
  case StatusEffect.SLEEP:
    return i18next.t("statusEffectDescriptor:sleep");
  case StatusEffect.FREEZE:
    return i18next.t("statusEffectDescriptor:freeze");
  case StatusEffect.BURN:
    return i18next.t("statusEffectDescriptor:burn");
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
