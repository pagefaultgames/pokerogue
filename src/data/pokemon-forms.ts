import { PokemonFormChangeItemModifier } from "../modifier/modifier";
import type Pokemon from "../field/pokemon";
import { StatusEffect } from "#enums/status-effect";
import { allMoves } from "./moves/move";
import { MoveCategory } from "#enums/MoveCategory";
import type { Constructor, nil } from "#app/utils/common";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import type { TimeOfDay } from "#enums/time-of-day";
import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { WeatherType } from "#enums/weather-type";
import { Challenges } from "#app/enums/challenges";
import { SpeciesFormKey } from "#enums/species-form-key";
import { globalScene } from "#app/global-scene";

export enum FormChangeItem {
  NONE,

  ABOMASITE,
  ABSOLITE,
  AERODACTYLITE,
  AGGRONITE,
  ALAKAZITE,
  ALTARIANITE,
  AMPHAROSITE,
  AUDINITE,
  BANETTITE,
  BEEDRILLITE,
  BLASTOISINITE,
  BLAZIKENITE,
  CAMERUPTITE,
  CHARIZARDITE_X,
  CHARIZARDITE_Y,
  DIANCITE,
  GALLADITE,
  GARCHOMPITE,
  GARDEVOIRITE,
  GENGARITE,
  GLALITITE,
  GYARADOSITE,
  HERACRONITE,
  HOUNDOOMINITE,
  KANGASKHANITE,
  LATIASITE,
  LATIOSITE,
  LOPUNNITE,
  LUCARIONITE,
  MANECTITE,
  MAWILITE,
  MEDICHAMITE,
  METAGROSSITE,
  MEWTWONITE_X,
  MEWTWONITE_Y,
  PIDGEOTITE,
  PINSIRITE,
  RAYQUAZITE,
  SABLENITE,
  SALAMENCITE,
  SCEPTILITE,
  SCIZORITE,
  SHARPEDONITE,
  SLOWBRONITE,
  STEELIXITE,
  SWAMPERTITE,
  TYRANITARITE,
  VENUSAURITE,

  BLUE_ORB = 50,
  RED_ORB,
  ADAMANT_CRYSTAL,
  LUSTROUS_GLOBE,
  GRISEOUS_CORE,
  REVEAL_GLASS,
  MAX_MUSHROOMS,
  DARK_STONE,
  LIGHT_STONE,
  PRISON_BOTTLE,
  RUSTED_SWORD,
  RUSTED_SHIELD,
  ICY_REINS_OF_UNITY,
  SHADOW_REINS_OF_UNITY,
  ULTRANECROZIUM_Z,

  SHARP_METEORITE = 100,
  HARD_METEORITE,
  SMOOTH_METEORITE,
  GRACIDEA,
  SHOCK_DRIVE,
  BURN_DRIVE,
  CHILL_DRIVE,
  DOUSE_DRIVE,
  N_SOLARIZER,
  N_LUNARIZER,
  WELLSPRING_MASK,
  HEARTHFLAME_MASK,
  CORNERSTONE_MASK,
  FIST_PLATE,
  SKY_PLATE,
  TOXIC_PLATE,
  EARTH_PLATE,
  STONE_PLATE,
  INSECT_PLATE,
  SPOOKY_PLATE,
  IRON_PLATE,
  FLAME_PLATE,
  SPLASH_PLATE,
  MEADOW_PLATE,
  ZAP_PLATE,
  MIND_PLATE,
  ICICLE_PLATE,
  DRACO_PLATE,
  DREAD_PLATE,
  PIXIE_PLATE,
  BLANK_PLATE, // TODO: Find a potential use for this
  LEGEND_PLATE, // TODO: Find a potential use for this
  FIGHTING_MEMORY,
  FLYING_MEMORY,
  POISON_MEMORY,
  GROUND_MEMORY,
  ROCK_MEMORY,
  BUG_MEMORY,
  GHOST_MEMORY,
  STEEL_MEMORY,
  FIRE_MEMORY,
  WATER_MEMORY,
  GRASS_MEMORY,
  ELECTRIC_MEMORY,
  PSYCHIC_MEMORY,
  ICE_MEMORY,
  DRAGON_MEMORY,
  DARK_MEMORY,
  FAIRY_MEMORY,
  NORMAL_MEMORY, // TODO: Find a potential use for this
}

export type SpeciesFormChangeConditionPredicate = (p: Pokemon) => boolean;
export type SpeciesFormChangeConditionEnforceFunc = (p: Pokemon) => void;

export class SpeciesFormChange {
  public speciesId: Species;
  public preFormKey: string;
  public formKey: string;
  public trigger: SpeciesFormChangeTrigger;
  public quiet: boolean;
  public readonly conditions: SpeciesFormChangeCondition[];

  constructor(
    speciesId: Species,
    preFormKey: string,
    evoFormKey: string,
    trigger: SpeciesFormChangeTrigger,
    quiet = false,
    ...conditions: SpeciesFormChangeCondition[]
  ) {
    this.speciesId = speciesId;
    this.preFormKey = preFormKey;
    this.formKey = evoFormKey;
    this.trigger = trigger;
    this.quiet = quiet;
    this.conditions = conditions;
  }

  canChange(pokemon: Pokemon): boolean {
    if (pokemon.species.speciesId !== this.speciesId) {
      return false;
    }

    if (!pokemon.species.forms.length) {
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

    if (!this.trigger.canChange(pokemon)) {
      return false;
    }

    return true;
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
  public description: string = i18next.t("pokemonEvolutions:Forms.ability");
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
      ? i18next.t("pokemonEvolutions:Forms.item", {
          item: i18next.t(`modifierType:FormChangeItem.${FormChangeItem[this.item]}`),
        })
      : i18next.t("pokemonEvolutions:Forms.deactivateItem", {
          item: i18next.t(`modifierType:FormChangeItem.${FormChangeItem[this.item]}`),
        });
  }

  canChange(pokemon: Pokemon): boolean {
    return !!globalScene.findModifier(
      m =>
        m instanceof PokemonFormChangeItemModifier &&
        m.pokemonId === pokemon.id &&
        m.formChangeItem === this.item &&
        m.active === this.active,
    );
  }
}

export class SpeciesFormChangeTimeOfDayTrigger extends SpeciesFormChangeTrigger {
  public timesOfDay: TimeOfDay[];

  constructor(...timesOfDay: TimeOfDay[]) {
    super();
    this.timesOfDay = timesOfDay;
    this.description = i18next.t("pokemonEvolutions:Forms.timeOfDay");
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
      ? i18next.t("pokemonEvolutions:Forms.enter")
      : i18next.t("pokemonEvolutions:Forms.leave");
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
    if (!Array.isArray(statusEffects)) {
      statusEffects = [statusEffects];
    }
    this.statusEffects = statusEffects;
    this.invert = invert;
    this.description = i18next.t("pokemonEvolutions:Forms.statusEffect");
  }

  canChange(pokemon: Pokemon): boolean {
    return this.statusEffects.indexOf(pokemon.status?.effect || StatusEffect.NONE) > -1 !== this.invert;
  }
}

export class SpeciesFormChangeMoveLearnedTrigger extends SpeciesFormChangeTrigger {
  public move: Moves;
  public known: boolean;

  constructor(move: Moves, known = true) {
    super();
    this.move = move;
    this.known = known;
    const moveKey = Moves[this.move]
      .split("_")
      .filter(f => f)
      .map((f, i) => (i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()))
      .join("") as unknown as string;
    this.description = known
      ? i18next.t("pokemonEvolutions:Forms.moveLearned", {
          move: i18next.t(`move:${moveKey}.name`),
        })
      : i18next.t("pokemonEvolutions:Forms.moveForgotten", {
          move: i18next.t(`move:${moveKey}.name`),
        });
  }

  canChange(pokemon: Pokemon): boolean {
    return !!pokemon.moveset.filter(m => m.moveId === this.move).length === this.known;
  }
}

export abstract class SpeciesFormChangeMoveTrigger extends SpeciesFormChangeTrigger {
  public movePredicate: (m: Moves) => boolean;
  public used: boolean;

  constructor(move: Moves | ((m: Moves) => boolean), used = true) {
    super();
    this.movePredicate = typeof move === "function" ? move : (m: Moves) => m === move;
    this.used = used;
  }
}

export class SpeciesFormChangePreMoveTrigger extends SpeciesFormChangeMoveTrigger {
  description = i18next.t("pokemonEvolutions:Forms.preMove");

  canChange(pokemon: Pokemon): boolean {
    const command = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    return !!command?.move && this.movePredicate(command.move.move) === this.used;
  }
}

export class SpeciesFormChangePostMoveTrigger extends SpeciesFormChangeMoveTrigger {
  description = i18next.t("pokemonEvolutions:Forms.postMove");

  canChange(pokemon: Pokemon): boolean {
    return (
      pokemon.summonData && !!pokemon.getLastXMoves(1).filter(m => this.movePredicate(m.move)).length === this.used
    );
  }
}

export class MeloettaFormChangePostMoveTrigger extends SpeciesFormChangePostMoveTrigger {
  override canChange(pokemon: Pokemon): boolean {
    if (globalScene.gameMode.hasChallenge(Challenges.SINGLE_TYPE)) {
      return false;
    }
    // Meloetta will not transform if it has the ability Sheer Force when using Relic Song
    if (pokemon.hasAbility(Abilities.SHEER_FORCE)) {
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
      this.formKey ===
      pokemon.species.forms[globalScene.getSpeciesFormIndex(pokemon.species, pokemon.gender, pokemon.getNature(), true)]
        .formKey
    );
  }
}

/**
 * Class used for triggering form changes based on the user's Tera type.
 * Used by Ogerpon and Terapagos.
 * @extends SpeciesFormChangeTrigger
 */
export class SpeciesFormChangeTeraTrigger extends SpeciesFormChangeTrigger {
  description = i18next.t("pokemonEvolutions:Forms.tera");
}

/**
 * Class used for triggering form changes based on the user's lapsed Tera type.
 * Used by Ogerpon and Terapagos.
 * @extends SpeciesFormChangeTrigger
 */
export class SpeciesFormChangeLapseTeraTrigger extends SpeciesFormChangeTrigger {
  description = i18next.t("pokemonEvolutions:Forms.teraLapse");
}

/**
 * Class used for triggering form changes based on weather.
 * Used by Castform and Cherrim.
 * @extends SpeciesFormChangeTrigger
 */
export class SpeciesFormChangeWeatherTrigger extends SpeciesFormChangeTrigger {
  /** The ability that  triggers the form change */
  public ability: Abilities;
  /** The list of weathers that trigger the form change */
  public weathers: WeatherType[];

  constructor(ability: Abilities, weathers: WeatherType[]) {
    super();
    this.ability = ability;
    this.weathers = weathers;
    this.description = i18next.t("pokemonEvolutions:Forms.weather");
  }

  /**
   * Checks if the Pokemon has the required ability and is in the correct weather while
   * the weather or ability is also not suppressed.
   * @param {Pokemon} pokemon the pokemon that is trying to do the form change
   * @returns `true` if the Pokemon can change forms, `false` otherwise
   */
  canChange(pokemon: Pokemon): boolean {
    const currentWeather = globalScene.arena.weather?.weatherType ?? WeatherType.NONE;
    const isWeatherSuppressed = globalScene.arena.weather?.isEffectSuppressed();
    const isAbilitySuppressed = pokemon.summonData.abilitySuppressed;

    return (
      !isAbilitySuppressed &&
      !isWeatherSuppressed &&
      pokemon.hasAbility(this.ability) &&
      this.weathers.includes(currentWeather)
    );
  }
}

/**
 * Class used for reverting to the original form when the weather runs out
 * or when the user loses the ability/is suppressed.
 * Used by Castform and Cherrim.
 * @extends SpeciesFormChangeTrigger
 */
export class SpeciesFormChangeRevertWeatherFormTrigger extends SpeciesFormChangeTrigger {
  /** The ability that triggers the form change*/
  public ability: Abilities;
  /** The list of weathers that will also trigger a form change to original form */
  public weathers: WeatherType[];

  constructor(ability: Abilities, weathers: WeatherType[]) {
    super();
    this.ability = ability;
    this.weathers = weathers;
    this.description = i18next.t("pokemonEvolutions:Forms.weatherRevert");
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
      const isAbilityChanged = summonDataAbility !== this.ability && summonDataAbility !== Abilities.NONE;

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
  if (pokemon.getAbility().id === Abilities.DISGUISE) {
    return i18next.t("battlePokemonForm:disguiseChange");
  }
  return i18next.t("battlePokemonForm:formChange", { preName });
}

/**
 * Gives a condition for form changing checking if a species is registered as caught in the player's dex data.
 * Used for fusion forms such as Kyurem and Necrozma.
 * @param species {@linkcode Species}
 * @returns A {@linkcode SpeciesFormChangeCondition} checking if that species is registered as caught
 */
function getSpeciesDependentFormChangeCondition(species: Species): SpeciesFormChangeCondition {
  return new SpeciesFormChangeCondition(_p => !!globalScene.gameData.dexData[species].caughtAttr);
}

interface PokemonFormChanges {
  [key: string]: SpeciesFormChange[];
}

// biome-ignore format: manually formatted
export const pokemonFormChanges: PokemonFormChanges = {
  [Species.VENUSAUR]: [
    new SpeciesFormChange(Species.VENUSAUR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.VENUSAURITE)),
    new SpeciesFormChange(Species.VENUSAUR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.BLASTOISE]: [
    new SpeciesFormChange(Species.BLASTOISE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLASTOISINITE)),
    new SpeciesFormChange(Species.BLASTOISE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CHARIZARD]: [
    new SpeciesFormChange(Species.CHARIZARD, "", SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_X)),
    new SpeciesFormChange(Species.CHARIZARD, "", SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_Y)),
    new SpeciesFormChange(Species.CHARIZARD, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.BUTTERFREE]: [
    new SpeciesFormChange(Species.BUTTERFREE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.BEEDRILL]: [
    new SpeciesFormChange(Species.BEEDRILL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BEEDRILLITE))
  ],
  [Species.PIDGEOT]: [
    new SpeciesFormChange(Species.PIDGEOT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PIDGEOTITE))
  ],
  [Species.PIKACHU]: [
    new SpeciesFormChange(Species.PIKACHU, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.PIKACHU, "partner", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.MEOWTH]: [
    new SpeciesFormChange(Species.MEOWTH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ALAKAZAM]: [
    new SpeciesFormChange(Species.ALAKAZAM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALAKAZITE))
  ],
  [Species.MACHAMP]: [
    new SpeciesFormChange(Species.MACHAMP, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.SLOWBRO]: [
    new SpeciesFormChange(Species.SLOWBRO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SLOWBRONITE))
  ],
  [Species.GENGAR]: [
    new SpeciesFormChange(Species.GENGAR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GENGARITE)),
    new SpeciesFormChange(Species.GENGAR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.KINGLER]: [
    new SpeciesFormChange(Species.KINGLER, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.KANGASKHAN]: [
    new SpeciesFormChange(Species.KANGASKHAN, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.KANGASKHANITE))
  ],
  [Species.PINSIR]: [
    new SpeciesFormChange(Species.PINSIR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PINSIRITE))
  ],
  [Species.GYARADOS]: [
    new SpeciesFormChange(Species.GYARADOS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GYARADOSITE))
  ],
  [Species.LAPRAS]: [
    new SpeciesFormChange(Species.LAPRAS, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.EEVEE]: [
    new SpeciesFormChange(Species.EEVEE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.EEVEE, "partner", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.SNORLAX]: [
    new SpeciesFormChange(Species.SNORLAX, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.AERODACTYL]: [
    new SpeciesFormChange(Species.AERODACTYL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AERODACTYLITE))
  ],
  [Species.MEWTWO]: [
    new SpeciesFormChange(Species.MEWTWO, "", SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_X)),
    new SpeciesFormChange(Species.MEWTWO, "", SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_Y))
  ],
  [Species.AMPHAROS]: [
    new SpeciesFormChange(Species.AMPHAROS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AMPHAROSITE))
  ],
  [Species.STEELIX]: [
    new SpeciesFormChange(Species.STEELIX, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.STEELIXITE))
  ],
  [Species.SCIZOR]: [
    new SpeciesFormChange(Species.SCIZOR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCIZORITE))
  ],
  [Species.HERACROSS]: [
    new SpeciesFormChange(Species.HERACROSS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HERACRONITE))
  ],
  [Species.HOUNDOOM]: [
    new SpeciesFormChange(Species.HOUNDOOM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HOUNDOOMINITE))
  ],
  [Species.TYRANITAR]: [
    new SpeciesFormChange(Species.TYRANITAR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.TYRANITARITE))
  ],
  [Species.SCEPTILE]: [
    new SpeciesFormChange(Species.SCEPTILE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCEPTILITE))
  ],
  [Species.BLAZIKEN]: [
    new SpeciesFormChange(Species.BLAZIKEN, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLAZIKENITE))
  ],
  [Species.SWAMPERT]: [
    new SpeciesFormChange(Species.SWAMPERT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SWAMPERTITE))
  ],
  [Species.GARDEVOIR]: [
    new SpeciesFormChange(Species.GARDEVOIR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARDEVOIRITE))
  ],
  [Species.SABLEYE]: [
    new SpeciesFormChange(Species.SABLEYE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SABLENITE))
  ],
  [Species.MAWILE]: [
    new SpeciesFormChange(Species.MAWILE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MAWILITE))
  ],
  [Species.AGGRON]: [
    new SpeciesFormChange(Species.AGGRON, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AGGRONITE))
  ],
  [Species.MEDICHAM]: [
    new SpeciesFormChange(Species.MEDICHAM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MEDICHAMITE))
  ],
  [Species.MANECTRIC]: [
    new SpeciesFormChange(Species.MANECTRIC, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MANECTITE))
  ],
  [Species.SHARPEDO]: [
    new SpeciesFormChange(Species.SHARPEDO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SHARPEDONITE))
  ],
  [Species.CAMERUPT]: [
    new SpeciesFormChange(Species.CAMERUPT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.CAMERUPTITE))
  ],
  [Species.ALTARIA]: [
    new SpeciesFormChange(Species.ALTARIA, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALTARIANITE))
  ],
  [Species.CASTFORM]: [
    new SpeciesFormChange(Species.CASTFORM, "", "sunny", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(Species.CASTFORM, "rainy", "sunny", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(Species.CASTFORM, "snowy", "sunny", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(Species.CASTFORM, "", "rainy", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]), true),
    new SpeciesFormChange(Species.CASTFORM, "sunny", "rainy", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]), true),
    new SpeciesFormChange(Species.CASTFORM, "snowy", "rainy", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]), true),
    new SpeciesFormChange(Species.CASTFORM, "", "snowy", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.HAIL, WeatherType.SNOW ]), true),
    new SpeciesFormChange(Species.CASTFORM, "sunny", "snowy", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.HAIL, WeatherType.SNOW ]), true),
    new SpeciesFormChange(Species.CASTFORM, "rainy", "snowy", new SpeciesFormChangeWeatherTrigger(Abilities.FORECAST, [ WeatherType.HAIL, WeatherType.SNOW ]), true),
    new SpeciesFormChange(Species.CASTFORM, "sunny", "", new SpeciesFormChangeRevertWeatherFormTrigger(Abilities.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]), true),
    new SpeciesFormChange(Species.CASTFORM, "rainy", "", new SpeciesFormChangeRevertWeatherFormTrigger(Abilities.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]), true),
    new SpeciesFormChange(Species.CASTFORM, "snowy", "", new SpeciesFormChangeRevertWeatherFormTrigger(Abilities.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]), true),
    new SpeciesFormChange(Species.CASTFORM, "sunny", "", new SpeciesFormChangeActiveTrigger(), true),
    new SpeciesFormChange(Species.CASTFORM, "rainy", "", new SpeciesFormChangeActiveTrigger(), true),
    new SpeciesFormChange(Species.CASTFORM, "snowy", "", new SpeciesFormChangeActiveTrigger(), true)
  ],
  [Species.BANETTE]: [
    new SpeciesFormChange(Species.BANETTE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BANETTITE))
  ],
  [Species.ABSOL]: [
    new SpeciesFormChange(Species.ABSOL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABSOLITE))
  ],
  [Species.GLALIE]: [
    new SpeciesFormChange(Species.GLALIE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GLALITITE))
  ],
  [Species.SALAMENCE]: [
    new SpeciesFormChange(Species.SALAMENCE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SALAMENCITE))
  ],
  [Species.METAGROSS]: [
    new SpeciesFormChange(Species.METAGROSS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.METAGROSSITE))
  ],
  [Species.LATIAS]: [
    new SpeciesFormChange(Species.LATIAS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIASITE))
  ],
  [Species.LATIOS]: [
    new SpeciesFormChange(Species.LATIOS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIOSITE))
  ],
  [Species.KYOGRE]: [
    new SpeciesFormChange(Species.KYOGRE, "", SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.BLUE_ORB))
  ],
  [Species.GROUDON]: [
    new SpeciesFormChange(Species.GROUDON, "", SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.RED_ORB))
  ],
  [Species.RAYQUAZA]: [
    new SpeciesFormChange(Species.RAYQUAZA, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.RAYQUAZITE))
  ],
  [Species.DEOXYS]: [
    new SpeciesFormChange(Species.DEOXYS, "normal", "attack", new SpeciesFormChangeItemTrigger(FormChangeItem.SHARP_METEORITE)),
    new SpeciesFormChange(Species.DEOXYS, "normal", "defense", new SpeciesFormChangeItemTrigger(FormChangeItem.HARD_METEORITE)),
    new SpeciesFormChange(Species.DEOXYS, "normal", "speed", new SpeciesFormChangeItemTrigger(FormChangeItem.SMOOTH_METEORITE))
  ],
  [Species.CHERRIM]: [
    new SpeciesFormChange(Species.CHERRIM, "overcast", "sunshine", new SpeciesFormChangeWeatherTrigger(Abilities.FLOWER_GIFT, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(Species.CHERRIM, "sunshine", "overcast", new SpeciesFormChangeRevertWeatherFormTrigger(Abilities.FLOWER_GIFT, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG, WeatherType.HAIL, WeatherType.HEAVY_RAIN, WeatherType.SNOW, WeatherType.RAIN ]), true),
    new SpeciesFormChange(Species.CHERRIM, "sunshine", "overcast", new SpeciesFormChangeActiveTrigger(), true)
  ],
  [Species.LOPUNNY]: [
    new SpeciesFormChange(Species.LOPUNNY, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LOPUNNITE))
  ],
  [Species.GARCHOMP]: [
    new SpeciesFormChange(Species.GARCHOMP, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARCHOMPITE))
  ],
  [Species.LUCARIO]: [
    new SpeciesFormChange(Species.LUCARIO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LUCARIONITE))
  ],
  [Species.ABOMASNOW]: [
    new SpeciesFormChange(Species.ABOMASNOW, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABOMASITE))
  ],
  [Species.GALLADE]: [
    new SpeciesFormChange(Species.GALLADE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GALLADITE))
  ],
  [Species.AUDINO]: [
    new SpeciesFormChange(Species.AUDINO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AUDINITE))
  ],
  [Species.DIALGA]: [
    new SpeciesFormChange(Species.DIALGA, "", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.ADAMANT_CRYSTAL))
  ],
  [Species.PALKIA]: [
    new SpeciesFormChange(Species.PALKIA, "", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.LUSTROUS_GLOBE))
  ],
  [Species.GIRATINA]: [
    new SpeciesFormChange(Species.GIRATINA, "altered", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.GRISEOUS_CORE))
  ],
  [Species.SHAYMIN]: [
    new SpeciesFormChange(Species.SHAYMIN, "land", "sky", new SpeciesFormChangeItemTrigger(FormChangeItem.GRACIDEA)),
  ],
  [Species.ARCEUS]: [
    new SpeciesFormChange(Species.ARCEUS, "normal", "fighting", new SpeciesFormChangeItemTrigger(FormChangeItem.FIST_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "flying", new SpeciesFormChangeItemTrigger(FormChangeItem.SKY_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "poison", new SpeciesFormChangeItemTrigger(FormChangeItem.TOXIC_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "ground", new SpeciesFormChangeItemTrigger(FormChangeItem.EARTH_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "rock", new SpeciesFormChangeItemTrigger(FormChangeItem.STONE_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "bug", new SpeciesFormChangeItemTrigger(FormChangeItem.INSECT_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "ghost", new SpeciesFormChangeItemTrigger(FormChangeItem.SPOOKY_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "steel", new SpeciesFormChangeItemTrigger(FormChangeItem.IRON_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "fire", new SpeciesFormChangeItemTrigger(FormChangeItem.FLAME_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "water", new SpeciesFormChangeItemTrigger(FormChangeItem.SPLASH_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "grass", new SpeciesFormChangeItemTrigger(FormChangeItem.MEADOW_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "electric", new SpeciesFormChangeItemTrigger(FormChangeItem.ZAP_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "psychic", new SpeciesFormChangeItemTrigger(FormChangeItem.MIND_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICICLE_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "dragon", new SpeciesFormChangeItemTrigger(FormChangeItem.DRACO_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "dark", new SpeciesFormChangeItemTrigger(FormChangeItem.DREAD_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
    new SpeciesFormChange(Species.ARCEUS, "normal", "fairy", new SpeciesFormChangeItemTrigger(FormChangeItem.PIXIE_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.MULTITYPE))),
  ],
  [Species.DARMANITAN]: [
    new SpeciesFormChange(Species.DARMANITAN, "", "zen", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.DARMANITAN, "zen", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.GARBODOR]: [
    new SpeciesFormChange(Species.GARBODOR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.TORNADUS]: [
    new SpeciesFormChange(Species.TORNADUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.THUNDURUS]: [
    new SpeciesFormChange(Species.THUNDURUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.LANDORUS]: [
    new SpeciesFormChange(Species.LANDORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.KYUREM]: [
    new SpeciesFormChange(Species.KYUREM, "", "black", new SpeciesFormChangeItemTrigger(FormChangeItem.DARK_STONE), false, getSpeciesDependentFormChangeCondition(Species.ZEKROM)),
    new SpeciesFormChange(Species.KYUREM, "", "white", new SpeciesFormChangeItemTrigger(FormChangeItem.LIGHT_STONE), false, getSpeciesDependentFormChangeCondition(Species.RESHIRAM))
  ],
  [Species.KELDEO]: [
    new SpeciesFormChange(Species.KELDEO, "ordinary", "resolute", new SpeciesFormChangeMoveLearnedTrigger(Moves.SECRET_SWORD), false, new SpeciesFormChangeCondition(() => globalScene.gameMode.isDaily !== true)),
    new SpeciesFormChange(Species.KELDEO, "resolute", "ordinary", new SpeciesFormChangeMoveLearnedTrigger(Moves.SECRET_SWORD, false), false, new SpeciesFormChangeCondition(() => globalScene.gameMode.isDaily !== true))
  ],
  [Species.MELOETTA]: [
    new SpeciesFormChange(Species.MELOETTA, "aria", "pirouette", new MeloettaFormChangePostMoveTrigger(Moves.RELIC_SONG), true),
    new SpeciesFormChange(Species.MELOETTA, "pirouette", "aria", new MeloettaFormChangePostMoveTrigger(Moves.RELIC_SONG), true)
  ],
  [Species.GENESECT]: [
    new SpeciesFormChange(Species.GENESECT, "", "shock", new SpeciesFormChangeItemTrigger(FormChangeItem.SHOCK_DRIVE)),
    new SpeciesFormChange(Species.GENESECT, "", "burn", new SpeciesFormChangeItemTrigger(FormChangeItem.BURN_DRIVE)),
    new SpeciesFormChange(Species.GENESECT, "", "chill", new SpeciesFormChangeItemTrigger(FormChangeItem.CHILL_DRIVE)),
    new SpeciesFormChange(Species.GENESECT, "", "douse", new SpeciesFormChangeItemTrigger(FormChangeItem.DOUSE_DRIVE))
  ],
  [Species.GRENINJA]: [
    new SpeciesFormChange(Species.GRENINJA, "battle-bond", "ash", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.GRENINJA, "ash", "battle-bond", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.PALAFIN] : [
    new SpeciesFormChange(Species.PALAFIN, "zero", "hero", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.PALAFIN, "hero", "zero", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.AEGISLASH]: [
    new SpeciesFormChange(Species.AEGISLASH, "blade", "shield", new SpeciesFormChangePreMoveTrigger(Moves.KINGS_SHIELD), true, new SpeciesFormChangeCondition(p => p.hasAbility(Abilities.STANCE_CHANGE))),
    new SpeciesFormChange(Species.AEGISLASH, "shield", "blade", new SpeciesFormChangePreMoveTrigger(m => allMoves[m].category !== MoveCategory.STATUS), true, new SpeciesFormChangeCondition(p => p.hasAbility(Abilities.STANCE_CHANGE))),
    new SpeciesFormChange(Species.AEGISLASH, "blade", "shield", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [Species.XERNEAS]: [
    new SpeciesFormChange(Species.XERNEAS, "neutral", "active", new SpeciesFormChangeActiveTrigger(true), true),
    new SpeciesFormChange(Species.XERNEAS, "active", "neutral", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [Species.ZYGARDE]: [
    new SpeciesFormChange(Species.ZYGARDE, "50-pc", "complete", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.ZYGARDE, "complete", "50-pc", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.ZYGARDE, "10-pc", "10-complete", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.ZYGARDE, "10-complete", "10-pc", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.DIANCIE]: [
    new SpeciesFormChange(Species.DIANCIE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.DIANCITE))
  ],
  [Species.HOOPA]: [
    new SpeciesFormChange(Species.HOOPA, "", "unbound", new SpeciesFormChangeItemTrigger(FormChangeItem.PRISON_BOTTLE))
  ],
  [Species.WISHIWASHI]: [
    new SpeciesFormChange(Species.WISHIWASHI, "", "school", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.WISHIWASHI, "school", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.SILVALLY]: [
    new SpeciesFormChange(Species.SILVALLY, "normal", "fighting", new SpeciesFormChangeItemTrigger(FormChangeItem.FIGHTING_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "flying", new SpeciesFormChangeItemTrigger(FormChangeItem.FLYING_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "poison", new SpeciesFormChangeItemTrigger(FormChangeItem.POISON_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "ground", new SpeciesFormChangeItemTrigger(FormChangeItem.GROUND_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "rock", new SpeciesFormChangeItemTrigger(FormChangeItem.ROCK_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "bug", new SpeciesFormChangeItemTrigger(FormChangeItem.BUG_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "ghost", new SpeciesFormChangeItemTrigger(FormChangeItem.GHOST_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "steel", new SpeciesFormChangeItemTrigger(FormChangeItem.STEEL_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "fire", new SpeciesFormChangeItemTrigger(FormChangeItem.FIRE_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "water", new SpeciesFormChangeItemTrigger(FormChangeItem.WATER_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "grass", new SpeciesFormChangeItemTrigger(FormChangeItem.GRASS_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "electric", new SpeciesFormChangeItemTrigger(FormChangeItem.ELECTRIC_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "psychic", new SpeciesFormChangeItemTrigger(FormChangeItem.PSYCHIC_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICE_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "dragon", new SpeciesFormChangeItemTrigger(FormChangeItem.DRAGON_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "dark", new SpeciesFormChangeItemTrigger(FormChangeItem.DARK_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM))),
    new SpeciesFormChange(Species.SILVALLY, "normal", "fairy", new SpeciesFormChangeItemTrigger(FormChangeItem.FAIRY_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(Abilities.RKS_SYSTEM)))
  ],
  [Species.MINIOR]: [
    new SpeciesFormChange(Species.MINIOR, "red-meteor", "red", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "red", "red-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "orange-meteor", "orange", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "orange", "orange-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "yellow-meteor", "yellow", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "yellow", "yellow-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "green-meteor", "green", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "green", "green-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "blue-meteor", "blue", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "blue", "blue-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "indigo-meteor", "indigo", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "indigo", "indigo-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "violet-meteor", "violet", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "violet", "violet-meteor", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.MIMIKYU]: [
    new SpeciesFormChange(Species.MIMIKYU, "disguised", "busted", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MIMIKYU, "busted", "disguised", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.NECROZMA]: [
    new SpeciesFormChange(Species.NECROZMA, "", "dawn-wings", new SpeciesFormChangeItemTrigger(FormChangeItem.N_LUNARIZER), false, getSpeciesDependentFormChangeCondition(Species.LUNALA)),
    new SpeciesFormChange(Species.NECROZMA, "", "dusk-mane", new SpeciesFormChangeItemTrigger(FormChangeItem.N_SOLARIZER), false, getSpeciesDependentFormChangeCondition(Species.SOLGALEO)),
    new SpeciesFormChange(Species.NECROZMA, "dawn-wings", "ultra", new SpeciesFormChangeItemTrigger(FormChangeItem.ULTRANECROZIUM_Z)),
    new SpeciesFormChange(Species.NECROZMA, "dusk-mane", "ultra", new SpeciesFormChangeItemTrigger(FormChangeItem.ULTRANECROZIUM_Z))
  ],
  [Species.MELMETAL]: [
    new SpeciesFormChange(Species.MELMETAL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.RILLABOOM]: [
    new SpeciesFormChange(Species.RILLABOOM, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CINDERACE]: [
    new SpeciesFormChange(Species.CINDERACE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.INTELEON]: [
    new SpeciesFormChange(Species.INTELEON, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CORVIKNIGHT]: [
    new SpeciesFormChange(Species.CORVIKNIGHT, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ORBEETLE]: [
    new SpeciesFormChange(Species.ORBEETLE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.DREDNAW]: [
    new SpeciesFormChange(Species.DREDNAW, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.COALOSSAL]: [
    new SpeciesFormChange(Species.COALOSSAL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.FLAPPLE]: [
    new SpeciesFormChange(Species.FLAPPLE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.APPLETUN]: [
    new SpeciesFormChange(Species.APPLETUN, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.SANDACONDA]: [
    new SpeciesFormChange(Species.SANDACONDA, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CRAMORANT]: [
    new SpeciesFormChange(Species.CRAMORANT, "", "gulping", new SpeciesFormChangeAbilityTrigger, true, new SpeciesFormChangeCondition(p => p.getHpRatio() >= .5)),
    new SpeciesFormChange(Species.CRAMORANT, "", "gorging", new SpeciesFormChangeAbilityTrigger, true, new SpeciesFormChangeCondition(p => p.getHpRatio() < .5)),
    new SpeciesFormChange(Species.CRAMORANT, "gulping", "", new SpeciesFormChangeAbilityTrigger, true),
    new SpeciesFormChange(Species.CRAMORANT, "gorging", "", new SpeciesFormChangeAbilityTrigger, true),
    new SpeciesFormChange(Species.CRAMORANT, "gulping", "", new SpeciesFormChangeActiveTrigger(false), true),
    new SpeciesFormChange(Species.CRAMORANT, "gorging", "", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [Species.TOXTRICITY]: [
    new SpeciesFormChange(Species.TOXTRICITY, "amped", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.TOXTRICITY, "lowkey", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.TOXTRICITY, SpeciesFormKey.GIGANTAMAX, "amped", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS, false), new SpeciesDefaultFormMatchTrigger("amped"))),
    new SpeciesFormChange(Species.TOXTRICITY, SpeciesFormKey.GIGANTAMAX, "lowkey", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS, false), new SpeciesDefaultFormMatchTrigger("lowkey")))
  ],
  [Species.CENTISKORCH]: [
    new SpeciesFormChange(Species.CENTISKORCH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.HATTERENE]: [
    new SpeciesFormChange(Species.HATTERENE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.GRIMMSNARL]: [
    new SpeciesFormChange(Species.GRIMMSNARL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ALCREMIE]: [
    new SpeciesFormChange(Species.ALCREMIE, "vanilla-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "ruby-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "matcha-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "mint-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "lemon-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "salted-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "ruby-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "caramel-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "rainbow-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.EISCUE]: [
    new SpeciesFormChange(Species.EISCUE, "", "no-ice", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.EISCUE, "no-ice", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.MORPEKO]: [
    new SpeciesFormChange(Species.MORPEKO, "full-belly", "hangry", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.MORPEKO, "hangry", "full-belly", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [Species.COPPERAJAH]: [
    new SpeciesFormChange(Species.COPPERAJAH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.DURALUDON]: [
    new SpeciesFormChange(Species.DURALUDON, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ZACIAN]: [
    new SpeciesFormChange(Species.ZACIAN, "hero-of-many-battles", "crowned", new SpeciesFormChangeItemTrigger(FormChangeItem.RUSTED_SWORD))
  ],
  [Species.ZAMAZENTA]: [
    new SpeciesFormChange(Species.ZAMAZENTA, "hero-of-many-battles", "crowned", new SpeciesFormChangeItemTrigger(FormChangeItem.RUSTED_SHIELD))
  ],
  [Species.ETERNATUS]: [
    new SpeciesFormChange(Species.ETERNATUS, "", SpeciesFormKey.ETERNAMAX, new SpeciesFormChangeManualTrigger()),
    new SpeciesFormChange(Species.ETERNATUS, "", SpeciesFormKey.ETERNAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.URSHIFU]: [
    new SpeciesFormChange(Species.URSHIFU, "single-strike", SpeciesFormKey.GIGANTAMAX_SINGLE, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.URSHIFU, "rapid-strike", SpeciesFormKey.GIGANTAMAX_RAPID, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CALYREX]: [
    new SpeciesFormChange(Species.CALYREX, "", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICY_REINS_OF_UNITY), false, getSpeciesDependentFormChangeCondition(Species.GLASTRIER)),
    new SpeciesFormChange(Species.CALYREX, "", "shadow", new SpeciesFormChangeItemTrigger(FormChangeItem.SHADOW_REINS_OF_UNITY), false, getSpeciesDependentFormChangeCondition(Species.SPECTRIER))
  ],
  [Species.ENAMORUS]: [
    new SpeciesFormChange(Species.ENAMORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.OGERPON]: [
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "wellspring-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.WELLSPRING_MASK)),
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "hearthflame-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.HEARTHFLAME_MASK)),
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "cornerstone-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.CORNERSTONE_MASK)),
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "teal-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "teal-mask-tera", "teal-mask", new SpeciesFormChangeLapseTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "wellspring-mask", "wellspring-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "wellspring-mask-tera", "wellspring-mask", new SpeciesFormChangeLapseTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "hearthflame-mask", "hearthflame-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "hearthflame-mask-tera", "hearthflame-mask", new SpeciesFormChangeLapseTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "cornerstone-mask", "cornerstone-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(Species.OGERPON, "cornerstone-mask-tera", "cornerstone-mask", new SpeciesFormChangeLapseTeraTrigger(), true)
  ],
  [Species.TERAPAGOS]: [
    new SpeciesFormChange(Species.TERAPAGOS, "", "terastal", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.TERAPAGOS, "terastal", "stellar", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(Species.TERAPAGOS, "stellar", "terastal", new SpeciesFormChangeLapseTeraTrigger(), true)
  ],
  [Species.GALAR_DARMANITAN]: [
    new SpeciesFormChange(Species.GALAR_DARMANITAN, "", "zen", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(Species.GALAR_DARMANITAN, "zen", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
};

export function initPokemonForms() {
  const formChangeKeys = Object.keys(pokemonFormChanges);
  for (const pk of formChangeKeys) {
    const formChanges = pokemonFormChanges[pk];
    const newFormChanges: SpeciesFormChange[] = [];
    for (const fc of formChanges) {
      const itemTrigger = fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger;
      if (itemTrigger && !formChanges.find(c => fc.formKey === c.preFormKey && fc.preFormKey === c.formKey)) {
        newFormChanges.push(
          new SpeciesFormChange(
            fc.speciesId,
            fc.formKey,
            fc.preFormKey,
            new SpeciesFormChangeItemTrigger(itemTrigger.item, false),
          ),
        );
      }
    }
    formChanges.push(...newFormChanges);
  }
}
