import BattleScene from "../battle-scene";
import { isNullOrUndefined } from "../utils";
import { Abilities } from "./enums/abilities";
import { Biome } from "./enums/biome";
import { Species } from "./enums/species";
import { WeatherType } from "./weather";

export interface EncounterRequirement {
  meetsRequirement(scene: BattleScene): boolean;
}

export class WaveCountRequirement implements EncounterRequirement {
  waveRange: [number, number];

  /**
   * Used for specifying a unique wave or wave range requirement
   * If minWaveIndex and maxWaveIndex are equivalent, will check for exact wave number
   * @param waveRange - [min, max]
   */
  constructor(waveRange: [number, number]) {
    this.waveRange = waveRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    if (!isNullOrUndefined(this?.waveRange) && this.waveRange?.[0] <= this.waveRange?.[1]) {
      const waveIndex = scene.currentBattle.waveIndex;
      if (waveIndex >= 0 && (this?.waveRange?.[0] >= 0 && this.waveRange?.[0] > waveIndex) || (this?.waveRange?.[1] >= 0 && this.waveRange?.[1] < waveIndex)) {
        return false;
      }
    }


    return true;
  }
}

export class BiomeRequirement implements EncounterRequirement {
  requiredBiomes: Biome[] = [];

  constructor(biomes: Biome | Biome[]) {
    if (biomes instanceof Array) {
      this.requiredBiomes = biomes;
    } else {
      this.requiredBiomes.push(biomes);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const currentBiome = scene.arena?.biomeType;
    if (!isNullOrUndefined(currentBiome) && this?.requiredBiomes?.length > 0 && !this.requiredBiomes.includes(currentBiome)) {
      return false;
    }

    return true;
  }
}

export class WeatherRequirement implements EncounterRequirement {
  requiredWeather?: WeatherType[];

  constructor(weather: WeatherType | WeatherType[]) {
    if (weather instanceof Array) {
      this.requiredWeather = weather;
    } else {
      this.requiredWeather.push(weather);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const currentWeather = scene.arena?.weather?.weatherType;
    if (!isNullOrUndefined(currentWeather) && this?.requiredWeather?.length > 0 && !this.requiredWeather.includes(currentWeather)) {
      return false;
    }

    return true;
  }
}

export class PartySpeciesRequirement implements EncounterRequirement {
  requiredPartyPokemon: Species[];

  /**
   * Party contains at least one of the specified species
   * To check if party contains multiple different species or species ranges, use multiple instances of this class
   * @param species
   */
  constructor(species: Species | Species[]) {
    if (species instanceof Array) {
      this.requiredPartyPokemon = species;
    } else {
      this.requiredPartyPokemon.push(species);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (!isNullOrUndefined(partyPokemon) && this?.requiredPartyPokemon?.length > 0 && partyPokemon.filter((pokemon) => this.requiredPartyPokemon.includes(pokemon.species.speciesId)).length === 0) {
      return false;
    }

    return true;
  }
}

export class PartyAbilityRequirement implements EncounterRequirement {
  requiredAbilities: Abilities[];

  /**
   * Party contains at least one of the specified abilities
   * To check if party contains multiple different abilities or ability ranges, use multiple instances of this class
   * @param ability
   */
  constructor(ability: Abilities | Abilities[]) {
    if (ability instanceof Array) {
      this.requiredAbilities = ability;
    } else {
      this.requiredAbilities.push(ability);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (!isNullOrUndefined(partyPokemon) && this?.requiredAbilities?.length > 0 && partyPokemon.filter((pokemon) => this.requiredAbilities.filter((ability) => pokemon.hasAbility(ability)).length > 0).length === 0) {
      return false;
    }

    return true;
  }
}

export class PartyItemRequirement implements EncounterRequirement {
  requiredItems?: string[]; // TODO: not implemented


  constructor(item: string | string[]) {
    if (item instanceof Array) {
      this.requiredItems = item;
    } else {
      this.requiredItems.push(item);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    // TODO: Item reqs

    return true;
  }
}

export class PartyLevelRequirement implements EncounterRequirement {
  requiredPartyLevel?: number;

  /**
   * Used to check total party level is at or above a threshold
   * @param levelTotal
   */
  constructor(levelTotal: number) {
    this.requiredPartyLevel = levelTotal;
  }

  meetsRequirement(scene: BattleScene): boolean {
    let partyLevel = 0;
    const partyPokemon = scene.getParty();
    partyPokemon?.forEach((pokemon) => partyLevel += pokemon.level);
    if (partyLevel > 0 && this?.requiredPartyLevel > 0 && partyLevel < this.requiredPartyLevel) {
      return false;
    }

    return true;
  }
}

export class PokemonLevelRequirement implements EncounterRequirement {
  requiredLevelRange?: [number, number];

  /**
   * Specifies a level range that at least one party pokemon must be in
   * If min and max are equivalent, will check for exact wave number

   */
  constructor(levelRange: [number, number]) {
    this.requiredLevelRange = levelRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this?.requiredLevelRange) && this.requiredLevelRange?.[0] <= this.requiredLevelRange?.[1]) {
      const partyPokemon = scene.getParty();
      const pokemonInRange = partyPokemon?.filter((pokemon) => pokemon.level >= this.requiredLevelRange[0] && pokemon.level <= this.requiredLevelRange[1]);
      if (pokemonInRange.length === 0) {
        return false;
      }
    }

    return true;
  }
}

export class MoneyRequirement implements EncounterRequirement {
  requiredMoney: number;

  constructor(requiredMoney: number) {
    this.requiredMoney = requiredMoney;
  }

  meetsRequirement(scene: BattleScene): boolean {
    const money = scene.money;
    if (!isNullOrUndefined(money) && this?.requiredMoney > 0 && this.requiredMoney > money) {
      return false;
    }

    return true;
  }
}
