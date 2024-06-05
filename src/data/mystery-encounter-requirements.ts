import BattleScene from "../battle-scene";
import { isNullOrUndefined } from "../utils";
import { Abilities } from "./enums/abilities";
import { Biome } from "./enums/biome";
import { Species } from "./enums/species";
import { WeatherType } from "./weather";

export class MysteryEncounterRequirements {
  minWaveIndex?: number;
  maxWaveIndex?: number;
  requiredBiomes?: Biome[];
  requiredWeather?: WeatherType[];
  requiredPartyPokemon?: Species[];
  requiredPokemonAbilities?: Abilities[];
  requiredItems?: string[]; // TODO: not implemented
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

  meetsRequirements(scene: BattleScene): boolean {
    // Wave index
    const waveIndex = scene.currentBattle.waveIndex;
    if (waveIndex >= 0 && (this?.minWaveIndex >= 0 && this.minWaveIndex > waveIndex) || (this?.maxWaveIndex >= 0 && this.maxWaveIndex < waveIndex)) {
      return false;
    }

    // Biome
    const currentBiome = scene.arena?.biomeType;
    if (!isNullOrUndefined(currentBiome) && this?.requiredBiomes?.length > 0 && !this.requiredBiomes.includes(currentBiome)) {
      return false;
    }

    // Weather
    const currentWeather = scene.arena?.weather?.weatherType;
    if (!isNullOrUndefined(currentWeather) && this?.requiredWeather?.length > 0 && !this.requiredWeather.includes(currentWeather)) {
      return false;
    }

    // Party contains X pokemon
    const partyPokemon = scene.getParty();
    if (!isNullOrUndefined(partyPokemon) && this?.requiredPartyPokemon?.length > 0 && partyPokemon.filter((pokemon) => this.requiredPartyPokemon.includes(pokemon.species.speciesId)).length === 0) {
      return false;
    }

    // Party contains pokemon with X ability
    if (!isNullOrUndefined(partyPokemon) && this?.requiredPokemonAbilities?.length > 0 && partyPokemon.filter((pokemon) => this.requiredPokemonAbilities.filter((ability) => pokemon.hasAbility(ability)).length > 0).length === 0) {
      return false;
    }

    // TODO: Item reqs

    // Money
    const money = scene.money;
    if (!isNullOrUndefined(money) && this?.requiredMoney > 0 && this.requiredMoney > money) {
      return false;
    }

    // Party level over threshold
    let partyLevel = 0;
    partyPokemon?.forEach((pokemon) => partyLevel += pokemon.level);
    if (partyLevel > 0 && this?.requiredPartyLevel > 0 && partyLevel < this.requiredPartyLevel) {
      return false;
    }

    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this?.requiredPokemonLevelRange) && this.requiredPokemonLevelRange[0] <= this.requiredPokemonLevelRange[1]) {
      const pokemonInRange = partyPokemon?.filter((pokemon) => pokemon.level >= this.requiredPokemonLevelRange[0] && pokemon.level <= this.requiredPokemonLevelRange[1]);
      if (pokemonInRange.length === 0) {
        return false;
      }
    }

    return true;
  }
}
