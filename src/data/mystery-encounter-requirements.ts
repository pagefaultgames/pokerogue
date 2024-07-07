import { PlayerPokemon } from "#app/field/pokemon";
import { ModifierType, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import BattleScene from "../battle-scene";
import { isNullOrUndefined } from "../utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { TimeOfDay } from "#enums/time-of-day";
import { Nature } from "./nature";
import { EvolutionItem, pokemonEvolutions } from "./pokemon-evolutions";
import { FormChangeItem, SpeciesFormChangeItemTrigger, pokemonFormChanges } from "./pokemon-forms";
import { SpeciesFormKey } from "./pokemon-species";
import { StatusEffect } from "./status-effect";
import { Type } from "./type";
import { WeatherType } from "./weather";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";

export interface EncounterRequirement {
  meetsRequirement(scene: BattleScene): boolean; // Boolean to see if a requirement is met
  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string];
}

export abstract class EncounterSceneRequirement implements EncounterRequirement {
  meetsRequirement(scene: BattleScene): boolean {
    throw new Error("Method not implemented.");
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["", ""];
  }
}

export abstract class EncounterPokemonRequirement implements EncounterRequirement {
  minNumberOfPokemon: number;
  invertQuery: boolean;

  meetsRequirement(scene: BattleScene): boolean {
    throw new Error("Method not implemented.");
  }

  // Returns all party members that are compatible with this requirement. For non pokemon related requirements, the entire party is returned..
  queryParty(partyPokemon: PlayerPokemon[]) {
    return [];
  }

  // Doesn't require the "@ec" as prefix, just the string; populates the token with the attribute
  // ex. @ec{primarySpecies} if strPrefix is simply "primary"
  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["", ""];
  }
}

export class PreviousEncounterRequirement extends EncounterSceneRequirement {
  previousEncounterRequirement: MysteryEncounterType;

  /**
   * Used for specifying an encounter that must be seen before this encounter can spawn
   * @param previousEncounterRequirement
   */
  constructor(previousEncounterRequirement) {
    super();
    this.previousEncounterRequirement = previousEncounterRequirement;
  }

  meetsRequirement(scene: BattleScene): boolean {
    return scene.mysteryEncounterData.encounteredEvents.some(e => e[0] === this.previousEncounterRequirement);
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["previousEncounter", scene.mysteryEncounterData.encounteredEvents.find(e => e[0] === this.previousEncounterRequirement)[0].toString()];
  }
}

export class WaveCountRequirement extends EncounterSceneRequirement {
  waveRange: [number, number];

  /**
   * Used for specifying a unique wave or wave range requirement
   * If minWaveIndex and maxWaveIndex are equivalent, will check for exact wave number
   * @param waveRange - [min, max]
   */
  constructor(waveRange: [number, number]) {
    super();
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

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["waveCount", scene.currentBattle.waveIndex.toString()];
  }
}

export class TimeOfDayRequirement extends EncounterSceneRequirement {
  requiredTimeOfDay?: TimeOfDay[];

  constructor(timeOfDay: TimeOfDay | TimeOfDay[]) {
    super();
    if (timeOfDay instanceof Array) {
      this.requiredTimeOfDay = timeOfDay;
    } else {
      this.requiredTimeOfDay = [];
      this.requiredTimeOfDay.push(timeOfDay);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const timeOfDay = scene.arena?.getTimeOfDay();
    if (!isNullOrUndefined(timeOfDay) && this?.requiredTimeOfDay?.length > 0 && !this.requiredTimeOfDay.includes(timeOfDay)) {
      return false;
    }

    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["timeOfDay", TimeOfDay[scene.arena.getTimeOfDay()].toLocaleLowerCase()];
  }
}

export class WeatherRequirement extends EncounterSceneRequirement {
  requiredWeather?: WeatherType[];

  constructor(weather: WeatherType | WeatherType[]) {
    super();
    if (weather instanceof Array) {
      this.requiredWeather = weather;
    } else {
      this.requiredWeather = [];
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
  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["weather", WeatherType[scene.arena?.weather?.weatherType].replace("_", " ").toLocaleLowerCase()];
  }
}

export class PartySizeRequirement extends EncounterSceneRequirement {
  partySizeRange: [number, number];

  /**
   * Used for specifying a party size requirement
   * If min and max are equivalent, will check for exact size
   * @param partySizeRange - [min, max]
   */
  constructor(partySizeRange: [number, number]) {
    super();
    this.partySizeRange = partySizeRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    if (!isNullOrUndefined(this?.partySizeRange) && this.partySizeRange?.[0] <= this.partySizeRange?.[1]) {
      const partySize = scene.getParty().length;
      if (partySize >= 0 && (this?.partySizeRange?.[0] >= 0 && this.partySizeRange?.[0] > partySize) || (this?.partySizeRange?.[1] >= 0 && this.partySizeRange?.[1] < partySize)) {
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
  requiredItems?: ModifierType[]; // TODO: not implemented
  constructor(item: ModifierType | ModifierType[]) {
    super();
    if (item instanceof Array) {
      this.requiredItems = item;
    } else {
      this.requiredItems = [];
      this.requiredItems.push(item);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const items = scene.modifiers;

    if (!isNullOrUndefined(items) && this?.requiredItems.length > 0 && this.requiredItems.filter((searchingMod) =>
      items.filter((itemInScene) => itemInScene.type.id === searchingMod.id).length > 0).length === 0) {
      return false;
    }
    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const requiredItemsInInventory = this.requiredItems.filter((a) => {
      scene.modifiers.filter((itemInScene)  => itemInScene.type.id === a.id).length > 0;
    });
    if (requiredItemsInInventory.length > 0) {
      return ["requiredItem", requiredItemsInInventory[0].name];
    }
    return null;
  }
}

export class MoneyRequirement extends EncounterSceneRequirement {
  requiredMoney: number;

  constructor(requiredMoney: number) {
    super();
    this.requiredMoney = requiredMoney;
  }

  meetsRequirement(scene: BattleScene): boolean {
    const money = scene.money;
    if (!isNullOrUndefined(money) && this?.requiredMoney > 0 && this.requiredMoney > money) {
      return false;
    }
    return true;
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["money", "₽" + scene.money.toString()];
  }
}

export class SpeciesRequirement extends EncounterPokemonRequirement {
  requiredSpecies: Species[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(species: Species | Species[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (species instanceof Array) {
      this.requiredSpecies = species;
    } else {
      this.requiredSpecies = [];
      this.requiredSpecies.push(species);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredSpecies?.length < 0) {
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
    if (this.requiredSpecies.includes(pokemon.species.speciesId)) {
      return ["species", Species[pokemon.species.speciesId]];
    }
    return null;
  }
}


export class NatureRequirement extends EncounterPokemonRequirement {
  requiredNature: Nature[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(nature: Nature | Nature[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (nature instanceof Array) {
      this.requiredNature = nature;
    } else {
      this.requiredNature = [];
      this.requiredNature.push(nature);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredNature?.length < 0) {
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
    if (this.requiredNature.includes(pokemon.nature)) {
      return ["nature", Nature[pokemon.nature]];
    }
    return null;
  }
}

export class TypeRequirement extends EncounterPokemonRequirement {
  requiredType: Type[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(type: Type | Type[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (type instanceof Array) {
      this.requiredType = type;
    } else {
      this.requiredType = [];
      this.requiredType.push(type);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredType?.length < 0) {
      return false;
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
    const includedTypes = this.requiredType.filter((ty) => pokemon.getTypes().includes(ty));
    if (includedTypes.length > 0) {
      return ["type", Type[includedTypes[0]]];
    }
    return null;
  }
}


export class MoveRequirement extends EncounterPokemonRequirement {
  requiredMoves: Moves[] = [];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(moves: Moves | Moves[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (moves instanceof Array) {
      this.requiredMoves = moves;
    } else {
      this.requiredMoves = [];
      this.requiredMoves.push(moves);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredMoves?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((reqMove) => pokemon.moveset.filter((move) => move.moveId === reqMove).length > 0).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed moves
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((reqMove) => pokemon.moveset.filter((move) => move.moveId === reqMove).length === 0).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const includedMoves = this.requiredMoves.filter((reqMove) => pokemon.moveset.filter((move) => move.moveId === reqMove).length > 0);
    if (includedMoves.length > 0) {
      return ["move", Moves[includedMoves[0]].replace("_", " ")];
    }
    return null;
  }

}

/**
 * Find out if Pokemon in the party are able to learn one of many specific moves by TM.
 * NOTE: Egg moves are not included as learnable.
 * NOTE: If the Pokemon already knows the move, this requirement will fail, since it's not technically learnable.
 */
export class CompatibleMoveRequirement extends EncounterPokemonRequirement {
  requiredMoves: Moves[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(learnableMove: Moves | Moves[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (learnableMove instanceof Array) {
      this.requiredMoves = learnableMove;
    } else {
      this.requiredMoves = [];
      this.requiredMoves.push(learnableMove);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredMoves?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((learnableMove) => pokemon.compatibleTms.filter(tm => !pokemon.moveset.find(m => m.moveId === tm)).includes(learnableMove)).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed learnableMoves
      return partyPokemon.filter((pokemon) => this.requiredMoves.filter((learnableMove) => pokemon.compatibleTms.filter(tm => !pokemon.moveset.find(m => m.moveId === tm)).includes(learnableMove)).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const includedCompatMoves = this.requiredMoves.filter((reqMove) => pokemon.compatibleTms.filter((tm) => !pokemon.moveset.find(m => m.moveId === tm)).includes(reqMove));
    if (includedCompatMoves.length > 0) {
      return ["compatibleMove", Moves[includedCompatMoves[0]]];
    }
    return null;
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
    if (evolutionTargetSpecies instanceof Array) {
      this.requiredEvolutionTargetSpecies = evolutionTargetSpecies;
    } else {
      this.requiredEvolutionTargetSpecies = [];
      this.requiredEvolutionTargetSpecies.push(evolutionTargetSpecies);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredEvolutionTargetSpecies?.length < 0) {
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
      return ["Evolution", Species[evos[0]]];
    }
    return null;
  }

}*/

export class AbilityRequirement extends EncounterPokemonRequirement {
  requiredAbilities: Abilities[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(abilities: Abilities | Abilities[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (abilities instanceof Array) {
      this.requiredAbilities = abilities;
    } else {
      this.requiredAbilities = [];
      this.requiredAbilities.push(abilities);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredAbilities?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredAbilities.filter((abilities) => pokemon.hasAbility(abilities)).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed abilitiess
      return partyPokemon.filter((pokemon) => this.requiredAbilities.filter((abilities) => pokemon.hasAbility(abilities)).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const reqAbilities = this.requiredAbilities.filter((a) => {
      pokemon.hasAbility(a);
    });
    if (reqAbilities.length > 0) {
      return ["ability", Abilities[reqAbilities[0]]];
    }
    return null;
  }
}

export class StatusEffectRequirement extends EncounterPokemonRequirement {
  requiredStatusEffect: StatusEffect[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(StatusEffect: StatusEffect | StatusEffect[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (StatusEffect instanceof Array) {
      this.requiredStatusEffect = StatusEffect;
    } else {
      this.requiredStatusEffect = [];
      this.requiredStatusEffect.push(StatusEffect);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredStatusEffect?.length < 0) {
      return false;
    }
    const x = this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
    console.log(x);
    return x;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredStatusEffect.filter((StatusEffect) => pokemon.status?.effect === StatusEffect).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed StatusEffects
      return partyPokemon.filter((pokemon) => this.requiredStatusEffect.filter((StatusEffect) => pokemon.status?.effect === StatusEffect).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const reqStatus = this.requiredStatusEffect.filter((a) => {
      pokemon.status?.effect ===(a);
    });
    if (reqStatus.length > 0) {
      return ["status", StatusEffect[reqStatus[0]]];
    }
    return null;
  }

}

/**
 * Finds if there are pokemon that can form change with a given item.
 * Notice that we mean specific items, like Charizardite, not the Mega Bracelet.
 * If you want to trigger the event based on the form change enabler, use PersistentModifierRequirement.
 */
export class CanFormChangeWithItemRequirement extends EncounterPokemonRequirement {
  requiredFormChangeItem: FormChangeItem[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(formChangeItem: FormChangeItem | FormChangeItem[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (formChangeItem instanceof Array) {
      this.requiredFormChangeItem = formChangeItem;
    } else {
      this.requiredFormChangeItem = [];
      this.requiredFormChangeItem.push(formChangeItem);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredFormChangeItem?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }
  filterByForm(pokemon, formChangeItem)  {
    if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId)
    // Get all form changes for this species with an item trigger, including any compound triggers
    && pokemonFormChanges[pokemon.species.speciesId].filter(fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger))
    // Returns true if any form changes match this item
      .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
      .flat().flatMap(fc => fc.item).includes(formChangeItem))  {
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
    return null;
  }

}

export class CanEvolveWithItemRequirement extends EncounterPokemonRequirement {
  requiredEvolutionItem: EvolutionItem[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(evolutionItems: EvolutionItem | EvolutionItem[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (evolutionItems instanceof Array) {
      this.requiredEvolutionItem = evolutionItems;
    } else {
      this.requiredEvolutionItem = [];
      this.requiredEvolutionItem.push(evolutionItems);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredEvolutionItem?.length < 0) {
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
    return null;
  }
}

export class HeldItemRequirement extends EncounterPokemonRequirement {
  requiredHeldItemModifier: PokemonHeldItemModifierType[];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(heldItem: PokemonHeldItemModifierType | PokemonHeldItemModifierType[], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    if (heldItem instanceof Array) {
      this.requiredHeldItemModifier = heldItem;
    } else {
      this.requiredHeldItemModifier = [];
      this.requiredHeldItemModifier.push(heldItem);
    }
  }

  meetsRequirement(scene: BattleScene): boolean {
    const partyPokemon = scene.getParty();
    if (isNullOrUndefined(partyPokemon) || this?.requiredHeldItemModifier?.length < 0) {
      return false;
    }
    return this.queryParty(partyPokemon).length >= this.minNumberOfPokemon;
  }

  queryParty(partyPokemon: PlayerPokemon[]): PlayerPokemon[] {
    if (!this.invertQuery) {
      return partyPokemon.filter((pokemon) => this.requiredHeldItemModifier.filter((heldItem) => pokemon.getHeldItems().filter((it) => it.type.id === heldItem.id).length > 0).length > 0);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed heldItems
      return partyPokemon.filter((pokemon) => this.requiredHeldItemModifier.filter((heldItem) => pokemon.getHeldItems().filter((it) => it.type.id === heldItem.id).length === 0).length === 0);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    const requiredItems = this.requiredHeldItemModifier.filter((a) => {
      pokemon.getHeldItems().filter((it) => it.type.id === a.id ).length > 0;
    });
    if (requiredItems.length > 0) {
      return ["heldItem", requiredItems[0].name];
    }
    return null;
  }
}

export class LevelRequirement extends EncounterPokemonRequirement {
  requiredLevelRange?: [number, number];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(requiredLevelRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredLevelRange = requiredLevelRange;

  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this?.requiredLevelRange) && this.requiredLevelRange?.[0] <= this.requiredLevelRange?.[1]) {
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
    return ["level", pokemon.level.toString()];
  }
}

export class FriendshipRequirement extends EncounterPokemonRequirement {
  requiredFriendshipRange?: [number, number];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(requiredFriendshipRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredFriendshipRange = requiredFriendshipRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required friendship range
    if (!isNullOrUndefined(this?.requiredFriendshipRange) && this.requiredFriendshipRange?.[0] <= this.requiredFriendshipRange?.[1]) {
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
    return ["friendship", pokemon.friendship.toString()];
  }
}

/**
 * .1 -> 10% hp
 * .5 -> 50% hp
 * 1 -> 100% hp
 */
export class HealthRatioRequirement extends EncounterPokemonRequirement {
  requiredHealthRange?: [number, number];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(requiredHealthRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredHealthRange = requiredHealthRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required level range
    if (!isNullOrUndefined(this?.requiredHealthRange) && this.requiredHealthRange?.[0] <= this.requiredHealthRange?.[1]) {
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
      return partyPokemon.filter((pokemon) => pokemon.getHpRatio() >= this.requiredHealthRange[0] && pokemon.getHpRatio() <= this.requiredHealthRange[1]);
    } else {
      // for an inverted query, we only want to get the pokemon that don't have ANY of the listed requiredHealthRanges
      return partyPokemon.filter((pokemon) => pokemon.getHpRatio() < this.requiredHealthRange[0] || pokemon.getHpRatio() > this.requiredHealthRange[1]);
    }
  }

  getDialogueToken(scene: BattleScene, pokemon?: PlayerPokemon): [string, string] {
    return ["healthRatio", Math.floor(pokemon.getHpRatio()*100).toString() + "%"];
  }
}

export class WeightRequirement extends EncounterPokemonRequirement {
  requiredWeightRange?: [number, number];
  minNumberOfPokemon:number;
  invertQuery:boolean;

  constructor(requiredWeightRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false) {
    super();
    this.minNumberOfPokemon = minNumberOfPokemon;
    this.invertQuery = invertQuery;
    this.requiredWeightRange = requiredWeightRange;
  }

  meetsRequirement(scene: BattleScene): boolean {
    // Party Pokemon inside required friendship range
    if (!isNullOrUndefined(this?.requiredWeightRange) && this.requiredWeightRange?.[0] <= this.requiredWeightRange?.[1]) {
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
    return ["weight", pokemon.getWeight().toString()];
  }
}
