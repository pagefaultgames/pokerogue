import { StatusEffect } from "#enums/status-effect";
import { randIntRange } from "#utils/common";
import type { ParseKeys } from "i18next";
import i18next from "i18next";

export class Status {
  public effect: StatusEffect;
  /** Toxic damage is `1/16 max HP * toxicTurnCount` */
  public toxicTurnCount = 0;
  public sleepTurnsRemaining?: number;

  constructor(effect: StatusEffect, toxicTurnCount = 0, sleepTurnsRemaining?: number) {
    this.effect = effect;
    this.toxicTurnCount = toxicTurnCount;
    this.sleepTurnsRemaining = sleepTurnsRemaining;
  }

  incrementTurn(): void {
    this.toxicTurnCount++;
    if (this.sleepTurnsRemaining) {
      this.sleepTurnsRemaining--;
    }
  }

  isPostTurn(): boolean {
    return (
      this.effect === StatusEffect.POISON || this.effect === StatusEffect.TOXIC || this.effect === StatusEffect.BURN
    );
  }
}

function getStatusEffectMessageKey(statusEffect: StatusEffect | undefined): string {
  switch (statusEffect) {
    case StatusEffect.POISON:
      return "statusEffect:poison";
    case StatusEffect.TOXIC:
      return "statusEffect:toxic";
    case StatusEffect.PARALYSIS:
      return "statusEffect:paralysis";
    case StatusEffect.SLEEP:
      return "statusEffect:sleep";
    case StatusEffect.FREEZE:
      return "statusEffect:freeze";
    case StatusEffect.BURN:
      return "statusEffect:burn";
    default:
      return "statusEffect:none";
  }
}

export function getStatusEffectObtainText(
  statusEffect: StatusEffect | undefined,
  pokemonNameWithAffix: string,
  sourceText?: string,
): string {
  if (statusEffect === StatusEffect.NONE) {
    return "";
  }

  if (!sourceText) {
    const i18nKey = `${getStatusEffectMessageKey(statusEffect)}.obtain` as ParseKeys;
    return i18next.t(i18nKey, { pokemonNameWithAffix });
  }
  const i18nKey = `${getStatusEffectMessageKey(statusEffect)}.obtainSource` as ParseKeys;
  return i18next.t(i18nKey, {
    pokemonNameWithAffix,
    sourceText,
  });
}

export function getStatusEffectActivationText(statusEffect: StatusEffect, pokemonNameWithAffix: string): string {
  if (statusEffect === StatusEffect.NONE) {
    return "";
  }
  const i18nKey = `${getStatusEffectMessageKey(statusEffect)}.activation` as ParseKeys;
  return i18next.t(i18nKey, { pokemonNameWithAffix });
}

export function getStatusEffectOverlapText(statusEffect: StatusEffect, pokemonNameWithAffix: string): string {
  if (statusEffect === StatusEffect.NONE) {
    return "";
  }
  const i18nKey = `${getStatusEffectMessageKey(statusEffect)}.overlap` as ParseKeys;
  return i18next.t(i18nKey, { pokemonNameWithAffix });
}

export function getStatusEffectHealText(statusEffect: StatusEffect, pokemonNameWithAffix: string): string {
  if (statusEffect === StatusEffect.NONE) {
    return "";
  }
  const i18nKey = `${getStatusEffectMessageKey(statusEffect)}.heal` as ParseKeys;
  return i18next.t(i18nKey, { pokemonNameWithAffix });
}

export function getStatusEffectDescriptor(statusEffect: StatusEffect): string {
  if (statusEffect === StatusEffect.NONE) {
    return "";
  }
  const i18nKey = `${getStatusEffectMessageKey(statusEffect)}.description` as ParseKeys;
  return i18next.t(i18nKey);
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
  return randIntRange(1, 6);
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

  return randIntRange(0, 2) ? statusEffectA : statusEffectB;
}

/**
 * Returns a random non-volatile StatusEffect between the two provided
 * @param statusA The first Status
 * @param statusB The second Status
 */
export function getRandomStatus(statusA: Status | null, statusB: Status | null): Status | null {
  if (!statusA || statusA.effect === StatusEffect.NONE || statusA.effect === StatusEffect.FAINT) {
    return statusB;
  }
  if (!statusB || statusB.effect === StatusEffect.NONE || statusB.effect === StatusEffect.FAINT) {
    return statusA;
  }

  return randIntRange(0, 2) ? statusA : statusB;
}

/**
 * Gets all non volatile status effects
 * @returns A list containing all non volatile status effects
 */
export function getNonVolatileStatusEffects(): Array<StatusEffect> {
  return [
    StatusEffect.POISON,
    StatusEffect.TOXIC,
    StatusEffect.PARALYSIS,
    StatusEffect.SLEEP,
    StatusEffect.FREEZE,
    StatusEffect.BURN,
  ];
}

/**
 * Returns whether a status effect is non volatile.
 * Non-volatile status condition is a status that remains after being switched out.
 * @param status The status to check
 */
export function isNonVolatileStatusEffect(status: StatusEffect): boolean {
  return getNonVolatileStatusEffects().includes(status);
}
