import { globalScene } from "#app/global-scene";
import type { AbAttrBaseParams, AbAttrParamMap, AbAttrString, CallableAbAttrString } from "#types/ability-types";

function applySingleAbAttrs<T extends AbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  gainedMidTurn = false,
  messages: string[] = [],
) {
  const { simulated = false, passive = false, pokemon } = params;
  if (!pokemon.canApplyAbility(passive) || (passive && pokemon.getPassiveAbility().id === pokemon.getAbility().id)) {
    return;
  }

  const ability = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
  const attrs = ability.getAttrs(attrType);
  if (gainedMidTurn && attrs.some(attr => attr.is("PostSummonAbAttr") && !attr.shouldActivateOnGain())) {
    return;
  }

  for (const attr of attrs) {
    const condition = attr.getCondition();
    // We require an `as any` cast to suppress an error about the `params` type not being assignable to
    // the type of the argument expected by `attr.canApply()`. This is OK, because we know that
    // `attr` is an instance of the `attrType` class provided to the method, and typescript _will_ check
    // that the `params` object has the correct properties for that class at the callsites.
    if ((condition && !condition(pokemon)) || !attr.canApply(params as any)) {
      continue;
    }

    let abShown = false;

    if (attr.showAbility && !simulated) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, true);
      abShown = true;
    }

    const message = attr.getTriggerMessage(params as any, ability.name);
    if (message) {
      if (!simulated) {
        globalScene.phaseManager.queueMessage(message);
      }
      // TODO: Should messages be added to the array if they aren't actually shown?
      messages.push(message);
    }
    // The `as any` cast here uses the same reasoning as above.
    attr.apply(params as any);

    if (abShown) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, false);
    }

    if (!simulated) {
      pokemon.waveData.abilitiesApplied.add(ability.id);
    }
  }
}

function applyAbAttrsInternal<T extends CallableAbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  messages: string[] = [],
  gainedMidTurn = false,
) {
  // If the pokemon is not defined, no ability attributes to be applied.
  // TODO: Evaluate whether this check is even necessary anymore
  if (!params.pokemon) {
    return;
  }
  if (params.passive !== undefined) {
    applySingleAbAttrs(attrType, params, gainedMidTurn, messages);
    return;
  }
  for (const passive of [false, true]) {
    params.passive = passive;
    applySingleAbAttrs(attrType, params, gainedMidTurn, messages);
    globalScene.phaseManager.clearPhaseQueueSplice();
  }
  // We need to restore passive to its original state in the case that it was undefined on entry
  // this is necessary in case this method is called with an object that is reused.
  params.passive = undefined;
}

/**
 * @param attrType - The type of the ability attribute to apply. (note: may not be any attribute that extends PostSummonAbAttr)
 * @param params - The parameters to pass to the ability attribute's apply method
 * @param messages - An optional array to which ability trigger messges will be added
 */
export function applyAbAttrs<T extends CallableAbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  messages?: string[],
): void {
  applyAbAttrsInternal(attrType, params, messages);
}

// TODO: Improve the type signatures of the following methods / refactor the apply methods

/**
 * Applies abilities when they become active mid-turn (ability switch)
 *
 * Ignores passives as they don't change and shouldn't be reapplied when main abilities change
 */
export function applyOnGainAbAttrs(params: AbAttrBaseParams): void {
  applySingleAbAttrs("PostSummonAbAttr", params, true);
}

/**
 * Applies ability attributes which activate when the ability is lost or suppressed (i.e. primal weather)
 */
export function applyOnLoseAbAttrs(params: AbAttrBaseParams): void {
  applySingleAbAttrs("PreLeaveFieldAbAttr", params, true);

  applySingleAbAttrs("IllusionBreakAbAttr", params, true);
}
