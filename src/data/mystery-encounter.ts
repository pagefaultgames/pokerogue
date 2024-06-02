import BattleScene from "../battle-scene";
import MysteryEncounterIntroVisuals from "../field/mystery-encounter";
import { isNullOrUndefined } from "../utils";
import { Abilities } from "./enums/abilities";
import { Biome } from "./enums/biome";
import { Species } from "./enums/species";
import { MysteriousTrainersEncounter } from "./mystery-encounters/mysterious-trainers";
import { WeatherType } from "./weather";

export enum MysteryEncounterVariant {
  DEFAULT,
  TRAINER_BATTLE,
  WILD_BATTLE
}

export enum MysteryEncounterType {
  MYSTERY_CHALLENGER,
  MYSTERIOUS_CHEST
}

export class EncounterRequirements {
  minWaveIndex?: number;
  maxWaveIndex?: number;
  requiredBiomes?: Biome[];
  requiredWeather?: WeatherType[];
  requiredPartyPokemon?: Species[];
  requiredPokemonAbilities?: Abilities[];
  requiredItems?: string[]; // TODO, not implemented
  requiredMoney?: number;
  requiredPartyLevel?: number; // Total party level
  requiredPokemonLevelRange?: [number, number]; // Range that is optionially mapped to requiredPartyPokemon if they are set

  constructor(minWaveIndex: number = 0,
    maxWaveIndex: number = 0,
    requiredBiomes: Biome[] = [],
    requiredWeather: WeatherType[] = [],
    requiredPartyPokemon: Species[] = [],
    requiredPokemonAbilities: Abilities[] = [],
    requiredItems: string[] = [],
    requiredMoney: number = 0,
    requiredPartyLevel: number = 0,
    requiredPokemonLevelRange: [number, number] = null) {

    this.minWaveIndex = minWaveIndex;
    this.maxWaveIndex = maxWaveIndex;
    this.requiredBiomes = requiredBiomes;
    this.requiredWeather = requiredWeather;
    this.requiredPartyPokemon = requiredPartyPokemon;
    this.requiredPokemonAbilities = requiredPokemonAbilities;
    this.requiredItems = requiredItems;
    this.requiredMoney = requiredMoney;
    this.requiredPartyLevel = requiredPartyLevel;
    this.requiredPokemonLevelRange = requiredPokemonLevelRange;
  }
}

function internalMeetsRequirements(scene: BattleScene, requirements: EncounterRequirements): boolean {
  // Wave index
  const waveIndex = scene.currentBattle.waveIndex;
  if (waveIndex >= 0 && (requirements?.minWaveIndex >= 0 && requirements.minWaveIndex > waveIndex) || (requirements?.maxWaveIndex >= 0 && requirements.maxWaveIndex < waveIndex)) {
    return false;
  }

  // Biome
  const currentBiome = scene.arena?.biomeType;
  if (!isNullOrUndefined(currentBiome) && requirements?.requiredBiomes?.length > 0 && !requirements.requiredBiomes.includes(currentBiome)) {
    return false;
  }

  // Weather
  const currentWeather = scene.arena?.weather?.weatherType;
  if (!isNullOrUndefined(currentWeather) && requirements?.requiredWeather?.length > 0 && !requirements.requiredWeather.includes(currentWeather)) {
    return false;
  }

  // Party contains X pokemon
  const partyPokemon = scene.getParty();
  if (!isNullOrUndefined(partyPokemon) && requirements?.requiredPartyPokemon?.length > 0 && partyPokemon.filter((pokemon) => requirements.requiredPartyPokemon.includes(pokemon.species.speciesId)).length === 0) {
    return false;
  }

  // Party contains pokemon with X ability
  if (!isNullOrUndefined(partyPokemon) && requirements?.requiredPokemonAbilities?.length > 0 && partyPokemon.filter((pokemon) => requirements.requiredPokemonAbilities.filter((ability) => pokemon.hasAbility(ability)).length > 0).length === 0) {
    return false;
  }

  // TODO: Item reqs

  // Money
  const money = scene.money;
  if (!isNullOrUndefined(money) && requirements?.requiredMoney > 0 && requirements.requiredMoney > money) {
    return false;
  }

  // Party level over threshold
  let partyLevel = 0;
  partyPokemon?.forEach((pokemon) => partyLevel += pokemon.level);
  if (partyLevel > 0 && requirements?.requiredPartyLevel > 0 && partyLevel < requirements.requiredPartyLevel) {
    return false;
  }

  // Party Pokemon inside required level range
  if (!isNullOrUndefined(requirements?.requiredPokemonLevelRange) && requirements.requiredPokemonLevelRange[0] <= requirements.requiredPokemonLevelRange[1]) {
    const pokemonInRange = partyPokemon?.filter((pokemon) => pokemon.level >= requirements.requiredPokemonLevelRange[0] && pokemon.level <= requirements.requiredPokemonLevelRange[1]);
    if (pokemonInRange.length === 0) {
      return false;
    }
  }

  return true;
}

export class MysteryEncounterOption {
  requirements?: EncounterRequirements;
  label: string;
  onSelect: (scene: BattleScene) => Promise<void | boolean>;
  chanceForOption: number; // between 0 and 100

  constructor(onSelect: (scene: BattleScene) => Promise<void | boolean>, chanceForOption: number = 100,  requirements?: EncounterRequirements) {
    this.onSelect = onSelect;
    this.requirements = requirements;
  }

  meetsRequirements(scene: BattleScene) {
    if (isNullOrUndefined(this.requirements)) {
      return true;
    }
    return internalMeetsRequirements(scene, this.requirements);
  }
}

export default abstract class MysteryEncounter {
  options: MysteryEncounterOption[] = [];
  encounterType: MysteryEncounterType;
  encounterIndex: number = 0;
  encounterRequirements: EncounterRequirements;
  introVisuals: MysteryEncounterIntroVisuals;
  doEncounterRewards: (scene: BattleScene) => boolean = null;
  didBattle: boolean = true; // If no battle occurred during mysteryEncounter, flag should be set to false

  constructor(encounterType: MysteryEncounterType) {
    this.encounterType = encounterType;
  }

  requirements<T extends EncounterRequirements>(encounterRequirements: T): MysteryEncounter {
    this.encounterRequirements = encounterRequirements;
    return this;
  }

  option<T extends EncounterRequirements>(onSelect: (scene: BattleScene) => Promise<void | boolean>, optionRequirements?: T): MysteryEncounter {
    const option = new MysteryEncounterOption(onSelect, optionRequirements);
    this.options.push(option);

    return this;
  }

  index(index: number): MysteryEncounter {
    this.encounterIndex = index;
    return this;
  }

  rewards(doEncounterRewards: (scene: BattleScene) => boolean): MysteryEncounter {
    this.doEncounterRewards = doEncounterRewards;
    return this;
  }

  getMysteryEncounterIndex(): number {
    return this.encounterIndex;
  }

  getMysteryEncounterOptions(): MysteryEncounterOption[] {
    return this.options;
  }

  meetsRequirements(scene: BattleScene) {
    return internalMeetsRequirements(scene, this.encounterRequirements);
  }
}

export class MysteryEncounterData {
  encounter: MysteryEncounter;

  constructor(encounter: MysteryEncounter) {
    this.encounter = encounter;
  }
}

export default interface MysteryEncounter {
  options: MysteryEncounterOption[];
}

export class BattleMysteryEncounter extends MysteryEncounter {
  constructor(encounterType: MysteryEncounterType) {
    super(encounterType);
  }
}

export class OptionSelectMysteryEncounter extends MysteryEncounter {
  constructor(encounterType: MysteryEncounterType) {
    super(encounterType);
  }
}

// Wrapper used by individual mystery encounter classes
export interface MysteryEncounterWrapper {
  get(): MysteryEncounter;
}

let t = 0;

export const allMysteryEncounters: MysteryEncounter[] = [];

export function initMysteryEncounters() {
  allMysteryEncounters.push(
    new MysteriousTrainersEncounter().get().index(0),
    // PLACEHOLDER, needs to be moved to /data/myster-encounters/
    new OptionSelectMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHEST).index(++t)
  );
}
