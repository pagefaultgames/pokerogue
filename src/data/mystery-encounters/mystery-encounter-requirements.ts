import { globalScene } from "#app/global-scene";
import { allAbilities } from "#data/data-lists";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { AbilityId } from "#enums/ability-id";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TimeOfDay } from "#enums/time-of-day";
import { WeatherType } from "#enums/weather-type";
import type { PlayerPokemon } from "#field/pokemon";
import { AttackTypeBoosterModifier } from "#modifiers/modifier";
import type { AttackTypeBoosterModifierType } from "#modifiers/modifier-type";
import { coerceArray, isNullOrUndefined } from "#utils/common";

export interface EncounterRequirement {
  meetsRequirement(): boolean; // Boolean to see if a requirement is met
  getDialogueToken(pokemon?: PlayerPokemon): [string, string];
}

export abstract class EncounterSceneRequirement implements EncounterRequirement {
  /**
   * Returns whether the EncounterSceneRequirement's... requirements, are met by the given scene
   */
  abstract meetsRequirement(): boolean;
  /**
   * Returns a dialogue token key/value pair for a given Requirement.
   * Should be overridden by child Requirement classes.
   * @param pokemon
   */
  abstract getDialogueToken(pokemon?: PlayerPokemon): [string, string];
}

/**
 * Combination of multiple {@linkcode EncounterSceneRequirement | EncounterSceneRequirements} (OR/AND possible. See {@linkcode isAnd})
 */
export class CombinationSceneRequirement extends EncounterSceneRequirement {
  /** If `true`, all requirements must be met (AND). If `false`, any requirement must be met (OR) */
  private isAnd: boolean;
  requirements: EncounterSceneRequirement[];

  public static Some(...requirements: EncounterSceneRequirement[]): CombinationSceneRequirement {
    return new CombinationSceneRequirement(false, ...requirements);
  }

  public static Every(...requirements: EncounterSceneRequirement[]): CombinationSceneRequirement {
    return new CombinationSceneRequirement(true, ...requirements);
  }

  private constructor(isAnd: boolean, ...requirements: EncounterSceneRequirement[]) {
    super();
    this.isAnd = isAnd;
    this.requirements = requirements;
  }

  /**
   * Checks if all/any requirements are met (depends on {@linkcode isAnd})
   * @returns true if all/any requirements are met (depends on {@linkcode isAnd})
   */
  override meetsRequirement(): boolean {
    return this.isAnd
      ? this.requirements.every(req => req.meetsRequirement())
      : this.requirements.some(req => req.meetsRequirement());
  }

  /**
   * Retrieves a dialogue token key/value pair for the given {@linkcode EncounterSceneRequirement | requirements}.
   * @param pokemon The {@linkcode PlayerPokemon} to check against
   * @returns A dialogue token key/value pair
   * @throws An {@linkcode Error} if {@linkcode isAnd} is `true` (not supported)
   */
  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    if (this.isAnd) {
      throw new Error("Not implemented (Sorry)");
    }
    for (const req of this.requirements) {
      if (req.meetsRequirement()) {
        return req.getDialogueToken(pokemon);
      }
    }

    return this.requirements[0].getDialogueToken(pokemon);
  }
}

export abstract class EncounterPokemonRequirement implements EncounterRequirement {
  public minNumberOfPokemon: number;
  public invertQuery: boolean;

  /**
   * Returns whether the EncounterPokemonRequirement's... requirements, are met by the given scene
   */
  abstract meetsRequirement(): boolean;

  /**
   * Returns all party members that are compatible with this requirement. For non pokemon related requirements, the entire party is returned.
   * @param partyPokemon
   */
  abstract queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[];

  /**
   * Returns a dialogue token key/value pair for a given Requirement.
   * Should be overridden by child Requirement classes.
   * @param pokemon
   */
  abstract getDialogueToken(pokemon?: PlayerPokemon): [string, string];
}

/**
 * Combination of multiple {@linkcode EncounterPokemonRequirement | EncounterPokemonRequirements} (OR/AND possible. See {@linkcode isAnd})
 */
export class CombinationPokemonRequirement extends EncounterPokemonRequirement {
  /** If `true`, all requirements must be met (AND). If `false`, any requirement must be met (OR) */
  private isAnd: boolean;
  private requirements: EncounterPokemonRequirement[];

  public static Some(...requirements: EncounterPokemonRequirement[]): CombinationPokemonRequirement {
    return new CombinationPokemonRequirement(false, ...requirements);
  }

  public static Every(...requirements: EncounterPokemonRequirement[]): CombinationPokemonRequirement {
    return new CombinationPokemonRequirement(true, ...requirements);
  }

  private constructor(isAnd: boolean, ...requirements: EncounterPokemonRequirement[]) {
    super();
    this.isAnd = isAnd;
    this.invertQuery = false;
    this.minNumberOfPokemon = 1;
    this.requirements = requirements;
  }

  /**
   * Checks if all/any requirements are met (depends on {@linkcode isAnd})
   * @returns true if all/any requirements are met (depends on {@linkcode isAnd})
   */
  override meetsRequirement(): boolean {
    return this.isAnd
      ? this.requirements.every(req => req.meetsRequirement())
      : this.requirements.some(req => req.meetsRequirement());
  }

  /**
   * Queries the players party for all party members that are compatible with all/any requirements (depends on {@linkcode isAnd})
   * @param partyPokemon The party of {@linkcode PlayerPokemon}
   * @returns All party members that are compatible with all/any requirements (depends on {@linkcode isAnd})
   */
  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (this.isAnd) {
      return this.requirements.reduce((relevantPokemon, req) => req.queryParty(relevantPokemon), partyPokemon);
    }
    const matchingRequirement = this.requirements.find(req => req.queryParty(partyPokemon).length > 0);
    return matchingRequirement ? matchingRequirement.queryParty(partyPokemon) : [];
  }

  /**
   * Retrieves a dialogue token key/value pair for the given {@linkcode EncounterPokemonRequirement | requirements}.
   * @param pokemon The {@linkcode PlayerPokemon} to check against
   * @returns A dialogue token key/value pair
   * @throws An {@linkcode Error} if {@linkcode isAnd} is `true` (not supported)
   */
  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    if (this.isAnd) {
      throw new Error("Not implemented (Sorry)");
    }
    for (const req of this.requirements) {
      if (req.meetsRequirement()) {
        return req.getDialogueToken(pokemon);
      }
    }

    return this.requirements[0].getDialogueToken(pokemon);
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

  override meetsRequirement(): boolean {
    return globalScene.mysteryEncounterSaveData.encounteredEvents.some(
      e => e.type === this.previousEncounterRequirement,
    );
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    return [
      "previousEncounter",
      globalScene.mysteryEncounterSaveData.encounteredEvents
        .find(e => e.type === this.previousEncounterRequirement)?.[0]
        .toString() ?? "",
    ];
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

  override meetsRequirement(): boolean {
    if (!isNullOrUndefined(this.waveRange) && this.waveRange[0] <= this.waveRange[1]) {
      const waveIndex = globalScene.currentBattle.waveIndex;
      if (
        (waveIndex >= 0 && this.waveRange[0] >= 0 && this.waveRange[0] > waveIndex)
        || (this.waveRange[1] >= 0 && this.waveRange[1] < waveIndex)
      ) {
        return false;
      }
    }
    return true;
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    return ["waveIndex", globalScene.currentBattle.waveIndex.toString()];
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

  override meetsRequirement(): boolean {
    return this.waveModuli.includes(globalScene.currentBattle.waveIndex % this.modulusValue);
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    return ["waveIndex", globalScene.currentBattle.waveIndex.toString()];
  }
}

export class TimeOfDayRequirement extends EncounterSceneRequirement {
  requiredTimeOfDay: TimeOfDay[];

  constructor(timeOfDay: TimeOfDay | TimeOfDay[]) {
    super();
    this.requiredTimeOfDay = coerceArray(timeOfDay);
  }

  override meetsRequirement(): boolean {
    const timeOfDay = globalScene.arena?.getTimeOfDay();
    return !(
      !isNullOrUndefined(timeOfDay)
      && this.requiredTimeOfDay?.length > 0
      && !this.requiredTimeOfDay.includes(timeOfDay)
    );
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    return ["timeOfDay", TimeOfDay[globalScene.arena.getTimeOfDay()].toLocaleLowerCase()];
  }
}

export class WeatherRequirement extends EncounterSceneRequirement {
  requiredWeather: WeatherType[];

  constructor(weather: WeatherType | WeatherType[]) {
    super();
    this.requiredWeather = coerceArray(weather);
  }

  override meetsRequirement(): boolean {
    const currentWeather = globalScene.arena.weather?.weatherType;
    return !(
      !isNullOrUndefined(currentWeather)
      && this.requiredWeather?.length > 0
      && !this.requiredWeather.includes(currentWeather!)
    );
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    const currentWeather = globalScene.arena.weather?.weatherType;
    let token = "";
    if (!isNullOrUndefined(currentWeather)) {
      token = WeatherType[currentWeather].replace("_", " ").toLocaleLowerCase();
    }
    return ["weather", token];
  }
}

export class PartySizeRequirement extends EncounterSceneRequirement {
  partySizeRange: [number, number];
  excludeDisallowedPokemon: boolean;

  /**
   * Used for specifying a party size requirement
   * If min and max are equivalent, will check for exact size
   * @param partySizeRange
   * @param excludeDisallowedPokemon
   */
  constructor(partySizeRange: [number, number], excludeDisallowedPokemon: boolean) {
    super();
    this.partySizeRange = partySizeRange;
    this.excludeDisallowedPokemon = excludeDisallowedPokemon;
  }

  override meetsRequirement(): boolean {
    if (!isNullOrUndefined(this.partySizeRange) && this.partySizeRange[0] <= this.partySizeRange[1]) {
      const partySize = this.excludeDisallowedPokemon
        ? globalScene.getPokemonAllowedInBattle().length
        : globalScene.getPlayerParty().length;
      if (
        (partySize >= 0 && this.partySizeRange[0] >= 0 && this.partySizeRange[0] > partySize)
        || (this.partySizeRange[1] >= 0 && this.partySizeRange[1] < partySize)
      ) {
        return false;
      }
    }

    return true;
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    return ["partySize", globalScene.getPlayerParty().length.toString()];
  }
}

export class PersistentModifierRequirement extends EncounterSceneRequirement {
  requiredHeldItemModifiers: string[];
  minNumberOfItems: number;

  constructor(heldItem: string | string[], minNumberOfItems = 1) {
    super();
    this.minNumberOfItems = minNumberOfItems;
    this.requiredHeldItemModifiers = coerceArray(heldItem);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredHeldItemModifiers?.length < 0) {
      return false;
    }
    let modifierCount = 0;
    for (const modifier of this.requiredHeldItemModifiers) {
      const matchingMods = globalScene.findModifiers(m => m.constructor.name === modifier);
      if (matchingMods?.length > 0) {
        for (const matchingMod of matchingMods) {
          modifierCount += matchingMod.stackCount;
        }
      }
    }

    return modifierCount >= this.minNumberOfItems;
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    return ["requiredItem", this.requiredHeldItemModifiers[0]];
  }
}

export class MoneyRequirement extends EncounterSceneRequirement {
  requiredMoney: number; // Static value
  scalingMultiplier: number; // Calculates required money based off wave index

  constructor(requiredMoney: number, scalingMultiplier?: number) {
    super();
    this.requiredMoney = requiredMoney ?? 0;
    this.scalingMultiplier = scalingMultiplier ?? 0;
  }

  override meetsRequirement(): boolean {
    const money = globalScene.money;
    if (isNullOrUndefined(money)) {
      return false;
    }

    if (this.scalingMultiplier > 0) {
      this.requiredMoney = globalScene.getWaveMoneyAmount(this.scalingMultiplier);
    }
    return !(this.requiredMoney > 0 && this.requiredMoney > money);
  }

  override getDialogueToken(_pokemon?: PlayerPokemon): [string, string] {
    const value =
      this.scalingMultiplier > 0
        ? globalScene.getWaveMoneyAmount(this.scalingMultiplier).toString()
        : this.requiredMoney.toString();
    return ["money", value];
  }
}

export class SpeciesRequirement extends EncounterPokemonRequirement {
  requiredSpecies: SpeciesId[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(species: SpeciesId | SpeciesId[], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredSpecies = coerceArray(species);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredSpecies?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon => this.requiredSpecies.filter(species => pokemon.species.speciesId === species).length > 0,
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed speciess
    return partyPokemon.filter(
      pokemon => this.requiredSpecies.filter(species => pokemon.species.speciesId === species).length === 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    if (pokemon?.species.speciesId && this.requiredSpecies.includes(pokemon.species.speciesId)) {
      return ["species", SpeciesId[pokemon.species.speciesId]];
    }
    return ["species", ""];
  }
}

export class NatureRequirement extends EncounterPokemonRequirement {
  requiredNature: Nature[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(nature: Nature | Nature[], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredNature = coerceArray(nature);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredNature?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(pokemon => this.requiredNature.filter(nature => pokemon.nature === nature).length > 0);
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed natures
    return partyPokemon.filter(pokemon => this.requiredNature.filter(nature => pokemon.nature === nature).length === 0);
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    if (!isNullOrUndefined(pokemon?.nature) && this.requiredNature.includes(pokemon.nature)) {
      return ["nature", Nature[pokemon.nature]];
    }
    return ["nature", ""];
  }
}

export class TypeRequirement extends EncounterPokemonRequirement {
  requiredType: PokemonType[];
  excludeFainted: boolean;
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(type: PokemonType | PokemonType[], excludeFainted = true, minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.excludeFainted = excludeFainted;
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredType = coerceArray(type);
  }

  override meetsRequirement(): boolean {
    let partyPokemon = globalScene.getPlayerParty();

    if (isNullOrUndefined(partyPokemon)) {
      return false;
    }

    if (this.excludeFainted) {
      partyPokemon = partyPokemon.filter(pokemon => !pokemon.isFainted());
    }

    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon => this.requiredType.filter(type => pokemon.getTypes().includes(type)).length > 0,
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed types
    return partyPokemon.filter(
      pokemon => this.requiredType.filter(type => pokemon.getTypes().includes(type)).length === 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const includedTypes = this.requiredType.filter(ty => pokemon?.getTypes().includes(ty));
    if (includedTypes.length > 0) {
      return ["type", PokemonType[includedTypes[0]]];
    }
    return ["type", ""];
  }
}

export class MoveRequirement extends EncounterPokemonRequirement {
  requiredMoves: MoveId[] = [];
  minNumberOfPokemon: number;
  invertQuery: boolean;
  excludeDisallowedPokemon: boolean;

  constructor(
    moves: MoveId | MoveId[],
    excludeDisallowedPokemon: boolean,
    minNumberOfPokemon = 1,
    invertQuery = false,
  ) {
    super();
    this.excludeDisallowedPokemon = excludeDisallowedPokemon;
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredMoves = coerceArray(moves);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredMoves?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      // get the Pokemon with at least one move in the required moves list
      return partyPokemon.filter(
        pokemon =>
          (!this.excludeDisallowedPokemon || pokemon.isAllowedInBattle())
          && pokemon.moveset.some(move => move.moveId && this.requiredMoves.includes(move.moveId)),
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed moves
    return partyPokemon.filter(
      pokemon =>
        (!this.excludeDisallowedPokemon || pokemon.isAllowedInBattle())
        && !pokemon.moveset.some(move => move.moveId && this.requiredMoves.includes(move.moveId)),
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const includedMoves = pokemon?.moveset.filter(move => move.moveId && this.requiredMoves.includes(move.moveId));
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
  requiredMoves: MoveId[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(learnableMove: MoveId | MoveId[], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredMoves = coerceArray(learnableMove);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredMoves?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon =>
          this.requiredMoves.filter(learnableMove =>
            pokemon.compatibleTms.filter(tm => !pokemon.moveset.find(m => m.moveId === tm)).includes(learnableMove),
          ).length > 0,
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed learnableMoves
    return partyPokemon.filter(
      pokemon =>
        this.requiredMoves.filter(learnableMove =>
          pokemon.compatibleTms.filter(tm => !pokemon.moveset.find(m => m.moveId === tm)).includes(learnableMove),
        ).length === 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const includedCompatMoves = this.requiredMoves.filter(reqMove =>
      pokemon?.compatibleTms.filter(tm => !pokemon.moveset.find(m => m.moveId === tm)).includes(reqMove),
    );
    if (includedCompatMoves.length > 0) {
      return ["compatibleMove", MoveId[includedCompatMoves[0]]];
    }
    return ["compatibleMove", ""];
  }
}

export class AbilityRequirement extends EncounterPokemonRequirement {
  requiredAbilities: AbilityId[];
  minNumberOfPokemon: number;
  invertQuery: boolean;
  excludeDisallowedPokemon: boolean;

  constructor(
    abilities: AbilityId | AbilityId[],
    excludeDisallowedPokemon: boolean,
    minNumberOfPokemon = 1,
    invertQuery = false,
  ) {
    super();
    this.excludeDisallowedPokemon = excludeDisallowedPokemon;
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredAbilities = coerceArray(abilities);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredAbilities?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon =>
          (!this.excludeDisallowedPokemon || pokemon.isAllowedInBattle())
          && this.requiredAbilities.some(ability => pokemon.hasAbility(ability, false)),
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed abilities
    return partyPokemon.filter(
      pokemon =>
        (!this.excludeDisallowedPokemon || pokemon.isAllowedInBattle())
        && this.requiredAbilities.filter(ability => pokemon.hasAbility(ability, false)).length === 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const matchingAbility = this.requiredAbilities.find(a => pokemon?.hasAbility(a, false));
    if (!isNullOrUndefined(matchingAbility)) {
      return ["ability", allAbilities[matchingAbility].name];
    }
    return ["ability", ""];
  }
}

export class StatusEffectRequirement extends EncounterPokemonRequirement {
  requiredStatusEffect: StatusEffect[];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(statusEffect: StatusEffect | StatusEffect[], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredStatusEffect = coerceArray(statusEffect);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredStatusEffect?.length < 0) {
      return false;
    }
    const x = this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
    console.log(x);
    return x;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(pokemon => {
        return this.requiredStatusEffect.some(statusEffect => {
          if (statusEffect === StatusEffect.NONE) {
            // StatusEffect.NONE also checks for null or undefined status
            return (
              isNullOrUndefined(pokemon.status)
              || isNullOrUndefined(pokemon.status.effect)
              || pokemon.status.effect === statusEffect
            );
          }
          return pokemon.status?.effect === statusEffect;
        });
      });
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed StatusEffects
    return partyPokemon.filter(pokemon => {
      return !this.requiredStatusEffect.some(statusEffect => {
        if (statusEffect === StatusEffect.NONE) {
          // StatusEffect.NONE also checks for null or undefined status
          return (
            isNullOrUndefined(pokemon.status)
            || isNullOrUndefined(pokemon.status.effect)
            || pokemon.status.effect === statusEffect
          );
        }
        return pokemon.status?.effect === statusEffect;
      });
    });
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const reqStatus = this.requiredStatusEffect.filter(a => {
      if (a === StatusEffect.NONE) {
        return (
          isNullOrUndefined(pokemon?.status) || isNullOrUndefined(pokemon.status.effect) || pokemon.status.effect === a
        );
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

  constructor(formChangeItem: FormChangeItem | FormChangeItem[], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredFormChangeItem = coerceArray(formChangeItem);
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon) || this.requiredFormChangeItem?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  filterByForm(pokemon, formChangeItem) {
    return (
      pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId) // Get all form changes for this species with an item trigger, including any compound triggers
      && pokemonFormChanges[pokemon.species.speciesId]
        .filter(fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger))
        // Returns true if any form changes match this item
        .flatMap(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
        .flatMap(fc => fc.item)
        .includes(formChangeItem)
    );
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon =>
          this.requiredFormChangeItem.filter(formChangeItem => this.filterByForm(pokemon, formChangeItem)).length > 0,
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed formChangeItems
    return partyPokemon.filter(
      pokemon =>
        this.requiredFormChangeItem.filter(formChangeItem => this.filterByForm(pokemon, formChangeItem)).length === 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = this.requiredFormChangeItem.filter(formChangeItem =>
      this.filterByForm(pokemon, formChangeItem),
    );
    if (requiredItems.length > 0) {
      return ["formChangeItem", FormChangeItem[requiredItems[0]]];
    }
    return ["formChangeItem", ""];
  }
}

export class HeldItemRequirement extends EncounterPokemonRequirement {
  requiredHeldItemModifiers: string[];
  minNumberOfPokemon: number;
  invertQuery: boolean;
  requireTransferable: boolean;

  constructor(heldItem: string | string[], minNumberOfPokemon = 1, invertQuery = false, requireTransferable = true) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHeldItemModifiers = coerceArray(heldItem);
    this.requireTransferable = requireTransferable;
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon)) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(pokemon =>
        this.requiredHeldItemModifiers.some(heldItem => {
          return pokemon.getHeldItems().some(it => {
            return it.constructor.name === heldItem && (!this.requireTransferable || it.isTransferable);
          });
        }),
      );
    }
    // for an inverted query, we only want to get the pokemon that have any held items that are NOT in requiredHeldItemModifiers
    // E.g. functions as a blacklist
    return partyPokemon.filter(
      pokemon =>
        pokemon.getHeldItems().filter(it => {
          return (
            !this.requiredHeldItemModifiers.some(heldItem => it.constructor.name === heldItem)
            && (!this.requireTransferable || it.isTransferable)
          );
        }).length > 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = pokemon?.getHeldItems().filter(it => {
      return (
        this.requiredHeldItemModifiers.some(heldItem => it.constructor.name === heldItem)
        && (!this.requireTransferable || it.isTransferable)
      );
    });
    if (requiredItems && requiredItems.length > 0) {
      return ["heldItem", requiredItems[0].type.name];
    }
    return ["heldItem", ""];
  }
}

export class AttackTypeBoosterHeldItemTypeRequirement extends EncounterPokemonRequirement {
  requiredHeldItemTypes: PokemonType[];
  minNumberOfPokemon: number;
  invertQuery: boolean;
  requireTransferable: boolean;

  constructor(
    heldItemTypes: PokemonType | PokemonType[],
    minNumberOfPokemon = 1,
    invertQuery = false,
    requireTransferable = true,
  ) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHeldItemTypes = coerceArray(heldItemTypes);
    this.requireTransferable = requireTransferable;
  }

  override meetsRequirement(): boolean {
    const partyPokemon = globalScene.getPlayerParty();
    if (isNullOrUndefined(partyPokemon)) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(pokemon =>
        this.requiredHeldItemTypes.some(heldItemType => {
          return pokemon.getHeldItems().some(it => {
            return (
              it instanceof AttackTypeBoosterModifier
              && (it.type as AttackTypeBoosterModifierType).moveType === heldItemType
              && (!this.requireTransferable || it.isTransferable)
            );
          });
        }),
      );
    }
    // for an inverted query, we only want to get the pokemon that have any held items that are NOT in requiredHeldItemModifiers
    // E.g. functions as a blacklist
    return partyPokemon.filter(
      pokemon =>
        pokemon.getHeldItems().filter(it => {
          return !this.requiredHeldItemTypes.some(
            heldItemType =>
              it instanceof AttackTypeBoosterModifier
              && (it.type as AttackTypeBoosterModifierType).moveType === heldItemType
              && (!this.requireTransferable || it.isTransferable),
          );
        }).length > 0,
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = pokemon?.getHeldItems().filter(it => {
      return (
        this.requiredHeldItemTypes.some(
          heldItemType =>
            it instanceof AttackTypeBoosterModifier
            && (it.type as AttackTypeBoosterModifierType).moveType === heldItemType,
        )
        && (!this.requireTransferable || it.isTransferable)
      );
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

  constructor(requiredLevelRange: [number, number], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredLevelRange = requiredLevelRange;
  }

  override meetsRequirement(): boolean {
    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this.requiredLevelRange) && this.requiredLevelRange[0] <= this.requiredLevelRange[1]) {
      const partyPokemon = globalScene.getPlayerParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon => pokemon.level >= this.requiredLevelRange[0] && pokemon.level <= this.requiredLevelRange[1],
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredLevelRanges
    return partyPokemon.filter(
      pokemon => pokemon.level < this.requiredLevelRange[0] || pokemon.level > this.requiredLevelRange[1],
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    return ["level", pokemon?.level.toString() ?? ""];
  }
}

export class FriendshipRequirement extends EncounterPokemonRequirement {
  requiredFriendshipRange: [number, number];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(requiredFriendshipRange: [number, number], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredFriendshipRange = requiredFriendshipRange;
  }

  override meetsRequirement(): boolean {
    // Party Pokemon inside required friendship range
    if (
      !isNullOrUndefined(this.requiredFriendshipRange)
      && this.requiredFriendshipRange[0] <= this.requiredFriendshipRange[1]
    ) {
      const partyPokemon = globalScene.getPlayerParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon =>
          pokemon.friendship >= this.requiredFriendshipRange[0]
          && pokemon.friendship <= this.requiredFriendshipRange[1],
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredFriendshipRanges
    return partyPokemon.filter(
      pokemon =>
        pokemon.friendship < this.requiredFriendshipRange[0] || pokemon.friendship > this.requiredFriendshipRange[1],
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
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

  constructor(requiredHealthRange: [number, number], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHealthRange = requiredHealthRange;
  }

  override meetsRequirement(): boolean {
    // Party Pokemon's health inside required health range
    if (!isNullOrUndefined(this.requiredHealthRange) && this.requiredHealthRange[0] <= this.requiredHealthRange[1]) {
      const partyPokemon = globalScene.getPlayerParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(pokemon => {
        return (
          pokemon.getHpRatio() >= this.requiredHealthRange[0] && pokemon.getHpRatio() <= this.requiredHealthRange[1]
        );
      });
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredHealthRanges
    return partyPokemon.filter(
      pokemon =>
        pokemon.getHpRatio() < this.requiredHealthRange[0] || pokemon.getHpRatio() > this.requiredHealthRange[1],
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    const hpRatio = pokemon?.getHpRatio();
    if (!isNullOrUndefined(hpRatio)) {
      return ["healthRatio", Math.floor(hpRatio * 100).toString() + "%"];
    }
    return ["healthRatio", ""];
  }
}

export class WeightRequirement extends EncounterPokemonRequirement {
  requiredWeightRange: [number, number];
  minNumberOfPokemon: number;
  invertQuery: boolean;

  constructor(requiredWeightRange: [number, number], minNumberOfPokemon = 1, invertQuery = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredWeightRange = requiredWeightRange;
  }

  override meetsRequirement(): boolean {
    // Party Pokemon's weight inside required weight range
    if (!isNullOrUndefined(this.requiredWeightRange) && this.requiredWeightRange[0] <= this.requiredWeightRange[1]) {
      const partyPokemon = globalScene.getPlayerParty();
      const pokemonInRange = this.queryParty(partyPokemon);
      if (pokemonInRange.length < this.minNumberOfPokemon) {
        return false;
      }
    }
    return true;
  }

  override queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter(
        pokemon =>
          pokemon.getWeight() >= this.requiredWeightRange[0] && pokemon.getWeight() <= this.requiredWeightRange[1],
      );
    }
    // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredWeightRanges
    return partyPokemon.filter(
      pokemon => pokemon.getWeight() < this.requiredWeightRange[0] || pokemon.getWeight() > this.requiredWeightRange[1],
    );
  }

  override getDialogueToken(pokemon?: PlayerPokemon): [string, string] {
    return ["weight", pokemon?.getWeight().toString() ?? ""];
  }
}
