import { globalScene } from "#app/global-scene";
import type { PokemonSpeciesForm } from "#data/pokemon-species";
import type { Pokemon } from "#field/pokemon";
import type {
  AbAttrBaseParams,
  AbAttrMap,
  AbAttrParamMap,
  AbAttrString,
  CallableAbAttrString,
} from "#types/ability-types";

type AbAttrPredicate<T extends AbAttrString> = (attr: AbAttrMap[T]) => boolean;

interface ApplyAbAttrConfig<T extends AbAttrString> {
  /** An optional array to which ability trigger messges will be added */
  messages?: string[];
  /**
   * An optional filter to use when determining what attributes to use.
   * Any {@linkcode AbAttr}s for which this returns `false` will be skipped during attribute application.
   */
  attrFilter?: AbAttrPredicate<T>;
}

function applySingleAbAttrs<T extends AbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  { attrFilter = () => true, messages }: ApplyAbAttrConfig<T> = {},
) {
  const { simulated = false, passive = false, pokemon } = params;
  if (!pokemon.canApplyAbility(passive) || (passive && pokemon.getPassiveAbility().id === pokemon.getAbility().id)) {
    return;
  }

  const ability = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
  const attrs = ability.getAttrs(attrType);

  for (const attr of attrs) {
    if (!attrFilter(attr)) {
      continue;
    }

    // TODO: Make `getCondition` default to `() => true` instead of `null`
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
      messages?.push(message);
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
  config: ApplyAbAttrConfig<T>,
) {
  // If the pokemon is not defined, no ability attributes to be applied.
  // This check is necessary because of callers secretly passing `null`s to this function
  // TODO: Find and remove all instances where this occurs
  if (!params.pokemon) {
    return;
  }
  if (params.passive !== undefined) {
    applySingleAbAttrs(attrType, params, config);
    return;
  }

  for (const passive of [false, true]) {
    params.passive = passive;
    applySingleAbAttrs(attrType, params, config);
  }
  // Restore passive if it was undefined on entry to allow re-use of parameter objects
  params.passive = undefined;
}

/**
 * Apply all ability attributes matching the given type.
 * @param attrType - The name of the ability attribute to apply
 * @param params - The parameters to pass to the ability attribute's `apply` method
 * @param messages - An optional array to which ability trigger messges will be added
 */
export function applyAbAttrs<T extends CallableAbAttrString>(
  attrType: T,
  params: AbAttrParamMap[T],
  messages?: string[],
): void {
  applyAbAttrsInternal(attrType, params, { messages });
}

// TODO: Improve the type signatures of the following methods / refactor the apply methods

/**
 * `AbAttrPredicate` used to avoid triggering Imposter and other non re-activating `PostSummonAbAttr`s
 * when gaining the ability again.
 */
const postSummonGainedMidTurnCondition: AbAttrPredicate<"PostSummonAbAttr"> = attr => attr.shouldActivateOnGain();

/**
 * Applies abilities when they become active mid-turn through **temporary** effects
 * (such as from ability-changing or suppressing effects).
 *
 * Ignores passives as they don't change and shouldn't be reapplied when main abilities change
 */
// TODO: Rework to call `applyAbAttrsInternal` rather than iterating over `[false, true]` at callsites
export function applyOnGainAbAttrs(params: AbAttrBaseParams): void {
  applySingleAbAttrs("PostSummonAbAttr", params, { attrFilter: postSummonGainedMidTurnCondition });
}

/**
 * Applies effects of abilities when they become active mid-turn from a Pokemon changing its form.
 *
 * @param params - The parameters to pass to the ability attribute's `apply` method
 * @param formChange - The Pokemon's previous {@linkcode PokemonSpeciesForm | form change}
 * @remarks
 * Unlike {@linkcode applyOnGainAbAttrs}, this will only apply abilities or passives if
 * the prior form did not have that same ability/passive, and will NOT apply any attributes
 * that extend `PostSummonFormChangeAbAttr` under any circumstances.
 */
export function applyPostFormChangeAbAttrs(
  params: Omit<AbAttrBaseParams, "passive">,
  formChange: PokemonSpeciesForm,
): void {
  // NB: This behavior of "only apply changed abilities" would diverge from mainline Mega Evolution behavior
  // (e.g. Mega Tyranitar/Sand Stream);
  // if such behavior is ever desired in future, this behavior must be reworked to allow that.

  const { pokemon } = params;
  const [activeChanged, passiveChanged] = hasDifferentFormAbilities(pokemon, formChange);

  if (activeChanged) {
    applyAbAttrsInternal(
      "PostSummonAbAttr",
      { ...params, passive: false },
      {
        attrFilter: attr => !attr.is("PostSummonFormChangeAbAttr"),
      },
    );
  }
  if (passiveChanged) {
    applyAbAttrsInternal(
      "PostSummonAbAttr",
      { ...params, passive: true },
      {
        attrFilter: attr => !attr.is("PostSummonFormChangeAbAttr"),
      },
    );
  }
}

/**
 * Applies ability attributes which activate when the ability is lost or suppressed (i.e. primal weather)
 */
export function applyOnLoseAbAttrs(params: AbAttrBaseParams): void {
  applySingleAbAttrs("PreLeaveFieldAbAttr", params);

  applySingleAbAttrs("IllusionBreakAbAttr", params);
}

/**
 * Helper function to return whether a {@linkcode Pokemon}'s ability has changed after changing forms.
 *
 * Used when re-triggering on-gain abilities.
 * @param pokemon - The {@linkcode Pokemon} having changed forms
 * @param prevForm - The previous form `pokemon` had prior to changing forms
 * @returns A 2-length tuple containing whether `pokemon`'s active/passive abilities have changed from its previous form.
 * If `pokemon` does not have its passive enabled, it will count as not changing.
 * @remarks
 * Does _not_ check for ability-overridding effects.
 */
function hasDifferentFormAbilities(
  pokemon: Pokemon,
  prevForm: PokemonSpeciesForm,
): [active: boolean, passive: boolean] {
  const { abilityIndex, species } = pokemon;

  const diffActive = species.getAbility(abilityIndex) !== prevForm.getAbility(abilityIndex);
  const diffPassive = pokemon.hasPassive() && species.getPassiveAbility() !== prevForm.getPassiveAbility();
  return [diffActive, diffPassive];
}
