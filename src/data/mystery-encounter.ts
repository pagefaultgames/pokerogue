import BattleScene from "../battle-scene";
import MysteryEncounterIntroVisuals, { MysteryEncounterSpriteConfig } from "../field/mystery-encounter-intro";
import { isNullOrUndefined } from "../utils";
import { Abilities } from "./enums/abilities";
import { Biome } from "./enums/biome";
import { MysteryEncounterType } from "./enums/mystery-encounter-type";
import { Species } from "./enums/species";
import EncounterDialogue, { allMysteryEncounterDialogue } from "./mystery-encounter-dialogue";
import { DarkDealEncounter } from "./mystery-encounters/dark-deal";
import { MysteriousChallengersEncounter } from "./mystery-encounters/mysterious-challengers";
import { MysteriousChestEncounter } from "./mystery-encounters/mysterious-chest";
import { WeatherType } from "./weather";

export enum MysteryEncounterVariant {
  DEFAULT,
  TRAINER_BATTLE,
  WILD_BATTLE
}

export enum MysteryEncounterTier {
  COMMON, // 32/64 odds
  UNCOMMON, // 16/64 odds
  RARE, // 10/64 odds
  SUPER_RARE, // 6/64 odds
  ULTRA_RARE // Not currently used
}

export class MysteryEncounterFlags {
  encounteredEvents: number[];

  constructor(encounteredEvents?: number[]) {
    this.encounteredEvents = encounteredEvents;
  }
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

  // Executes before any following dialogue or business logic from option. Cannot be async. Usually this will be for calculating dialogueTokens or performing data updates
  onPreSelect: (scene: BattleScene) => void | boolean;

  // Business logic for option
  onSelect: (scene: BattleScene) => Promise<void | boolean>;

  // Executes after the encounter is over. Cannot be async. Usually this will be for calculating dialogueTokens or performing data updates
  onPostSelect: (scene: BattleScene) => void | boolean;

  constructor(onSelect: (scene: BattleScene) => Promise<void | boolean>, onPreSelect?: (scene: BattleScene) => void | boolean, onPostSelect?: (scene: BattleScene) => void | boolean, requirements?: EncounterRequirements) {
    this.onSelect = onSelect;
    this.onPreSelect = onPreSelect;
    this.onPostSelect = onPostSelect;
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
  encounterTier: MysteryEncounterTier;
  dialogue: EncounterDialogue;
  encounterRequirements: EncounterRequirements;
  introVisuals: MysteryEncounterIntroVisuals;
  spriteConfigs: MysteryEncounterSpriteConfig[];
  doEncounterRewards: (scene: BattleScene) => boolean = null;
  dialogueTokens: [RegExp, string][] = [];

  // Flags
  encounterVariant: MysteryEncounterVariant = MysteryEncounterVariant.DEFAULT; // Should be set depending upon option selected
  lockEncounterRewardTiers: boolean = true; // Flag to check if first time item shop is being shown for encounter. Will be set to false after shop is shown (so can't reroll same rarity items)
  didBattle: boolean = true; // If no battle occurred during mysteryEncounter, flag should be set to false

  constructor(encounterType: MysteryEncounterType, encounterTier: MysteryEncounterTier = MysteryEncounterTier.COMMON) {
    this.encounterType = encounterType;
    this.encounterTier = encounterTier;
    this.dialogue = allMysteryEncounterDialogue[this.encounterType];
  }

  introVisualsConfig(spriteConfigs: MysteryEncounterSpriteConfig[]): MysteryEncounter {
    this.spriteConfigs = spriteConfigs;
    return this;
  }

  requirements<T extends EncounterRequirements>(encounterRequirements: T): MysteryEncounter {
    this.encounterRequirements = encounterRequirements;
    return this;
  }

  option<T extends EncounterRequirements>(onSelect: (scene: BattleScene) => Promise<void | boolean>, onPreSelect?: (scene: BattleScene) => void | boolean, onPostSelect?: (scene: BattleScene) => void | boolean, optionRequirements?: T): MysteryEncounter {
    const option = new MysteryEncounterOption(onSelect, onPreSelect, onPostSelect, optionRequirements);
    this.options.push(option);

    return this;
  }

  rewards(doEncounterRewards: (scene: BattleScene) => boolean): MysteryEncounter {
    this.doEncounterRewards = doEncounterRewards;
    return this;
  }

  getMysteryEncounterOptions(): MysteryEncounterOption[] {
    return this.options;
  }

  meetsRequirements(scene: BattleScene) {
    return internalMeetsRequirements(scene, this.encounterRequirements);
  }

  initIntroVisuals(scene: BattleScene) {
    this.introVisuals = new MysteryEncounterIntroVisuals(scene, this);
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

export class OptionSelectMysteryEncounter extends MysteryEncounter {
  constructor(encounterType: MysteryEncounterType) {
    super(encounterType);
  }
}

// Wrapper used by individual mystery encounter classes
export interface MysteryEncounterWrapper {
  get(): MysteryEncounter;
}

export const allMysteryEncounters: MysteryEncounter[] = [];

export function initMysteryEncounters() {
  allMysteryEncounters.push(
    new MysteriousChallengersEncounter().get(),
    new MysteriousChestEncounter().get(),
    new DarkDealEncounter().get()
  );
}
