import type { determineEnemySpecies } from "#app/ai/ai-species-gen";
import { globalScene } from "#app/global-scene";
import { allMoves, } from "#data/data-lists";
import { type Gender, getGenderSymbol } from "#data/gender";
import type { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import type { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { SpeciesStatBoosterItem, SpeciesStatBoosterModifierType } from "#modifiers/modifier-type";
import type { EvoLevelThreshold } from "#types/species-gen-types";
import { coerceArray } from "#utils/array";
import { randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

export enum EvolutionItem {
  NONE,

  LINKING_CORD,
  SUN_STONE,
  MOON_STONE,
  LEAF_STONE,
  FIRE_STONE,
  WATER_STONE,
  THUNDER_STONE,
  ICE_STONE,
  DUSK_STONE,
  DAWN_STONE,
  SHINY_STONE,
  CRACKED_POT,
  SWEET_APPLE,
  TART_APPLE,
  STRAWBERRY_SWEET,
  UNREMARKABLE_TEACUP,
  UPGRADE,
  DUBIOUS_DISC,
  DRAGON_SCALE,
  PRISM_SCALE,
  RAZOR_CLAW,
  RAZOR_FANG,
  OVAL_STONE,
  REAPER_CLOTH,
  ELECTIRIZER,
  MAGMARIZER,
  PROTECTOR,
  SACHET,
  WHIPPED_DREAM,
  SYRUPY_APPLE,
  CHIPPED_POT,
  GALARICA_CUFF,
  GALARICA_WREATH,
  AUSPICIOUS_ARMOR,
  MALICIOUS_ARMOR,
  MASTERPIECE_TEACUP,
  SUN_FLUTE,
  MOON_FLUTE,

  BLACK_AUGURITE = 51,
  PEAT_BLOCK,
  METAL_ALLOY,
  SCROLL_OF_DARKNESS,
  SCROLL_OF_WATERS,
  LEADERS_CREST
}

const tyrogueMoves = [MoveId.LOW_SWEEP, MoveId.MACH_PUNCH, MoveId.RAPID_SPIN] as const;
type TyrogueMove = (typeof tyrogueMoves)[number];

export const EvoCondKey = {
  FRIENDSHIP: 1,
  TIME: 2,
  MOVE: 3,
  MOVE_TYPE: 4,
  PARTY_TYPE: 5,
  WEATHER: 6,
  BIOME: 7,
  TYROGUE: 8,
  SHEDINJA: 9,
  EVO_TREASURE_TRACKER: 10,
  RANDOM_FORM: 11,
  SPECIES_CAUGHT: 12,
  GENDER: 13,
  NATURE: 14,
  HELD_ITEM: 15, // Currently checks only for species stat booster items
} as const;

export type EvolutionConditionData =
  {key: typeof EvoCondKey.FRIENDSHIP | typeof EvoCondKey.RANDOM_FORM | typeof EvoCondKey.EVO_TREASURE_TRACKER, value: number} |
  {key: typeof EvoCondKey.MOVE, move: MoveId} |
  {key: typeof EvoCondKey.TIME, time: TimeOfDay[]} |
  {key: typeof EvoCondKey.BIOME, biome: BiomeId[]} |
  {key: typeof EvoCondKey.GENDER, gender: Gender} |
  {key: typeof EvoCondKey.MOVE_TYPE | typeof EvoCondKey.PARTY_TYPE, pkmnType: PokemonType} |
  {key: typeof EvoCondKey.SPECIES_CAUGHT, speciesCaught: SpeciesId} |
  {key: typeof EvoCondKey.HELD_ITEM, itemKey: SpeciesStatBoosterItem} |
  {key: typeof EvoCondKey.NATURE, nature: Nature[]} |
  {key: typeof EvoCondKey.WEATHER, weather: WeatherType[]} |
  {key: typeof EvoCondKey.TYROGUE, move: TyrogueMove} |
  {key: typeof EvoCondKey.SHEDINJA};

export class SpeciesEvolutionCondition {
  public data: EvolutionConditionData[];
  private desc: string[];

  constructor(...data: EvolutionConditionData[]) {
    this.data = data;
  }

  public get description(): string[] {
    if (this.desc != null) {
      return this.desc;
    }
    this.desc = this.data.map(cond => {
      switch(cond.key) {
        case EvoCondKey.FRIENDSHIP:
          return i18next.t("pokemonEvolutions:friendship");
        case EvoCondKey.TIME:
          return i18next.t(`pokemonEvolutions:timeOfDay.${toCamelCase(TimeOfDay[cond.time.at(-1)!])}`); // For Day and Night evos, the key we want goes last
        case EvoCondKey.MOVE_TYPE:
          return i18next.t("pokemonEvolutions:moveType", {type: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[cond.pkmnType])}`)});
        case EvoCondKey.PARTY_TYPE:
          return i18next.t("pokemonEvolutions:partyType", {type: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[cond.pkmnType])}`)});
        case EvoCondKey.GENDER:
          return i18next.t("pokemonEvolutions:gender", {gender: getGenderSymbol(cond.gender)});
        case EvoCondKey.MOVE:
        case EvoCondKey.TYROGUE:
          return i18next.t("pokemonEvolutions:move", {move: allMoves[cond.move].name});
        case EvoCondKey.BIOME:
          return i18next.t("pokemonEvolutions:biome");
        case EvoCondKey.NATURE:
          return i18next.t("pokemonEvolutions:nature");
        case EvoCondKey.WEATHER:
          return i18next.t("pokemonEvolutions:weather");
        case EvoCondKey.SHEDINJA:
          return i18next.t("pokemonEvolutions:shedinja");
        case EvoCondKey.EVO_TREASURE_TRACKER:
          return i18next.t("pokemonEvolutions:treasure");
        case EvoCondKey.SPECIES_CAUGHT:
          return i18next.t("pokemonEvolutions:caught", {species: getPokemonSpecies(cond.speciesCaught).name});
        case EvoCondKey.HELD_ITEM:
          return i18next.t(`pokemonEvolutions:heldItem.${toCamelCase(cond.itemKey)}`);
        case EvoCondKey.RANDOM_FORM:
          return null;
        default:
          cond satisfies never;
          return null;
      }
    }).filter(s => s != null); // Filter out stringless conditions
    return this.desc;
  }

  public conditionsFulfilled(pokemon: Pokemon, forFusion = false): boolean {
    console.log(this.data);
    return this.data.every(cond => {
      switch (cond.key) {
        case EvoCondKey.FRIENDSHIP:
          return pokemon.friendship >= cond.value;
        case EvoCondKey.TIME:
          return cond.time.includes(globalScene.arena.getTimeOfDay());
        case EvoCondKey.MOVE:
          return pokemon.moveset.some(m => m.moveId === cond.move);
        case EvoCondKey.MOVE_TYPE:
          return pokemon.moveset.some(m => m.getMove().type === cond.pkmnType);
        case EvoCondKey.PARTY_TYPE:
          return globalScene.getPlayerParty().some(p => p.isOfType(cond.pkmnType, { includeTeraType: false, bypassSummonData: true, ignoreThirdType: true }))
        case EvoCondKey.EVO_TREASURE_TRACKER:
          return pokemon.getHeldItems().some(m =>
            m.is("EvoTrackerModifier") &&
            m.getStackCount() + pokemon.getPersistentTreasureCount() >= cond.value
          );
        case EvoCondKey.GENDER:
          return cond.gender === (forFusion ? pokemon.fusionGender : pokemon.gender);
        case EvoCondKey.SHEDINJA: // Shedinja cannot be evolved into directly
          return false;
        case EvoCondKey.BIOME:
          return cond.biome.includes(globalScene.arena.biomeId);
        case EvoCondKey.WEATHER:
          return cond.weather.includes(globalScene.arena.weatherType);
        case EvoCondKey.TYROGUE:
          return (
            pokemon.getMoveset(true).find(m => (tyrogueMoves as readonly MoveId[]).includes(m.moveId))?.moveId
            === cond.move
          );
        case EvoCondKey.NATURE:
          return cond.nature.includes(pokemon.getNature());
        case EvoCondKey.RANDOM_FORM: {
          let ret = false;
          globalScene.executeWithSeedOffset(() => ret = !randSeedInt(cond.value), pokemon.id);
          return ret;
        }
        case EvoCondKey.SPECIES_CAUGHT:
          return !!globalScene.gameData.dexData[cond.speciesCaught].caughtAttr;
        case EvoCondKey.HELD_ITEM:
          return pokemon.getHeldItems().some(m => m.is("SpeciesStatBoosterModifier") && (m.type as SpeciesStatBoosterModifierType).key === cond.itemKey);
        default:
          cond satisfies never;
          return false;
      }
    });
  }
}

export function validateShedinjaEvo(): boolean {
  return globalScene.getPlayerParty().length < 6 && globalScene.pokeballCounts[PokeballType.POKEBALL] > 0;
}

interface SpeciesFormEvolutionConstructor {
  speciesId: SpeciesId,
  preFormKey: string | null,
  evoFormKey: string | null,
  level: number,
  item?: EvolutionItem | undefined,
  condition?: EvolutionConditionData | EvolutionConditionData[] | undefined,
  evoDelay?: EvoLevelThreshold | undefined
}

export class SpeciesFormEvolution {
  public speciesId: SpeciesId;
  // TODO: change all this `| null` insanity into `field?: type | undefined`
  public preFormKey: string | null;
  public evoFormKey: string | null;
  public level: number;
  public item: EvolutionItem | null;
  public condition: SpeciesEvolutionCondition | null;
  /**
   * A triple containing the level thresholds for evolutions based on the encounter sort
   * @see {@linkcode EvoLevelThreshold}
   * @see {@linkcode determineEnemySpecies}
   */
  public evoLevelThreshold?: EvoLevelThreshold;
  public desc = "";

  constructor(data: SpeciesFormEvolutionConstructor) {
    this.speciesId = data.speciesId;
    this.preFormKey = data.preFormKey;
    this.evoFormKey = data.evoFormKey;
    this.level = data.level;
    this.item = data.item || EvolutionItem.NONE;
    if (data.condition != null) {
      this.condition = new SpeciesEvolutionCondition(...coerceArray(data.condition));
    }
    if (data.evoDelay != null) {
      this.evoLevelThreshold = data.evoDelay;
    }
  }

  get description(): string {
    if (this.desc.length > 0) {
      return this.desc;
    }

    const strings: string[] = [];
    let len = 0;
    if (this.level > 1) {
      strings.push(i18next.t("pokemonEvolutions:atLevel", {lv: this.level}));
    }
    if (this.item) {
      const itemDescription = i18next.t(`modifierType:EvolutionItem.${EvolutionItem[this.item].toUpperCase()}`);
      const rarity = this.item > 50 ? i18next.t("pokemonEvolutions:ultra") : i18next.t("pokemonEvolutions:great");
      strings.push(i18next.t("pokemonEvolutions:using", {item: itemDescription, tier: rarity}));
    }
    if (this.condition) {
      if (strings.length === 0) {
        strings.push(i18next.t("pokemonEvolutions:levelUp"));
      }
      strings.push(...this.condition.description);
    }
    this.desc = strings
      .filter(str => str !== "")
      .map((str, index) => {
        if (index === 0) {
          len = str.length;
          return str;
        }
        if (len + str.length > 60) {
          len = str.length;
          return "\n" + str[0].toLowerCase() + str.slice(1);
        }
        len += str.length;
        return str[0].toLowerCase() + str.slice(1);
      })
      .join(" ")
      .replace(" \n", i18next.t("pokemonEvolutions:connector") + "\n");

    return this.desc;
  }

  /**
   * Checks if a Pokemon fulfills the requirements of this evolution.
   * @param pokemon {@linkcode Pokemon} who wants to evolve
   * @param forFusion defaults to False. Whether this evolution is meant for the secondary fused mon. In that case, use their form key.
   * @param item {@linkcode EvolutionItem} optional, check if the evolution uses a certain item
   * @returns whether this evolution can apply to the Pokemon
   */
  public validate(pokemon: Pokemon, forFusion = false, item?: EvolutionItem): boolean {
    return (
      pokemon.level >= this.level &&
      // Check form key, using the fusion's form key if we're checking the fusion
      (this.preFormKey == null || (forFusion ? pokemon.getFusionFormKey() : pokemon.getFormKey()) === this.preFormKey) &&
      (this.condition == null || this.condition.conditionsFulfilled(pokemon, forFusion)) &&
      ((item ?? EvolutionItem.NONE) === (this.item ?? EvolutionItem.NONE))
    );
  }

  /**
   * Checks if this evolution is item-based and any conditions for it are fulfilled
   * @param pokemon {@linkcode Pokemon} who wants to evolve
   * @param forFusion defaults to False. Whether this evolution is meant for the secondary fused mon. In that case, use their form key.
   * @returns whether this evolution uses an item and can apply to the Pokemon
   */
  public isValidItemEvolution(pokemon: Pokemon, forFusion = false): boolean {
    return (
      this.item != null &&
      pokemon.level >= this.level &&
      // Check form key, using the fusion's form key if we're checking the fusion
      (this.preFormKey == null || (forFusion ? pokemon.getFusionFormKey() : pokemon.getFormKey()) === this.preFormKey) &&
      (this.condition == null || this.condition.conditionsFulfilled(pokemon))
    );
  }

  public get evoItem(): EvolutionItem {
    return this.item ?? EvolutionItem.NONE;
  }
}

interface SpeciesEvolutionConstructor {
  speciesId: SpeciesId,
  level: number,
  item?: EvolutionItem
  condition?: EvolutionConditionData | EvolutionConditionData[],
  evoDelay?: EvoLevelThreshold
}
export class SpeciesEvolution extends SpeciesFormEvolution {
  constructor(data: SpeciesEvolutionConstructor) {
    super({
      speciesId: data.speciesId,
      preFormKey: null,
      evoFormKey: null,
      level: data.level,
      item: data.item,
      condition: data.condition,
      evoDelay: data.evoDelay
    });
  }
}

export class FusionSpeciesFormEvolution extends SpeciesFormEvolution {
  public primarySpeciesId: SpeciesId;

  constructor(primarySpeciesId: SpeciesId, evolution: SpeciesFormEvolution) {
    super({
      speciesId: evolution.speciesId,
      preFormKey: evolution.preFormKey,
      evoFormKey: evolution.evoFormKey,
      level: evolution.level,
      item: evolution.item ?? undefined,
      condition: evolution.condition?.data,
      evoDelay: evolution.evoLevelThreshold
    });

    this.primarySpeciesId = primarySpeciesId;
  }
}
