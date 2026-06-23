import { globalScene } from "#app/global-scene";
import { SpeciesFormChangeCompoundTrigger, type SpeciesFormChangeTrigger } from "#data/form-change-triggers";
import type { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import type { Constructor, nil } from "#types/common";

export type SpeciesFormChangeConditionPredicate = (p: Pokemon) => boolean;
export type SpeciesFormChangeConditionEnforceFunc = (p: Pokemon) => void;

interface SpeciesFormChangeConstructor {
  speciesId: SpeciesId;
  preFormKey: string;
  evoFormKey: string;
  trigger: SpeciesFormChangeTrigger;
  quiet?: boolean;
  conditions?: SpeciesFormChangeCondition[];
}

export class SpeciesFormChange {
  public speciesId: SpeciesId;
  public preFormKey: string;
  public formKey: string;
  public trigger: SpeciesFormChangeTrigger;
  public quiet: boolean;
  public readonly conditions: readonly SpeciesFormChangeCondition[];

  constructor(data: SpeciesFormChangeConstructor) {
    this.speciesId = data.speciesId;
    this.preFormKey = data.preFormKey;
    this.formKey = data.evoFormKey;
    this.trigger = data.trigger;
    this.quiet = data.quiet ?? false;
    this.conditions = data.conditions ?? [];
  }

  canChange(pokemon: Pokemon): boolean {
    if (pokemon.species.speciesId !== this.speciesId) {
      return false;
    }

    if (pokemon.species.forms.length === 0) {
      return false;
    }

    const formKeys = pokemon.species.forms.map(f => f.formKey);
    if (formKeys[pokemon.formIndex] !== this.preFormKey) {
      return false;
    }

    if (formKeys[pokemon.formIndex] === this.formKey) {
      return false;
    }

    for (const condition of this.conditions) {
      if (!condition.predicate(pokemon)) {
        return false;
      }
    }

    return this.trigger.canChange(pokemon);
  }

  findTrigger(triggerType: Constructor<SpeciesFormChangeTrigger>): SpeciesFormChangeTrigger | nil {
    if (!this.trigger.hasTriggerType(triggerType)) {
      return null;
    }

    const trigger = this.trigger;

    if (trigger instanceof SpeciesFormChangeCompoundTrigger) {
      return trigger.triggers.find(t => t.hasTriggerType(triggerType));
    }

    return trigger;
  }
}

export class SpeciesFormChangeCondition {
  public predicate: SpeciesFormChangeConditionPredicate;
  public enforceFunc: SpeciesFormChangeConditionEnforceFunc | nil;

  constructor(predicate: SpeciesFormChangeConditionPredicate, enforceFunc?: SpeciesFormChangeConditionEnforceFunc) {
    this.predicate = predicate;
    this.enforceFunc = enforceFunc;
  }
}

/**
 * Gives a condition for form changing checking if a species is registered as caught in the player's dex data.
 * Used for fusion forms such as Kyurem and Necrozma.
 * @param species {@linkcode SpeciesId}
 * @returns A {@linkcode SpeciesFormChangeCondition} checking if that species is registered as caught
 */
export function getSpeciesDependentFormChangeCondition(species: SpeciesId): SpeciesFormChangeCondition {
  return new SpeciesFormChangeCondition(_p => !!globalScene.gameData.dexData[species].caughtAttr);
}
