import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import { StatusEffect } from "#enums/status-effect";
import type { TimeOfDay } from "#enums/time-of-day";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { PokemonFormChangeItemModifier } from "#modifiers/modifier";
import { type Constructor, coerceArray } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

export abstract class SpeciesFormChangeTrigger {
  public description = "";

  canChange(_pokemon: Pokemon): boolean {
    return true;
  }

  hasTriggerType(triggerType: Constructor<SpeciesFormChangeTrigger>): boolean {
    return this instanceof triggerType;
  }
}

export class SpeciesFormChangeManualTrigger extends SpeciesFormChangeTrigger {}

export class SpeciesFormChangeAbilityTrigger extends SpeciesFormChangeTrigger {
  public description: string = i18next.t("pokemonEvolutions:forms.ability");
}

export class SpeciesFormChangeCompoundTrigger {
  public description = "";
  public triggers: SpeciesFormChangeTrigger[];

  constructor(...triggers: SpeciesFormChangeTrigger[]) {
    this.triggers = triggers;
    this.description = this.triggers
      .filter(trigger => trigger?.description?.length > 0)
      .map(trigger => trigger.description)
      .join(", ");
  }

  canChange(pokemon: Pokemon): boolean {
    for (const trigger of this.triggers) {
      if (!trigger.canChange(pokemon)) {
        return false;
      }
    }

    return true;
  }

  hasTriggerType(triggerType: Constructor<SpeciesFormChangeTrigger>): boolean {
    return !!this.triggers.find(t => t.hasTriggerType(triggerType));
  }
}

export class SpeciesFormChangeItemTrigger extends SpeciesFormChangeTrigger {
  public item: FormChangeItem;
  public active: boolean;

  constructor(item: FormChangeItem, active = true) {
    super();
    this.item = item;
    this.active = active;
    this.description = this.active
      ? i18next.t("pokemonEvolutions:forms.item", {
          item: i18next.t(`modifierType:FormChangeItem.${FormChangeItem[this.item]}`),
        })
      : i18next.t("pokemonEvolutions:forms.deactivateItem", {
          item: i18next.t(`modifierType:FormChangeItem.${FormChangeItem[this.item]}`),
        });
  }

  canChange(pokemon: Pokemon): boolean {
    return !!globalScene.findModifier(r => {
      // Assume that if m has the `formChangeItem` property, then it is a PokemonFormChangeItemModifier
      const m = r as PokemonFormChangeItemModifier;
      return (
        "formChangeItem" in m
        && m.pokemonId === pokemon.id
        && m.formChangeItem === this.item
        && m.active === this.active
      );
    });
  }
}

export class SpeciesFormChangeTimeOfDayTrigger extends SpeciesFormChangeTrigger {
  public timesOfDay: TimeOfDay[];

  constructor(...timesOfDay: TimeOfDay[]) {
    super();
    this.timesOfDay = timesOfDay;
    this.description = i18next.t("pokemonEvolutions:orms.timeOfDay");
  }

  canChange(_pokemon: Pokemon): boolean {
    return this.timesOfDay.indexOf(globalScene.arena.getTimeOfDay()) > -1;
  }
}
export class SpeciesFormChangeActiveTrigger extends SpeciesFormChangeTrigger {
  public active: boolean;

  constructor(active = false) {
    super();
    this.active = active;
    this.description = this.active
      ? i18next.t("pokemonEvolutions:forms.enter")
      : i18next.t("pokemonEvolutions:forms.leave");
  }

  canChange(pokemon: Pokemon): boolean {
    return pokemon.isActive(true) === this.active;
  }
}

export class SpeciesFormChangeStatusEffectTrigger extends SpeciesFormChangeTrigger {
  public statusEffects: StatusEffect[];
  public invert: boolean;

  constructor(statusEffects: StatusEffect | StatusEffect[], invert = false) {
    super();
    this.statusEffects = coerceArray(statusEffects);
    this.invert = invert;
    // this.description = i18next.t("pokemonEvolutions:forms.statusEffect");
  }

  canChange(pokemon: Pokemon): boolean {
    return this.statusEffects.indexOf(pokemon.status?.effect || StatusEffect.NONE) > -1 !== this.invert;
  }
}

export class SpeciesFormChangeMoveLearnedTrigger extends SpeciesFormChangeTrigger {
  public move: MoveId;
  public known: boolean;

  constructor(move: MoveId, known = true) {
    super();
    this.move = move;
    this.known = known;
    const moveKey = toCamelCase(MoveId[this.move]);
    this.description = known
      ? i18next.t("pokemonEvolutions:forms.moveLearned", {
          move: i18next.t(`move:${moveKey}.name`),
        })
      : i18next.t("pokemonEvolutions:forms.moveForgotten", {
          move: i18next.t(`move:${moveKey}.name`),
        });
  }

  canChange(pokemon: Pokemon): boolean {
    return pokemon.moveset.filter(m => m.moveId === this.move).length > 0 === this.known;
  }
}

export abstract class SpeciesFormChangeMoveTrigger extends SpeciesFormChangeTrigger {
  public movePredicate: (m: MoveId) => boolean;
  public used: boolean;

  constructor(move: MoveId | ((m: MoveId) => boolean), used = true) {
    super();
    this.movePredicate = typeof move === "function" ? move : (m: MoveId) => m === move;
    this.used = used;
  }
}

export class SpeciesFormChangePreMoveTrigger extends SpeciesFormChangeMoveTrigger {
  description = i18next.t("pokemonEvolutions:forms.preMove");
  canChange(pokemon: Pokemon): boolean {
    const command = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    return !!command?.move && this.movePredicate(command.move.move) === this.used;
  }
}

export class SpeciesFormChangePostMoveTrigger extends SpeciesFormChangeMoveTrigger {
  description = i18next.t("pokemonEvolutions:forms.postMove");
  canChange(pokemon: Pokemon): boolean {
    return (
      pokemon.summonData && pokemon.getLastXMoves(1).filter(m => this.movePredicate(m.move)).length > 0 === this.used
    );
  }
}

export class MeloettaFormChangePostMoveTrigger extends SpeciesFormChangePostMoveTrigger {
  override canChange(pokemon: Pokemon): boolean {
    if (globalScene.gameMode.hasChallenge(Challenges.SINGLE_TYPE)) {
      return false;
    }
    // Meloetta will not transform if it has the ability Sheer Force when using Relic Song
    if (pokemon.hasAbility(AbilityId.SHEER_FORCE)) {
      return false;
    }
    return super.canChange(pokemon);
  }
}

export class SpeciesDefaultFormMatchTrigger extends SpeciesFormChangeTrigger {
  private formKey: string;

  constructor(formKey: string) {
    super();
    this.formKey = formKey;
    this.description = "";
  }

  canChange(pokemon: Pokemon): boolean {
    return (
      this.formKey
      === pokemon.species.forms[
        globalScene.getSpeciesFormIndex(pokemon.species, pokemon.gender, pokemon.getNature(), true)
      ].formKey
    );
  }
}

/**
 * Class used for triggering form changes based on the user's Tera type.
 * Used by Ogerpon and Terapagos.
 */
export class SpeciesFormChangeTeraTrigger extends SpeciesFormChangeTrigger {}

/**
 * Class used for triggering form changes based on the user's lapsed Tera type.
 * Used by Ogerpon and Terapagos.
 */
export class SpeciesFormChangeLapseTeraTrigger extends SpeciesFormChangeTrigger {}

/**
 * Class used for triggering form changes based on weather.
 * Used by Castform and Cherrim.
 */
export class SpeciesFormChangeWeatherTrigger extends SpeciesFormChangeTrigger {
  /** The ability that  triggers the form change */
  public ability: AbilityId;
  /** The list of weathers that trigger the form change */
  public weathers: WeatherType[];

  constructor(ability: AbilityId, weathers: WeatherType[]) {
    super();
    this.ability = ability;
    this.weathers = weathers;
    this.description = i18next.t("pokemonEvolutions:forms.weather");
  }

  /**
   * Checks if the Pokemon has the required ability and is in the correct weather while
   * the weather or ability is also not suppressed.
   * @param pokemon - The pokemon that is trying to do the form change
   * @returns `true` if the Pokemon can change forms, `false` otherwise
   */
  canChange(pokemon: Pokemon): boolean {
    const currentWeather = globalScene.arena.weather?.weatherType ?? WeatherType.NONE;
    const isWeatherSuppressed = globalScene.arena.weather?.isEffectSuppressed();
    const isAbilitySuppressed = pokemon.summonData.abilitySuppressed;

    return (
      !isAbilitySuppressed
      && !isWeatherSuppressed
      && pokemon.hasAbility(this.ability)
      && this.weathers.includes(currentWeather)
    );
  }
}

/**
 * Class used for reverting to the original form when the weather runs out
 * or when the user loses the ability/is suppressed.
 * Used by Castform and Cherrim.
 */
export class SpeciesFormChangeRevertWeatherFormTrigger extends SpeciesFormChangeTrigger {
  /** The ability that triggers the form change*/
  public ability: AbilityId;
  /** The list of weathers that will also trigger a form change to original form */
  public weathers: WeatherType[];

  constructor(ability: AbilityId, weathers: WeatherType[]) {
    super();
    this.ability = ability;
    this.weathers = weathers;
    this.description = i18next.t("pokemonEvolutions:forms.weatherRevert");
  }

  /**
   * Checks if the Pokemon has the required ability and the weather is one that will revert
   * the Pokemon to its original form or the weather or ability is suppressed
   * @param {Pokemon} pokemon the pokemon that is trying to do the form change
   * @returns `true` if the Pokemon will revert to its original form, `false` otherwise
   */
  canChange(pokemon: Pokemon): boolean {
    if (pokemon.hasAbility(this.ability, false, true)) {
      const currentWeather = globalScene.arena.weather?.weatherType ?? WeatherType.NONE;
      const isWeatherSuppressed = globalScene.arena.weather?.isEffectSuppressed();
      const isAbilitySuppressed = pokemon.summonData.abilitySuppressed;
      const summonDataAbility = pokemon.summonData.ability;
      const isAbilityChanged = summonDataAbility !== this.ability && summonDataAbility !== AbilityId.NONE;

      if (this.weathers.includes(currentWeather) || isWeatherSuppressed || isAbilitySuppressed || isAbilityChanged) {
        return true;
      }
    }
    return false;
  }
}

export function getSpeciesFormChangeMessage(pokemon: Pokemon, formChange: SpeciesFormChange, preName: string): string {
  const isMega = formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1;
  const isGmax = formChange.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1;
  const isEmax = formChange.formKey.indexOf(SpeciesFormKey.ETERNAMAX) > -1;
  const isRevert = !isMega && formChange.formKey === pokemon.species.forms[0].formKey;
  if (isMega) {
    return i18next.t("battlePokemonForm:megaChange", {
      preName,
      pokemonName: pokemon.name,
    });
  }
  if (isGmax) {
    return i18next.t("battlePokemonForm:gigantamaxChange", {
      preName,
      pokemonName: pokemon.name,
    });
  }
  if (isEmax) {
    return i18next.t("battlePokemonForm:eternamaxChange", {
      preName,
      pokemonName: pokemon.name,
    });
  }
  if (isRevert) {
    return i18next.t("battlePokemonForm:revertChange", {
      pokemonName: getPokemonNameWithAffix(pokemon),
    });
  }
  if (pokemon.getAbility().id === AbilityId.DISGUISE) {
    return i18next.t("battlePokemonForm:disguiseChange");
  }
  return i18next.t("battlePokemonForm:formChange", { preName });
}
