import type { AbAttrParamMap } from "#app/@types/ability-types";
import type { AbAttrBaseParams, AbAttrString, CallableAbAttrString } from "#app/@types/ability-types";
import { globalScene } from "#app/global-scene";

function applySingleAbAttrs<T extends AbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  gainedMidTurn = false,
  messages: string[] = [],
) {
  const { simulated = false, passive = false, pokemon } = params;
  if (!pokemon?.canApplyAbility(passive) || (passive && pokemon.getPassiveAbility().id === pokemon.getAbility().id)) {
    return;
  }

  const ability = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
  if (
    gainedMidTurn &&
    ability.getAttrs(attrType).some(attr => {
      attr.is("PostSummonAbAttr") && !attr.shouldActivateOnGain();
    })
  ) {
    return;
  }

  // typescript assert
  for (const attr of ability.getAttrs(attrType)) {
    const condition = attr.getCondition();
    let abShown = false;
    if (
      (condition && !condition(pokemon)) ||
      // @ts-ignore: typescript can't unify the type of params with the generic type that was passed
      !attr.canApply(params)
    ) {
      continue;
    }

    globalScene.phaseManager.setPhaseQueueSplice();

    if (attr.showAbility && !simulated) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, true);
      abShown = true;
    }
    // @ts-expect-error - typescript can't unify the type of params with the generic type that was passed
    const message = attr.getTriggerMessage(params, ability.name);
    if (message) {
      if (!simulated) {
        globalScene.phaseManager.queueMessage(message);
      }
      messages.push(message);
    }

    // @ts-ignore: typescript can't unify the type of params with the generic type that was passed
    attr.apply(params);

    if (abShown) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, false);
    }

    if (!simulated) {
      pokemon.waveData.abilitiesApplied.add(ability.id);
    }

    globalScene.phaseManager.clearPhaseQueueSplice();
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
    // We need to restore passive to its original state in case it was undefined earlier
    // this is necessary in case this method is called with an object that is reused.
    params.passive = undefined;
  }
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
