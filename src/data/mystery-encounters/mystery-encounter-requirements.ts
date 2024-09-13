import { PlayerPokemon } from "#app/field/pokemon";
import BattleScene from "#app/battle-scene";
import { isNullOrUndefined } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { TimeOfDay } from "#enums/time-of-day";
import { Nature } from "../nature";
import { EvolutionItem, pokemonEvolutions } from "../pokemon-evolutions";
import { FormChangeItem, pokemonFormChanges, SpeciesFormChangeItemTrigger } from "../pokemon-forms";
import { SpeciesFormKey } from "../pokemon-species";
import { StatusEffect } from "../status-effect";
import { Type } from "../type";
import { WeatherType } from "../weather";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { AttackTypeBoosterModifier } from "#app/modifier/modifier";
import { AttackTypeBoosterModifierType } from "#app/modifier/modifier-type";

export interface EncounterRequirement {
  meetsRequirement(scene: BattleScene): boolean; // Boolean to see if a requirement is met
  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string];
}

export abstract class EncounterSceneRequirement implements EncounterRequirement {
  /**
   * Returns whether the EncounterSceneRequirement's... requirements, are met by the given scene
   * @param partyPokemon
   */
  abstract meetsRequirement(scene: BattleScene): boolean;
  /**
   * Returns a dialogue token key/value pair for a given Requirement.
   * Should be overridden by child Requirement classes.
   * @param scene
   * @param pokemon
   */
  abstract getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string];
}

export class CombinationSceneRequirement extends EncounterSceneRequirement {
  orRequirements: EncounterSceneRequirement[];

  constructor(... orRequirements: EncounterSceneRequirement[]) {
    super();
    this.orRequirements = orRequirements;
  }

  override meetsRequirement(scene: BattleScene): boolean {
    for (const req of this.orRequirements) {
      if (req.meetsRequirement(scene)) {
        return true;
      }
    }
    return false;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    for (const req of this.orRequirements) {
      if (req.meetsRequirement(scene)) {
        return req.getDialogueToken(scene, pokemon);
      }
    }

    return this.orRequirements[0].getDialogueToken(scene, pokemon);
  }
}

export abstract class EncounterPokemonRequirement implements EncounterRequirement {
  public minNumberOfPokemon: number;
  public invertQuery: boolean;

  /**
   * Returns whether the EncounterPokemonRequirement's... requirements, are met by the given scene
   * @param partyPokemon
   */
  abstract meetsRequirement(scene: BattleScene): boolean;

  /**
   * Returns all party members that are compatible with this requirement. For non pokemon related requirements, the entire party is returned.
   * @param partyPokemon
   */
  abstract queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[];

  /**
   * Returns a dialogue token key/value pair for a given Requirement.
   * Should be overridden by child Requirement classes.
   * @param scene
   * @param pokemon
   */
  abstract getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string];
}

export class CombinationPokemonRequirement extends EncounterPokemonRequirement {
  orRequirements: EncounterPokemonRequirement[];

  constructor(...orRequirements: EncounterPokemonRequirement[]) {
    super();
    this.invertQuery = false;
    this.minNumberOfPokemon = 1;
    this.orRequirements = orRequirements;
  }

  meetsRequirement(scene: BattleScene): boolean {
    for (const req of this.orRequirements) {
      if (req.meetsRequirement(scene)) {
        return true;
      }
    }
    return false;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    for (const req of this.orRequirements) {
      const result = req.queryParty(partyPokemon);
      if (result?.length > 0) {
        return result;
      }
    }

    return [];
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    for (const req of this.orRequirements) {
      if (req.meetsRequirement(scene)) {
        return req.getDialogueToken(scene, pokemon);
      }
    }

    return this.orRequirements[0].getDialogueToken(scene, pokemon);
  }
}

export class PreviousEncounterRequirement extends EncounterSceneRequirement {
  previousEncounterRequirement: MysteryEncounterType;

  /**
   * Used for specifying an encounter that must be seen before this encounter can spawn
   * @param previousEncounterRequirement
   */
  constructor(previousEncounterRequirement: MysteryEncounterType) {
    super();
    this.previousEncounterRequirement = previousEncounterRequirement;
  }

  meetsRequirement(scene: BattleScene): boolean {
    return scene.mysteryEncounterSaveData.encounteredEvents.some(e => e.type === this.previousEncounterRequirement);
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["previousEncounter", scene.mysteryEncounterSaveData.encounteredEvents.find(e => e.type === this.previousEncounterRequirement)?.[0].toString() ?? ""];
  }
}

export class WaveRangeRequirement extends EncounterSceneRequirement {
  waveRange: [number, number];

  /**
   * Used for specifying a unique wave or wave range requirement
   * If minWaveIndex and maxWaveIndex are equivalent, will check for exact wave number
   * @param waveRange [min, max]
   */
  constructor(waveRange: [number, number]) {
    super();
    this.waveRange = waveRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    if (!isNullOrUndefined(this.waveRange) && this.waveRange?.[0] <= this.waveRange?.[1]) {
      const waveIndex = scene.currentBattle.waveIndex;
      if (waveIndex >= 0 && (this.waveRange?.[0] >= 0 && this.waveRange?.[0] > waveIndex) || (this.waveRange?.[1] >= 0 && this.waveRange?.[1] < waveIndex)) {
        return false;
      }
    }
    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["waveIndex", scene.currentBattle.waveIndex.toString()];
  }
}

export class WaveModulusRequirement extends EncounterSceneRequirement {
  waveModuli: number[];
  modulusValue: number;

  /**
   * Used for specifying a modulus requirement on the wave index
   * For example, can be used to require the wave index to end with 1, 2, or 3
   * @param waveModuli The allowed modulus results
   * @param modulusValue The modulus calculation value
   *
   * Example:
   * new WaveModulusRequirement([1, 2, 3], 10) will check for 1st/2nd/3rd waves that are immediately after a multiple of 10 wave
   * So waves 21, 32, 53 all return true. 58, 14, 99 return false.
   */
  constructor(waveModuli: number[], modulusValue: number) {
    super();
    this.waveModuli = waveModuli;
    this.modulusValue = modulusValue;
  }

  meetsRequirement(scene: BattleScene): boolean {
    return this.waveModuli.includes(scene.currentBattle.waveIndex % this.modulusValue);
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["waveIndex", scene.currentBattle.waveIndex.toString()];
  }
}

export class TimeOfDayRequirement extends EncounterSceneRequirement {
  requiredTimeOfDay: TimeOfDay[];

  constructor(timeOfDay: TimeOfDay | TimeOfDay[]) {
    super();
    this.requiredTimeOfDay = Array.isArray(timeOfDay) ? timeOfDay : [timeOfDay];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const timeOfDay = scene.arena?.getTimeOfDay();
    if (!isNullOrUndefined(timeOfDay) && this.requiredTimeOfDay?.length > 0 && !this.requiredTimeOfDay.includes(timeOfDay)) {
      return false;
    }

    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["timeOfDay", TimeOfDay[scene.arena.getTimeOfDay()].toLocaleLowerCase()];
  }
}

export class WeatherRequirement extends EncounterSceneRequirement {
  requiredWeather: WeatherType[];

  constructor(weather: WeatherType | WeatherType[]) {
    super();
    this.requiredWeather = Array.isArray(weather) ? weather : [weather];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const currentWeather = scene.arena.weather?.weatherType;
    if (!isNullOrUndefined(currentWeather) && this.requiredWeather?.length > 0 && !this.requiredWeather.includes(currentWeather!)) {
      return false;
    }

    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const currentWeather = scene.arena.weather?.weatherType;
    let token = "";
    if (!isNullOrUndefined(currentWeather)) {
      token = WeatherType[currentWeather!].replace("_", " ").toLocaleLowerCase();
    }
    return ["weather", token];
  }
}

export class PartySizeRequirement extends EncounterSceneRequirement {
  partySizeRange: [number, number];
  excludeFainted: boolean;

  /**
   * Used for specifying a party size requirement
   * If min and max are equivalent, will check for exact size
   * @param partySizeRange
   * @param excludeFainted
   */
  constructor(partySizeRange: [number, number], excludeFainted: boolean) {
    super();
    this.partySizeRange = partySizeRange;
    this.excludeFainted = excludeFainted;
  }

  meetsRequirement(scene: BattleScene): boolean {
    if (!isNullOrUndefined(this.partySizeRange) && this.partySizeRange?.[0] <= this.partySizeRange?.[1]) {
      const partySize = this.excludeFainted ? scene.getParty().filter(p => p.isAllowedInBattle()).length : scene.getParty().length;
      if (partySize >= 0 && (this.partySizeRange?.[0] >= 0 && this.partySizeRange?.[0] > partySize) || (this.partySizeRange?.[1] >= 0 && this.partySizeRange?.[1] < partySize)) {
        return false;
      }
    }

    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["partySize", scene.getParty().length.toString()];
  }
}

export class PersistentModifierRequirement extends EncounterSceneRequirement {
  requiredHeldItemModifiers: string[];
  minNumberOfItems: number;

  constructor(heldItem: string | string[], minNumberOfItems: number = 1) {
    super();
    this.minNumberOfItems = minNumberOfItems;
    this.requiredHeldItemModifiers = Array.isArray(heldItem) ? heldItem : [heldItem];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredHeldItemModifiers?.length < 0) {
      return false;
    }
    let modifierCount = 0;
    this.requiredHeldItemModifiers.forEach(modifier => {
      const matchingMods = scene.findModifiers(m => m.constructor.name === modifier);
      if (matchingMods?.length > 0) {
        matchingMods.forEach(matchingMod => {
          modifierCount += matchingMod.stackCount;
        });
      }
    });

    return modifierCount >= this.minNumberOfItems;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["requiredItem", this.requiredHeldItemModifiers[0]];
  }
}

export class MoneyRequirement extends EncounterSceneRequirement {
  requiredMoney: number; // Static value
  scalingMultiplier: number; // Calculates required money based off wave index

  constructor(requiredMoney?: number, scalingMultiplier?: number) {
    super();
    this.requiredMoney = requiredMoney ?? 0;
    this.scalingMultiplier = scalingMultiplier ?? 0;
  }

  meetsRequirement(scene: BattleScene): boolean {
    const money = scene.money;
    if (isNullOrUndefined(money)) {
      return false;
    }

    if (this.scalingMultiplier > 0) {
      this.requiredMoney = scene.getWaveMoneyAmount(this.scalingMultiplier);
    }
    return !(this.requiredMoney > 0 && this.requiredMoney > money);
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const value = this.scalingMultiplier > 0 ? scene.getWaveMoneyAmount(this.scalingMultiplier).toString() : this.requiredMoney.toString();
    return ["money", value];
  }
}

export class SpeciesRequirement extends EncounterPokemonRequirement {
  requiredSpecies: Species[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(species: Species | Species[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredSpecies = Array.isArray(species) ? species : [species];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredSpecies?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredSpecies.filter((species) => pokemon.species.speciesId === species).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed speciess
      return partyPokemon.filter((pokemon) => this.requiredSpecies.filter((species) => pokemon.species.speciesId === species).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    if (pokemon?.species.speciesId && this.requiredSpecies.includes(pokemon.species.speciesId)) {
      return ["species", Species[pokemon.species.speciesId]];
    }
    return ["species", ""];
  }
}


export class NatureRequirement extends EncounterPokemonRequirement {
  requiredNature: Nature[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(nature: Nature | Nature[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredNature = Array.isArray(nature) ? nature : [nature];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredNature?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredNature.filter((nature) => pokemon.nature === nature).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed natures
      return partyPokemon.filter((pokemon) => this.requiredNature.filter((nature) => pokemon.nature === nature).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    if (!isNullOrUndefined(pokemon?.nature) && this.requiredNature.includes(pokemon!.nature)) {
      return ["nature", Nature[pokemon!.nature]];
    }
    return ["nature", ""];
  }
}

export class TypeRequirement extends EncounterPokemonRequirement {
  requiredType: Type[];
  excludeFainted: boolean;
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(type: Type | Type[], excludeFainted: boolean = true, minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.excludeFainted = excludeFainted;
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredType = Array.isArray(type) ? type : [type];
  }

  meetsRequirement(scene: BattleScene): boolean {
    let partyPokemon = scene.getParty();

    if (isNullOrUndefined(partyPokemon)) {
      return false;
    }

    if (this.excludeFainted) {
      partyPokemon = partyPokemon.filter((pokemon) => !pokemon.isFainted());
    }

    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredType.filter((type) => pokemon.getTypes().includes(type)).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed types
      return partyPokemon.filter((pokemon) => this.requiredType.filter((type) => pokemon.getTypes().includes(type)).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const includedTypes = this.requiredType.filter((ty) => pokemon?.getTypes().includes(ty));
    if (includedTypes.length > 0) {
      return ["type", Type[includedTypes[0]]];
    }
    return ["type", ""];
  }
}


export class MoveRequirement extends EncounterPokemonRequirement {
  requiredMoves: Moves[] = [];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(moves: Moves | Moves[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredMoves = Array.isArray(moves) ? moves : [moves];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredMoves?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((reqMove) => pokemon.moveset.filter((move) => move?.moveId === reqMove).length > 0).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed moves
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((reqMove) => pokemon.moveset.filter((move) => move?.moveId === reqMove).length === 0).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const includedMoves = pokemon?.moveset.filter((move) => move?.moveId && this.requiredMoves.includes(move.moveId));
    if (includedMoves && includedMoves.length > 0 && includedMoves[0]) {
      return ["move", includedMoves[0].getName()];
    }
    return ["move", ""];
  }

}

/**
 * Find out if Pokemon in the party are able to learn one of many specific moves by TM.
 * NOTE: Egg moves are not included as learnable.
 * NOTE: If the Pokemon already knows the move, this requirement will fail, since it's not technically learnable.
 */
export class CompatibleMoveRequirement extends EncounterPokemonRequirement {
  requiredMoves: Moves[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(learnableMove: Moves | Moves[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredMoves = Array.isArray(learnableMove) ? learnableMove : [learnableMove];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredMoves?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((learnableMove) => pokemon.compatibleTms.filter(tm => !pokemon.moveset.find(m => m?.moveId === tm)).includes(learnableMove)).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed learnableMoves
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((learnableMove) => pokemon.compatibleTms.filter(tm => !pokemon.moveset.find(m => m?.moveId === tm)).includes(learnableMove)).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const includedCompatMoves = this.requiredMoves.filter((reqMove) => pokemon?.compatibleTms.filter((tm) => !pokemon.moveset.find(m => m?.moveId === tm)).includes(reqMove));
    if (includedCompatMoves.length > 0) {
      return ["compatibleMove", Moves[includedCompatMoves[0]]];
    }
    return ["compatibleMove", ""];
  }

}

/*
export class EvolutionTargetSpeciesRequirement extends EncounterPokemonRequirement {
  requiredEvolutionTargetSpecies: Species[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(evolutionTargetSpecies: Species | Species[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredEvolutionTargetSpecies = Array.isArray(evolutionTargetSpecies) ? evolutionTargetSpecies : [evolutionTargetSpecies];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredEvolutionTargetSpecies?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredEvolutionTargetSpecies.filter((evolutionTargetSpecies) => pokemon.getEvolution()?.speciesId === evolutionTargetSpecies).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed evolutionTargetSpeciess
      return partyPokemon.filter((pokemon) => this.requiredEvolutionTargetSpecies.filter((evolutionTargetSpecies) => pokemon.getEvolution()?.speciesId === evolutionTargetSpecies).length === 0);
    }
  }

  getMatchingDialogueToken(str:string, pokemon: PlayerPokemon): [RegExp, string] {
    const evos = this.requiredEvolutionTargetSpecies.filter((evolutionTargetSpecies) => pokemon.getEvolution().speciesId === evolutionTargetSpecies);
    if (evos.length > 0) {
      return ["evolution", Species[evos[0]]];
    }
    return ["evolution", ""];
  }

}*/

export class AbilityRequirement extends EncounterPokemonRequirement {
  requiredAbilities: Abilities[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(abilities: Abilities | Abilities[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredAbilities = Array.isArray(abilities) ? abilities : [abilities];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredAbilities?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredAbilities.some((ability) => pokemon.getAbility().id === ability));
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed abilitiess
      return partyPokemon.filter((pokemon) => this.requiredAbilities.filter((ability) => pokemon.getAbility().id === ability).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    if (pokemon?.getAbility().id && this.requiredAbilities.some(a => pokemon.getAbility().id === a)) {
      return ["ability", pokemon.getAbility().name];
    }
    return ["ability", ""];
  }
}

export class StatusEffectRequirement extends EncounterPokemonRequirement {
  requiredStatusEffect: StatusEffect[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(statusEffect: StatusEffect | StatusEffect[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredStatusEffect = Array.isArray(statusEffect) ? statusEffect : [statusEffect];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredStatusEffect?.length < 0) {
      return false;
    }
    const x = this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
    console.log(x);
    return x;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => {
        return this.requiredStatusEffect.some((statusEffect) => {
          if (statusEffect === StatusEffect.NONE) {
            // StatusEffect.NONE also checks for null or undefined status
            return isNullOrUndefined(pokemon.status) || isNullOrUndefined(pokemon.status!.effect) || pokemon.status?.effect === statusEffect;
          } else {
            return pokemon.status?.effect === statusEffect;
          }
        });
      });
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed StatusEffects
      // return partyPokemon.filter((pokemon) => this.requiredStatusEffect.filter((statusEffect) => pokemon.status?.effect === statusEffect).length === 0);
      return partyPokemon.filter((pokemon) => {
        return !this.requiredStatusEffect.some((statusEffect) => {
          if (statusEffect === StatusEffect.NONE) {
            // StatusEffect.NONE also checks for null or undefined status
            return isNullOrUndefined(pokemon.status) || isNullOrUndefined(pokemon.status!.effect) || pokemon.status?.effect === statusEffect;
          } else {
            return pokemon.status?.effect === statusEffect;
          }
        });
      });
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const reqStatus = this.requiredStatusEffect.filter((a) => {
      if (a === StatusEffect.NONE) {
        return isNullOrUndefined(pokemon?.status) || isNullOrUndefined(pokemon!.status!.effect) || pokemon!.status!.effect === a;
      }
      return pokemon!.status?.effect === a;
    });
    if (reqStatus.length > 0) {
      return ["status", StatusEffect[reqStatus[0]]];
    }
    return ["status", ""];
  }

}

/**
 * Finds if there are pokemon that can form change with a given item.
 * Notice that we mean specific items, like Charizardite, not the Mega Bracelet.
 * If you want to trigger the event based on the form change enabler, use PersistentModifierRequirement.
 */
export class CanFormChangeWithItemRequirement extends EncounterPokemonRequirement {
  requiredFormChangeItem: FormChangeItem[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(formChangeItem: FormChangeItem | FormChangeItem[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredFormChangeItem = Array.isArray(formChangeItem) ? formChangeItem : [formChangeItem];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredFormChangeItem?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  filterByForm(pokemon, formChangeItem) {
    if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId)
      // Get all form changes for this species with an item trigger, including any compound triggers
      && pokemonFormChanges[pokemon.species.speciesId].filter(fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger))
        // Returns true if any form changes match this item
        .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
        .flat().flatMap(fc => fc.item).includes(formChangeItem)) {
      return true;
    } else {
      return false;
    }
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredFormChangeItem.filter((formChangeItem) => this.filterByForm(pokemon, formChangeItem)).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed formChangeItems
      return partyPokemon.filter((pokemon) => this.requiredFormChangeItem.filter((formChangeItem) => this.filterByForm(pokemon, formChangeItem)).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = this.requiredFormChangeItem.filter((formChangeItem) => this.filterByForm(pokemon, formChangeItem));
    if (requiredItems.length > 0) {
      return ["formChangeItem", FormChangeItem[requiredItems[0]]];
    }
    return ["formChangeItem", ""];
  }

}

export class CanEvolveWithItemRequirement extends EncounterPokemonRequirement {
  requiredEvolutionItem: EvolutionItem[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(evolutionItems: EvolutionItem | EvolutionItem[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredEvolutionItem = Array.isArray(evolutionItems) ? evolutionItems : [evolutionItems];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredEvolutionItem?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  filterByEvo(pokemon, evolutionItem) {
    if (pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.item === evolutionItem
      && (!e.condition || e.condition.predicate(pokemon))).length && (pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX)) {
      return true;
    } else if (pokemon.isFusion() && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId) && pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e => e.item === evolutionItem
      && (!e.condition || e.condition.predicate(pokemon))).length && (pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX)) {
      return true;
    }
    return false;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredEvolutionItem.filter((evolutionItem) => this.filterByEvo(pokemon, evolutionItem)).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed evolutionItemss
      return partyPokemon.filter((pokemon) => this.requiredEvolutionItem.filter((evolutionItems) => this.filterByEvo(pokemon, evolutionItems)).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = this.requiredEvolutionItem.filter((evoItem) => this.filterByEvo(pokemon, evoItem));
    if (requiredItems.length > 0) {
      return ["evolutionItem", EvolutionItem[requiredItems[0]]];
    }
    return ["evolutionItem", ""];
  }
}

export class HeldItemRequirement extends EncounterPokemonRequirement {
  requiredHeldItemModifiers: string[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(heldItem: string | string[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHeldItemModifiers = Array.isArray(heldItem) ? heldItem : [heldItem];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon)) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredHeldItemModifiers.some((heldItem) => {
        return pokemon.getHeldItems().some((it) => {
          return it.constructor.name === heldItem;
        });
      }));
    } else {
      // for an inverted query, we only want to get the pokemon that have any held items that are NOT in requiredHeldItemModifiers
      // E.g. functions as a blacklist
      return partyPokemon.filter((pokemon) => pokemon.getHeldItems().filter((it) => {
        return !this.requiredHeldItemModifiers.some(heldItem => it.constructor.name === heldItem);
      }).length > 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = pokemon?.getHeldItems().filter((it) => {
      return this.requiredHeldItemModifiers.some(heldItem => it.constructor.name === heldItem);
    });
    if (requiredItems && requiredItems.length > 0) {
      return ["heldItem", requiredItems[0].type.name];
    }
    return ["heldItem", ""];
  }
}

export class AttackTypeBoosterHeldItemTypeRequirement extends EncounterPokemonRequirement {
  requiredHeldItemTypes: Type[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(heldItemTypes: Type | Type[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHeldItemTypes = Array.isArray(heldItemTypes) ? heldItemTypes : [heldItemTypes];
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon)) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredHeldItemTypes.some((heldItemType) => {
        return pokemon.getHeldItems().some((it) => {
          return it instanceof AttackTypeBoosterModifier && (it.type as AttackTypeBoosterModifierType).moveType === heldItemType;
        });
      }));
    } else {
      // for an inverted query, we only want to get the pokemon that have any held items that are NOT in requiredHeldItemModifiers
      // E.g. functions as a blacklist
      return partyPokemon.filter((pokemon) => pokemon.getHeldItems().filter((it) => {
        return !this.requiredHeldItemTypes.some(heldItemType => it instanceof AttackTypeBoosterModifier && (it.type as AttackTypeBoosterModifierType).moveType === heldItemType);
      }).length > 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = pokemon?.getHeldItems().filter((it) => {
      return this.requiredHeldItemTypes.some(heldItemType => it instanceof AttackTypeBoosterModifier && (it.type as AttackTypeBoosterModifierType).moveType === heldItemType);
    });
    if (requiredItems && requiredItems.length > 0) {
      return ["heldItem", requiredItems[0].type.name];
    }
    return ["heldItem", ""];
  }
}

export class LevelRequirement extends EncounterPokemonRequirement {
  requiredLevelRange: [number, number];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(requiredLevelRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredLevelRange = requiredLevelRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this.requiredLevelRange) && this.requiredLevelRange[0] <= this.requiredLevelRange[1]) {
      const partyPokemon = scene.getParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => pokemon.level >= this.requiredLevelRange[0] && pokemon.level <= this.requiredLevelRange[1]);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredLevelRanges
      return partyPokemon.filter((pokemon) => pokemon.level < this.requiredLevelRange[0] || pokemon.level > this.requiredLevelRange[1]);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["level", pokemon?.level.toString() ?? ""];
  }
}

export class FriendshipRequirement extends EncounterPokemonRequirement {
  requiredFriendshipRange: [number, number];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(requiredFriendshipRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredFriendshipRange = requiredFriendshipRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required friendship range
    if (!isNullOrUndefined(this.requiredFriendshipRange) && this.requiredFriendshipRange[0] <= this.requiredFriendshipRange[1]) {
      const partyPokemon = scene.getParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => pokemon.friendship >= this.requiredFriendshipRange[0] && pokemon.friendship <= this.requiredFriendshipRange[1]);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredFriendshipRanges
      return partyPokemon.filter((pokemon) => pokemon.friendship < this.requiredFriendshipRange[0] || pokemon.friendship > this.requiredFriendshipRange[1]);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["friendship", pokemon?.friendship.toString() ?? ""];
  }
}

/**
 * .1 -> 10% hp
 * .5 -> 50% hp
 * 1 -> 100% hp
 */
export class HealthRatioRequirement extends EncounterPokemonRequirement {
  requiredHealthRange: [number, number];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(requiredHealthRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHealthRange = requiredHealthRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this.requiredHealthRange) && this.requiredHealthRange[0] <= this.requiredHealthRange[1]) {
      const partyPokemon = scene.getParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => {
        return pokemon.getHpRatio() >= this.requiredHealthRange[0] && pokemon.getHpRatio() <= this.requiredHealthRange[1];
      });
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredHealthRanges
      return partyPokemon.filter((pokemon) => pokemon.getHpRatio() < this.requiredHealthRange[0] || pokemon.getHpRatio() > this.requiredHealthRange[1]);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    if (!isNullOrUndefined(pokemon?.getHpRatio())) {
      return ["healthRatio", Math.floor(pokemon!.getHpRatio() * 100).toString() + "%"];
    }
    return ["healthRatio", ""];
  }
}

export class WeightRequirement extends EncounterPokemonRequirement {
  requiredWeightRange: [number, number];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(requiredWeightRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredWeightRange = requiredWeightRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required friendship range
    if (!isNullOrUndefined(this.requiredWeightRange) && this.requiredWeightRange[0] <= this.requiredWeightRange[1]) {
      const partyPokemon = scene.getParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => pokemon.getWeight() >= this.requiredWeightRange[0] && pokemon.getWeight() <= this.requiredWeightRange[1]);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredWeightRanges
      return partyPokemon.filter((pokemon) => pokemon.getWeight() < this.requiredWeightRange[0] || pokemon.getWeight() > this.requiredWeightRange[1]);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["weight", pokemon?.getWeight().toString() ?? ""];
  }
}


