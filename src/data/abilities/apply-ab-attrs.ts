import type { AbAttrParamMap } from "#app/@types/ab-attr-types";
import type { AbAttr, AbAttrBaseParams, AbAttrMap, CallableAbAttrString } from "#app/@types/ability-types";
import { globalScene } from "#app/global-scene";

function applySingleAbAttrs<T extends CallableAbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  gainedMidTurn = false,
  messages: string[] = [],
) {
  const { simulated = false, passive = false, pokemon } = params;
  if (!pokemon?.canApplyAbility(passive) || (passive && pokemon.getPassiveAbility().id === pokemon.getAbility().id)) {
    return;
  }

  const attr = 1 as unknown as AbAttr;

  if (attr.is("BlockRedirectAbAttr")) {
    attr
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
    if ((condition && !condition(pokemon)) || !attr.canApply(params)) {
      continue;
    }

    globalScene.phaseManager.setPhaseQueueSplice();

    if (attr.showAbility && !simulated) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, true);
      abShown = true;
    }
    const message = attr.getTriggerMessage(params, ability.name);
    if (message) {
      if (!simulated) {
        globalScene.phaseManager.queueMessage(message);
      }
      messages.push(message);
    }

    

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
  params: Parameters<AbAttrMap[T]["apply"]>[0],
  messages: string[] = [],
  gainedMidTurn = false,
) {
  const { pokemon } = params;
  for (const passive of [false, true]) {
    if (pokemon) {
      applySingleAbAttrs(attrType, { ...params, passive }, gainedMidTurn, messages);
      globalScene.phaseManager.clearPhaseQueueSplice();
    }
  }
}

/**
 * @param attrType - The type of the ability attribute to apply
 * @param params - The parameters to pass to the ability attribute's apply method
 */
export function applyAbAttrs<T extends CallableAbAttrString>(
  attrType: T,
  params: Parameters<AbAttrMap[T]["apply"]>[0],
): void {
  applyAbAttrsInternal(attrType, params);
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
export function applyOnLoseAbAttrs(params): void {
  applySingleAbAttrs("PreLeaveFieldAbAttr");

  applySingleAbAttrs(
    pokemon,
    passive,
    "IllusionBreakAbAttr",
    (attr, passive) => attr.apply(pokemon, passive, simulated, null, args),
    (attr, passive) => attr.canApply(pokemon, passive, simulated, args),
    args,
    true,
    simulated,
  );
}
