import { globalScene } from "#app/global-scene";
import { allMoves } from "#data/data-lists";
import {
  MeloettaFormChangePostMoveTrigger,
  SpeciesDefaultFormMatchTrigger,
  SpeciesFormChangeAbilityTrigger,
  SpeciesFormChangeActiveTrigger,
  SpeciesFormChangeCompoundTrigger,
  SpeciesFormChangeItemTrigger,
  SpeciesFormChangeLapseTeraTrigger,
  SpeciesFormChangeManualTrigger,
  SpeciesFormChangeMoveLearnedTrigger,
  SpeciesFormChangePreMoveTrigger,
  SpeciesFormChangeRevertWeatherFormTrigger,
  SpeciesFormChangeTeraTrigger,
  type SpeciesFormChangeTrigger,
  SpeciesFormChangeWeatherTrigger,
} from "#data/form-change-triggers";
import { AbilityId } from "#enums/ability-id";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveCategory } from "#enums/move-category";
import { MoveId } from "#enums/move-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { Constructor, nil } from "#utils/common";

export type SpeciesFormChangeConditionPredicate = (p: Pokemon) => boolean;
export type SpeciesFormChangeConditionEnforceFunc = (p: Pokemon) => void;

export class SpeciesFormChange {
  public speciesId: SpeciesId;
  public preFormKey: string;
  public formKey: string;
  public trigger: SpeciesFormChangeTrigger;
  public quiet: boolean;
  public readonly conditions: SpeciesFormChangeCondition[];

  constructor(
    speciesId: SpeciesId,
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
function getSpeciesDependentFormChangeCondition(species: SpeciesId): SpeciesFormChangeCondition {
  return new SpeciesFormChangeCondition(_p => !!globalScene.gameData.dexData[species].caughtAttr);
}

interface PokemonFormChanges {
  [key: string]: SpeciesFormChange[];
}

// biome-ignore format: manually formatted
export const pokemonFormChanges: PokemonFormChanges = {
  [SpeciesId.VENUSAUR]: [
    new SpeciesFormChange(SpeciesId.VENUSAUR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.VENUSAURITE)),
    new SpeciesFormChange(SpeciesId.VENUSAUR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.BLASTOISE]: [
    new SpeciesFormChange(SpeciesId.BLASTOISE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLASTOISINITE)),
    new SpeciesFormChange(SpeciesId.BLASTOISE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.CHARIZARD]: [
    new SpeciesFormChange(SpeciesId.CHARIZARD, "", SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_X)),
    new SpeciesFormChange(SpeciesId.CHARIZARD, "", SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_Y)),
    new SpeciesFormChange(SpeciesId.CHARIZARD, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.BUTTERFREE]: [
    new SpeciesFormChange(SpeciesId.BUTTERFREE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.BEEDRILL]: [
    new SpeciesFormChange(SpeciesId.BEEDRILL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BEEDRILLITE))
  ],
  [SpeciesId.PIDGEOT]: [
    new SpeciesFormChange(SpeciesId.PIDGEOT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PIDGEOTITE))
  ],
  [SpeciesId.PIKACHU]: [
    new SpeciesFormChange(SpeciesId.PIKACHU, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.PIKACHU, "partner", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.MEOWTH]: [
    new SpeciesFormChange(SpeciesId.MEOWTH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.ALAKAZAM]: [
    new SpeciesFormChange(SpeciesId.ALAKAZAM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALAKAZITE))
  ],
  [SpeciesId.MACHAMP]: [
    new SpeciesFormChange(SpeciesId.MACHAMP, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.SLOWBRO]: [
    new SpeciesFormChange(SpeciesId.SLOWBRO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SLOWBRONITE))
  ],
  [SpeciesId.GENGAR]: [
    new SpeciesFormChange(SpeciesId.GENGAR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GENGARITE)),
    new SpeciesFormChange(SpeciesId.GENGAR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.KINGLER]: [
    new SpeciesFormChange(SpeciesId.KINGLER, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.KANGASKHAN]: [
    new SpeciesFormChange(SpeciesId.KANGASKHAN, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.KANGASKHANITE))
  ],
  [SpeciesId.PINSIR]: [
    new SpeciesFormChange(SpeciesId.PINSIR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PINSIRITE))
  ],
  [SpeciesId.GYARADOS]: [
    new SpeciesFormChange(SpeciesId.GYARADOS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GYARADOSITE))
  ],
  [SpeciesId.LAPRAS]: [
    new SpeciesFormChange(SpeciesId.LAPRAS, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.EEVEE]: [
    new SpeciesFormChange(SpeciesId.EEVEE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.EEVEE, "partner", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.SNORLAX]: [
    new SpeciesFormChange(SpeciesId.SNORLAX, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.AERODACTYL]: [
    new SpeciesFormChange(SpeciesId.AERODACTYL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AERODACTYLITE))
  ],
  [SpeciesId.MEWTWO]: [
    new SpeciesFormChange(SpeciesId.MEWTWO, "", SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_X)),
    new SpeciesFormChange(SpeciesId.MEWTWO, "", SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_Y))
  ],
  [SpeciesId.AMPHAROS]: [
    new SpeciesFormChange(SpeciesId.AMPHAROS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AMPHAROSITE))
  ],
  [SpeciesId.STEELIX]: [
    new SpeciesFormChange(SpeciesId.STEELIX, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.STEELIXITE))
  ],
  [SpeciesId.SCIZOR]: [
    new SpeciesFormChange(SpeciesId.SCIZOR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCIZORITE))
  ],
  [SpeciesId.HERACROSS]: [
    new SpeciesFormChange(SpeciesId.HERACROSS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HERACRONITE))
  ],
  [SpeciesId.HOUNDOOM]: [
    new SpeciesFormChange(SpeciesId.HOUNDOOM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HOUNDOOMINITE))
  ],
  [SpeciesId.TYRANITAR]: [
    new SpeciesFormChange(SpeciesId.TYRANITAR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.TYRANITARITE))
  ],
  [SpeciesId.SCEPTILE]: [
    new SpeciesFormChange(SpeciesId.SCEPTILE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCEPTILITE))
  ],
  [SpeciesId.BLAZIKEN]: [
    new SpeciesFormChange(SpeciesId.BLAZIKEN, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLAZIKENITE))
  ],
  [SpeciesId.SWAMPERT]: [
    new SpeciesFormChange(SpeciesId.SWAMPERT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SWAMPERTITE))
  ],
  [SpeciesId.GARDEVOIR]: [
    new SpeciesFormChange(SpeciesId.GARDEVOIR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARDEVOIRITE))
  ],
  [SpeciesId.SABLEYE]: [
    new SpeciesFormChange(SpeciesId.SABLEYE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SABLENITE))
  ],
  [SpeciesId.MAWILE]: [
    new SpeciesFormChange(SpeciesId.MAWILE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MAWILITE))
  ],
  [SpeciesId.AGGRON]: [
    new SpeciesFormChange(SpeciesId.AGGRON, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AGGRONITE))
  ],
  [SpeciesId.MEDICHAM]: [
    new SpeciesFormChange(SpeciesId.MEDICHAM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MEDICHAMITE))
  ],
  [SpeciesId.MANECTRIC]: [
    new SpeciesFormChange(SpeciesId.MANECTRIC, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MANECTITE))
  ],
  [SpeciesId.SHARPEDO]: [
    new SpeciesFormChange(SpeciesId.SHARPEDO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SHARPEDONITE))
  ],
  [SpeciesId.CAMERUPT]: [
    new SpeciesFormChange(SpeciesId.CAMERUPT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.CAMERUPTITE))
  ],
  [SpeciesId.ALTARIA]: [
    new SpeciesFormChange(SpeciesId.ALTARIA, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALTARIANITE))
  ],
  [SpeciesId.CASTFORM]: [
    new SpeciesFormChange(SpeciesId.CASTFORM, "", "sunny", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "rainy", "sunny", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "snowy", "sunny", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "", "rainy", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "sunny", "rainy", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "snowy", "rainy", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "", "snowy", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.HAIL, WeatherType.SNOW ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "sunny", "snowy", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.HAIL, WeatherType.SNOW ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "rainy", "snowy", new SpeciesFormChangeWeatherTrigger(AbilityId.FORECAST, [ WeatherType.HAIL, WeatherType.SNOW ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "sunny", "", new SpeciesFormChangeRevertWeatherFormTrigger(AbilityId.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "rainy", "", new SpeciesFormChangeRevertWeatherFormTrigger(AbilityId.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "snowy", "", new SpeciesFormChangeRevertWeatherFormTrigger(AbilityId.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "sunny", "", new SpeciesFormChangeActiveTrigger(), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "rainy", "", new SpeciesFormChangeActiveTrigger(), true),
    new SpeciesFormChange(SpeciesId.CASTFORM, "snowy", "", new SpeciesFormChangeActiveTrigger(), true)
  ],
  [SpeciesId.BANETTE]: [
    new SpeciesFormChange(SpeciesId.BANETTE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BANETTITE))
  ],
  [SpeciesId.ABSOL]: [
    new SpeciesFormChange(SpeciesId.ABSOL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABSOLITE))
  ],
  [SpeciesId.GLALIE]: [
    new SpeciesFormChange(SpeciesId.GLALIE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GLALITITE))
  ],
  [SpeciesId.SALAMENCE]: [
    new SpeciesFormChange(SpeciesId.SALAMENCE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SALAMENCITE))
  ],
  [SpeciesId.METAGROSS]: [
    new SpeciesFormChange(SpeciesId.METAGROSS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.METAGROSSITE))
  ],
  [SpeciesId.LATIAS]: [
    new SpeciesFormChange(SpeciesId.LATIAS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIASITE))
  ],
  [SpeciesId.LATIOS]: [
    new SpeciesFormChange(SpeciesId.LATIOS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIOSITE))
  ],
  [SpeciesId.KYOGRE]: [
    new SpeciesFormChange(SpeciesId.KYOGRE, "", SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.BLUE_ORB))
  ],
  [SpeciesId.GROUDON]: [
    new SpeciesFormChange(SpeciesId.GROUDON, "", SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.RED_ORB))
  ],
  [SpeciesId.RAYQUAZA]: [
    new SpeciesFormChange(SpeciesId.RAYQUAZA, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.RAYQUAZITE))
  ],
  [SpeciesId.DEOXYS]: [
    new SpeciesFormChange(SpeciesId.DEOXYS, "normal", "attack", new SpeciesFormChangeItemTrigger(FormChangeItem.SHARP_METEORITE)),
    new SpeciesFormChange(SpeciesId.DEOXYS, "normal", "defense", new SpeciesFormChangeItemTrigger(FormChangeItem.HARD_METEORITE)),
    new SpeciesFormChange(SpeciesId.DEOXYS, "normal", "speed", new SpeciesFormChangeItemTrigger(FormChangeItem.SMOOTH_METEORITE))
  ],
  [SpeciesId.CHERRIM]: [
    new SpeciesFormChange(SpeciesId.CHERRIM, "overcast", "sunshine", new SpeciesFormChangeWeatherTrigger(AbilityId.FLOWER_GIFT, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ]), true),
    new SpeciesFormChange(SpeciesId.CHERRIM, "sunshine", "overcast", new SpeciesFormChangeRevertWeatherFormTrigger(AbilityId.FLOWER_GIFT, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG, WeatherType.HAIL, WeatherType.HEAVY_RAIN, WeatherType.SNOW, WeatherType.RAIN ]), true),
    new SpeciesFormChange(SpeciesId.CHERRIM, "sunshine", "overcast", new SpeciesFormChangeActiveTrigger(), true)
  ],
  [SpeciesId.LOPUNNY]: [
    new SpeciesFormChange(SpeciesId.LOPUNNY, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LOPUNNITE))
  ],
  [SpeciesId.GARCHOMP]: [
    new SpeciesFormChange(SpeciesId.GARCHOMP, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARCHOMPITE))
  ],
  [SpeciesId.LUCARIO]: [
    new SpeciesFormChange(SpeciesId.LUCARIO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LUCARIONITE))
  ],
  [SpeciesId.ABOMASNOW]: [
    new SpeciesFormChange(SpeciesId.ABOMASNOW, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABOMASITE))
  ],
  [SpeciesId.GALLADE]: [
    new SpeciesFormChange(SpeciesId.GALLADE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GALLADITE))
  ],
  [SpeciesId.AUDINO]: [
    new SpeciesFormChange(SpeciesId.AUDINO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AUDINITE))
  ],
  [SpeciesId.DIALGA]: [
    new SpeciesFormChange(SpeciesId.DIALGA, "", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.ADAMANT_CRYSTAL))
  ],
  [SpeciesId.PALKIA]: [
    new SpeciesFormChange(SpeciesId.PALKIA, "", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.LUSTROUS_GLOBE))
  ],
  [SpeciesId.GIRATINA]: [
    new SpeciesFormChange(SpeciesId.GIRATINA, "altered", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.GRISEOUS_CORE))
  ],
  [SpeciesId.SHAYMIN]: [
    new SpeciesFormChange(SpeciesId.SHAYMIN, "land", "sky", new SpeciesFormChangeItemTrigger(FormChangeItem.GRACIDEA)),
  ],
  [SpeciesId.ARCEUS]: [
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "fighting", new SpeciesFormChangeItemTrigger(FormChangeItem.FIST_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "flying", new SpeciesFormChangeItemTrigger(FormChangeItem.SKY_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "poison", new SpeciesFormChangeItemTrigger(FormChangeItem.TOXIC_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "ground", new SpeciesFormChangeItemTrigger(FormChangeItem.EARTH_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "rock", new SpeciesFormChangeItemTrigger(FormChangeItem.STONE_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "bug", new SpeciesFormChangeItemTrigger(FormChangeItem.INSECT_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "ghost", new SpeciesFormChangeItemTrigger(FormChangeItem.SPOOKY_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "steel", new SpeciesFormChangeItemTrigger(FormChangeItem.IRON_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "fire", new SpeciesFormChangeItemTrigger(FormChangeItem.FLAME_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "water", new SpeciesFormChangeItemTrigger(FormChangeItem.SPLASH_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "grass", new SpeciesFormChangeItemTrigger(FormChangeItem.MEADOW_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "electric", new SpeciesFormChangeItemTrigger(FormChangeItem.ZAP_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "psychic", new SpeciesFormChangeItemTrigger(FormChangeItem.MIND_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICICLE_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "dragon", new SpeciesFormChangeItemTrigger(FormChangeItem.DRACO_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "dark", new SpeciesFormChangeItemTrigger(FormChangeItem.DREAD_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
    new SpeciesFormChange(SpeciesId.ARCEUS, "normal", "fairy", new SpeciesFormChangeItemTrigger(FormChangeItem.PIXIE_PLATE), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.MULTITYPE))),
  ],
  [SpeciesId.DARMANITAN]: [
    new SpeciesFormChange(SpeciesId.DARMANITAN, "", "zen", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.DARMANITAN, "zen", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.GARBODOR]: [
    new SpeciesFormChange(SpeciesId.GARBODOR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.TORNADUS]: [
    new SpeciesFormChange(SpeciesId.TORNADUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [SpeciesId.THUNDURUS]: [
    new SpeciesFormChange(SpeciesId.THUNDURUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [SpeciesId.LANDORUS]: [
    new SpeciesFormChange(SpeciesId.LANDORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [SpeciesId.KYUREM]: [
    new SpeciesFormChange(SpeciesId.KYUREM, "", "black", new SpeciesFormChangeItemTrigger(FormChangeItem.DARK_STONE), false, getSpeciesDependentFormChangeCondition(SpeciesId.ZEKROM)),
    new SpeciesFormChange(SpeciesId.KYUREM, "", "white", new SpeciesFormChangeItemTrigger(FormChangeItem.LIGHT_STONE), false, getSpeciesDependentFormChangeCondition(SpeciesId.RESHIRAM))
  ],
  [SpeciesId.KELDEO]: [
    new SpeciesFormChange(SpeciesId.KELDEO, "ordinary", "resolute", new SpeciesFormChangeMoveLearnedTrigger(MoveId.SECRET_SWORD), false, new SpeciesFormChangeCondition(() => globalScene.gameMode.isDaily !== true)),
    new SpeciesFormChange(SpeciesId.KELDEO, "resolute", "ordinary", new SpeciesFormChangeMoveLearnedTrigger(MoveId.SECRET_SWORD, false), false, new SpeciesFormChangeCondition(() => globalScene.gameMode.isDaily !== true))
  ],
  [SpeciesId.MELOETTA]: [
    new SpeciesFormChange(SpeciesId.MELOETTA, "aria", "pirouette", new MeloettaFormChangePostMoveTrigger(MoveId.RELIC_SONG), true),
    new SpeciesFormChange(SpeciesId.MELOETTA, "pirouette", "aria", new MeloettaFormChangePostMoveTrigger(MoveId.RELIC_SONG), true)
  ],
  [SpeciesId.GENESECT]: [
    new SpeciesFormChange(SpeciesId.GENESECT, "", "shock", new SpeciesFormChangeItemTrigger(FormChangeItem.SHOCK_DRIVE)),
    new SpeciesFormChange(SpeciesId.GENESECT, "", "burn", new SpeciesFormChangeItemTrigger(FormChangeItem.BURN_DRIVE)),
    new SpeciesFormChange(SpeciesId.GENESECT, "", "chill", new SpeciesFormChangeItemTrigger(FormChangeItem.CHILL_DRIVE)),
    new SpeciesFormChange(SpeciesId.GENESECT, "", "douse", new SpeciesFormChangeItemTrigger(FormChangeItem.DOUSE_DRIVE))
  ],
  [SpeciesId.GRENINJA]: [
    new SpeciesFormChange(SpeciesId.GRENINJA, "battle-bond", "ash", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.GRENINJA, "ash", "battle-bond", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.PALAFIN] : [
    new SpeciesFormChange(SpeciesId.PALAFIN, "zero", "hero", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.PALAFIN, "hero", "zero", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.AEGISLASH]: [
    new SpeciesFormChange(SpeciesId.AEGISLASH, "blade", "shield", new SpeciesFormChangePreMoveTrigger(MoveId.KINGS_SHIELD), true, new SpeciesFormChangeCondition(p => p.hasAbility(AbilityId.STANCE_CHANGE))),
    new SpeciesFormChange(SpeciesId.AEGISLASH, "shield", "blade", new SpeciesFormChangePreMoveTrigger(m => allMoves[m].category !== MoveCategory.STATUS), true, new SpeciesFormChangeCondition(p => p.hasAbility(AbilityId.STANCE_CHANGE))),
    new SpeciesFormChange(SpeciesId.AEGISLASH, "blade", "shield", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [SpeciesId.XERNEAS]: [
    new SpeciesFormChange(SpeciesId.XERNEAS, "neutral", "active", new SpeciesFormChangeActiveTrigger(true), true),
    new SpeciesFormChange(SpeciesId.XERNEAS, "active", "neutral", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [SpeciesId.ZYGARDE]: [
    new SpeciesFormChange(SpeciesId.ZYGARDE, "50-pc", "complete", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.ZYGARDE, "complete", "50-pc", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.ZYGARDE, "10-pc", "10-complete", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.ZYGARDE, "10-complete", "10-pc", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.DIANCIE]: [
    new SpeciesFormChange(SpeciesId.DIANCIE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.DIANCITE))
  ],
  [SpeciesId.HOOPA]: [
    new SpeciesFormChange(SpeciesId.HOOPA, "", "unbound", new SpeciesFormChangeItemTrigger(FormChangeItem.PRISON_BOTTLE))
  ],
  [SpeciesId.WISHIWASHI]: [
    new SpeciesFormChange(SpeciesId.WISHIWASHI, "", "school", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.WISHIWASHI, "school", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.SILVALLY]: [
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "fighting", new SpeciesFormChangeItemTrigger(FormChangeItem.FIGHTING_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "flying", new SpeciesFormChangeItemTrigger(FormChangeItem.FLYING_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "poison", new SpeciesFormChangeItemTrigger(FormChangeItem.POISON_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "ground", new SpeciesFormChangeItemTrigger(FormChangeItem.GROUND_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "rock", new SpeciesFormChangeItemTrigger(FormChangeItem.ROCK_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "bug", new SpeciesFormChangeItemTrigger(FormChangeItem.BUG_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "ghost", new SpeciesFormChangeItemTrigger(FormChangeItem.GHOST_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "steel", new SpeciesFormChangeItemTrigger(FormChangeItem.STEEL_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "fire", new SpeciesFormChangeItemTrigger(FormChangeItem.FIRE_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "water", new SpeciesFormChangeItemTrigger(FormChangeItem.WATER_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "grass", new SpeciesFormChangeItemTrigger(FormChangeItem.GRASS_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "electric", new SpeciesFormChangeItemTrigger(FormChangeItem.ELECTRIC_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "psychic", new SpeciesFormChangeItemTrigger(FormChangeItem.PSYCHIC_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICE_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "dragon", new SpeciesFormChangeItemTrigger(FormChangeItem.DRAGON_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "dark", new SpeciesFormChangeItemTrigger(FormChangeItem.DARK_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM))),
    new SpeciesFormChange(SpeciesId.SILVALLY, "normal", "fairy", new SpeciesFormChangeItemTrigger(FormChangeItem.FAIRY_MEMORY), true, new SpeciesFormChangeCondition((p) => p.hasAbility(AbilityId.RKS_SYSTEM)))
  ],
  [SpeciesId.MINIOR]: [
    new SpeciesFormChange(SpeciesId.MINIOR, "red-meteor", "red", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "red", "red-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "orange-meteor", "orange", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "orange", "orange-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "yellow-meteor", "yellow", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "yellow", "yellow-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "green-meteor", "green", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "green", "green-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "blue-meteor", "blue", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "blue", "blue-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "indigo-meteor", "indigo", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "indigo", "indigo-meteor", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "violet-meteor", "violet", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MINIOR, "violet", "violet-meteor", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.MIMIKYU]: [
    new SpeciesFormChange(SpeciesId.MIMIKYU, "disguised", "busted", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MIMIKYU, "busted", "disguised", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.NECROZMA]: [
    new SpeciesFormChange(SpeciesId.NECROZMA, "", "dawn-wings", new SpeciesFormChangeItemTrigger(FormChangeItem.N_LUNARIZER), false, getSpeciesDependentFormChangeCondition(SpeciesId.LUNALA)),
    new SpeciesFormChange(SpeciesId.NECROZMA, "", "dusk-mane", new SpeciesFormChangeItemTrigger(FormChangeItem.N_SOLARIZER), false, getSpeciesDependentFormChangeCondition(SpeciesId.SOLGALEO)),
    new SpeciesFormChange(SpeciesId.NECROZMA, "dawn-wings", "ultra", new SpeciesFormChangeItemTrigger(FormChangeItem.ULTRANECROZIUM_Z)),
    new SpeciesFormChange(SpeciesId.NECROZMA, "dusk-mane", "ultra", new SpeciesFormChangeItemTrigger(FormChangeItem.ULTRANECROZIUM_Z))
  ],
  [SpeciesId.MELMETAL]: [
    new SpeciesFormChange(SpeciesId.MELMETAL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.RILLABOOM]: [
    new SpeciesFormChange(SpeciesId.RILLABOOM, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.CINDERACE]: [
    new SpeciesFormChange(SpeciesId.CINDERACE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.INTELEON]: [
    new SpeciesFormChange(SpeciesId.INTELEON, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.CORVIKNIGHT]: [
    new SpeciesFormChange(SpeciesId.CORVIKNIGHT, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.ORBEETLE]: [
    new SpeciesFormChange(SpeciesId.ORBEETLE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.DREDNAW]: [
    new SpeciesFormChange(SpeciesId.DREDNAW, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.COALOSSAL]: [
    new SpeciesFormChange(SpeciesId.COALOSSAL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.FLAPPLE]: [
    new SpeciesFormChange(SpeciesId.FLAPPLE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.APPLETUN]: [
    new SpeciesFormChange(SpeciesId.APPLETUN, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.SANDACONDA]: [
    new SpeciesFormChange(SpeciesId.SANDACONDA, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.CRAMORANT]: [
    new SpeciesFormChange(SpeciesId.CRAMORANT, "", "gulping", new SpeciesFormChangeAbilityTrigger, true, new SpeciesFormChangeCondition(p => p.getHpRatio() >= .5)),
    new SpeciesFormChange(SpeciesId.CRAMORANT, "", "gorging", new SpeciesFormChangeAbilityTrigger, true, new SpeciesFormChangeCondition(p => p.getHpRatio() < .5)),
    new SpeciesFormChange(SpeciesId.CRAMORANT, "gulping", "", new SpeciesFormChangeAbilityTrigger, true),
    new SpeciesFormChange(SpeciesId.CRAMORANT, "gorging", "", new SpeciesFormChangeAbilityTrigger, true),
    new SpeciesFormChange(SpeciesId.CRAMORANT, "gulping", "", new SpeciesFormChangeActiveTrigger(false), true),
    new SpeciesFormChange(SpeciesId.CRAMORANT, "gorging", "", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [SpeciesId.TOXTRICITY]: [
    new SpeciesFormChange(SpeciesId.TOXTRICITY, "amped", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.TOXTRICITY, "lowkey", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.TOXTRICITY, SpeciesFormKey.GIGANTAMAX, "amped", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS, false), new SpeciesDefaultFormMatchTrigger("amped"))),
    new SpeciesFormChange(SpeciesId.TOXTRICITY, SpeciesFormKey.GIGANTAMAX, "lowkey", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS, false), new SpeciesDefaultFormMatchTrigger("lowkey")))
  ],
  [SpeciesId.CENTISKORCH]: [
    new SpeciesFormChange(SpeciesId.CENTISKORCH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.HATTERENE]: [
    new SpeciesFormChange(SpeciesId.HATTERENE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.GRIMMSNARL]: [
    new SpeciesFormChange(SpeciesId.GRIMMSNARL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.ALCREMIE]: [
    new SpeciesFormChange(SpeciesId.ALCREMIE, "vanilla-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "ruby-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "matcha-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "mint-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "lemon-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "salted-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "ruby-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "caramel-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.ALCREMIE, "rainbow-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.EISCUE]: [
    new SpeciesFormChange(SpeciesId.EISCUE, "", "no-ice", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.EISCUE, "no-ice", "", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.MORPEKO]: [
    new SpeciesFormChange(SpeciesId.MORPEKO, "full-belly", "hangry", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.MORPEKO, "hangry", "full-belly", new SpeciesFormChangeAbilityTrigger(), true)
  ],
  [SpeciesId.COPPERAJAH]: [
    new SpeciesFormChange(SpeciesId.COPPERAJAH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.DURALUDON]: [
    new SpeciesFormChange(SpeciesId.DURALUDON, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.ZACIAN]: [
    new SpeciesFormChange(SpeciesId.ZACIAN, "hero-of-many-battles", "crowned", new SpeciesFormChangeItemTrigger(FormChangeItem.RUSTED_SWORD))
  ],
  [SpeciesId.ZAMAZENTA]: [
    new SpeciesFormChange(SpeciesId.ZAMAZENTA, "hero-of-many-battles", "crowned", new SpeciesFormChangeItemTrigger(FormChangeItem.RUSTED_SHIELD))
  ],
  [SpeciesId.ETERNATUS]: [
    new SpeciesFormChange(SpeciesId.ETERNATUS, "", SpeciesFormKey.ETERNAMAX, new SpeciesFormChangeManualTrigger()),
    new SpeciesFormChange(SpeciesId.ETERNATUS, "", SpeciesFormKey.ETERNAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.URSHIFU]: [
    new SpeciesFormChange(SpeciesId.URSHIFU, "single-strike", SpeciesFormKey.GIGANTAMAX_SINGLE, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(SpeciesId.URSHIFU, "rapid-strike", SpeciesFormKey.GIGANTAMAX_RAPID, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [SpeciesId.CALYREX]: [
    new SpeciesFormChange(SpeciesId.CALYREX, "", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICY_REINS_OF_UNITY), false, getSpeciesDependentFormChangeCondition(SpeciesId.GLASTRIER)),
    new SpeciesFormChange(SpeciesId.CALYREX, "", "shadow", new SpeciesFormChangeItemTrigger(FormChangeItem.SHADOW_REINS_OF_UNITY), false, getSpeciesDependentFormChangeCondition(SpeciesId.SPECTRIER))
  ],
  [SpeciesId.ENAMORUS]: [
    new SpeciesFormChange(SpeciesId.ENAMORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [SpeciesId.OGERPON]: [
    new SpeciesFormChange(SpeciesId.OGERPON, "teal-mask", "wellspring-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.WELLSPRING_MASK)),
    new SpeciesFormChange(SpeciesId.OGERPON, "teal-mask", "hearthflame-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.HEARTHFLAME_MASK)),
    new SpeciesFormChange(SpeciesId.OGERPON, "teal-mask", "cornerstone-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.CORNERSTONE_MASK)),
    new SpeciesFormChange(SpeciesId.OGERPON, "teal-mask", "teal-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "teal-mask-tera", "teal-mask", new SpeciesFormChangeLapseTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "wellspring-mask", "wellspring-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "wellspring-mask-tera", "wellspring-mask", new SpeciesFormChangeLapseTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "hearthflame-mask", "hearthflame-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "hearthflame-mask-tera", "hearthflame-mask", new SpeciesFormChangeLapseTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "cornerstone-mask", "cornerstone-mask-tera", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.OGERPON, "cornerstone-mask-tera", "cornerstone-mask", new SpeciesFormChangeLapseTeraTrigger(), true)
  ],
  [SpeciesId.TERAPAGOS]: [
    new SpeciesFormChange(SpeciesId.TERAPAGOS, "", "terastal", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.TERAPAGOS, "terastal", "stellar", new SpeciesFormChangeTeraTrigger(), true),
    new SpeciesFormChange(SpeciesId.TERAPAGOS, "stellar", "terastal", new SpeciesFormChangeLapseTeraTrigger(), true)
  ],
  [SpeciesId.GALAR_DARMANITAN]: [
    new SpeciesFormChange(SpeciesId.GALAR_DARMANITAN, "", "zen", new SpeciesFormChangeAbilityTrigger(), true),
    new SpeciesFormChange(SpeciesId.GALAR_DARMANITAN, "zen", "", new SpeciesFormChangeAbilityTrigger(), true)
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
