import i18next from "i18next";
import * as Utils from "./utils";
import Pokemon from "./field/pokemon";
import { PlayerPokemon, EnemyPokemon } from "./field/pokemon";
import { Nature, getNatureDecrease, getNatureIncrease, getNatureName } from "./data/nature";
import BattleScene from "./battle-scene";
import { OptionSelectItem } from "./ui/abstact-option-select-ui-handler";
import { TrainerType } from "#enums/trainer-type";
import { Modifier, PokemonHeldItemModifier } from "./modifier/modifier";
import Battle from "./battle";
import { getBiomeName } from "./data/biomes";
import { trainerConfigs } from "./data/trainer-config";

/**
 * All logs.
 * 
 * Format: [filename, localStorage key, name, header, item sprite, header suffix]
 */
export const logs: string[][] = [
  ["instructions.txt", "path_log", "Steps", "Run Steps", "blunder_policy", ""],
  ["encounters.csv", "enc_log", "Encounters", "Encounter Data", "ub", ",,,,,,,,,,,,,,,,"],
]
export var logKeys: string[] = [
  "i", // Instructions/steps
  "e", // Encounters
  "d", // Debug
];

export var StoredLog: DRPD = undefined;

export const DRPD_Version = "1.0.0"
export const acceptedVersions = [
  "1.0.0"
]
export interface DRPD {
  version: string,
  title?: string,
  authors: string[],
  date: string,
  waves: Wave[],
  starters?: PokeData[],
  filename: string
}
export interface Wave {
  id: integer,
  reload: boolean,
  type: string,
  double: boolean,
  actions: string[],
  shop: string,
  biome: string,
  trainer?: TrainerData,
  pokemon?: PokeData[]
}
export interface PokeData {
  id: integer,
  name: string,
  ability: string,
  isHiddenAbility: boolean,
  passiveAbility: string,
  nature: NatureData,
  gender: string,
  rarity: string,
  captured: boolean,
  level: integer,
  items: ItemData[],
  ivs: IVData,
  source?: Pokemon
}
export interface NatureData {
  name: string,
  increased: string,
  decreased: string
}
export interface IVData {
  hp: integer,
  atk: integer,
  def: integer,
  spatk: integer,
  spdef: integer,
  speed: integer
}
export interface TrainerData {
  id: integer,
  name: string,
  type: string,
}
export interface ItemData {
  id: string,
  name: string,
  quantity: integer,
}

export function newDocument(name: string = "Untitled Run " + (new Date().getUTCMonth() + 1 < 10 ? "0" : "") + (new Date().getUTCMonth() + 1) + "/" + (new Date().getUTCDate() < 10 ? "0" : "") + new Date().getUTCDate() + "/" + new Date().getUTCFullYear(), authorName: string | string[] = "Write your name here"): DRPD {
  return {
    version: DRPD_Version,
    title: name,
    authors: (Array.isArray(authorName) ? authorName : [authorName]),
    date: (new Date().getUTCMonth() + 1 < 10 ? "0" : "") + (new Date().getUTCMonth() + 1) + "-" + (new Date().getUTCDate() < 10 ? "0" : "") + new Date().getUTCDate() + "-" + new Date().getUTCFullYear(),
    waves: new Array(50),
    starters: new Array(3),
    filename: (new Date().getUTCMonth() + 1 < 10 ? "0" : "") + (new Date().getUTCMonth() + 1) + "-" + (new Date().getUTCDate() < 10 ? "0" : "") + new Date().getUTCDate() + "-" + new Date().getUTCFullYear() + "_untitled" 
  }
}
export function importDocument(drpd: string): DRPD {
  return JSON.parse(drpd) as DRPD;
}
export function exportPokemon(pokemon: Pokemon, encounterRarity?: string): PokeData {
  return {
    id: pokemon.species.speciesId,
    name: pokemon.species.getName(),
    ability: pokemon.getAbility().name,
    isHiddenAbility: pokemon.hasAbility(pokemon.species.abilityHidden),
    passiveAbility: pokemon.getPassiveAbility().name,
    nature: exportNature(pokemon.nature),
    gender: pokemon.gender == 0 ? "Male" : (pokemon.gender == 1 ? "Female" : "Genderless"),
    rarity: encounterRarity,
    captured: false,
    level: pokemon.level,
    items: pokemon.getHeldItems().map(item => exportItem(item)),
    ivs: exportIVs(pokemon.ivs)
  }
}
export function exportNature(nature: Nature): NatureData {
  return {
    name: getNatureName(nature),
    increased: getNatureIncrease(nature),
    decreased: getNatureDecrease(nature),
  }
}
export function exportItem(item: PokemonHeldItemModifier): ItemData {
  return {
    id: item.type.id,
    name: item.type.name,
    quantity: item.getStackCount()
  }
}
export function exportIVs(ivs: integer[]): IVData {
  return {
    hp: ivs[0],
    atk: ivs[1],
    def: ivs[2],
    spatk: ivs[3],
    spdef: ivs[4],
    speed: ivs[5]
  }
}
export function exportWave(scene: BattleScene): Wave {
  var ret: Wave = {
    id: scene.currentBattle.waveIndex,
    reload: false,
    type: scene.getEnemyField()[0].hasTrainer() ? "trainer" : scene.getEnemyField()[0].isBoss() ? "boss" : "wild",
    double: scene.currentBattle.double,
    actions: [],
    shop: "",
    biome: getBiomeName(scene.arena.biomeType)
  }
  switch (ret.type) {
    case "wild":
    case "boss":
      ret.pokemon = []
      for (var i = 0; i < scene.getEnemyParty().length; i++) {
        ret.pokemon.push(exportPokemon(scene.getEnemyParty()[i]))
      }
      break;
    case "trainer":
      ret.trainer = {
        id: scene.currentBattle.trainer.config.trainerType,
        name: scene.currentBattle.trainer.name,
        type: scene.currentBattle.trainer.config.title
      }
      ret.pokemon = []
      for (var i = 0; i < scene.getEnemyParty().length; i++) {
        ret.pokemon.push(exportPokemon(scene.getEnemyParty()[i]))
      }
      break;
  }
  return ret;
}

export const byteSize = str => new Blob([str]).size
const filesizes = ["b", "kb", "mb", "gb", "tb"]
export function getSize(str: string) {
  var d = byteSize(str)
  var unit = 0
  while (d > 1000 && unit < filesizes.length - 1) {
    d = Math.round(d/100)/10
    unit++
  }
  return d.toString() + filesizes[unit]
}

export function generateOption(i: integer): OptionSelectItem {
  if (logs[i][4] != "") {
    return {
      label: `Export ${logs[i][2]} (${getSize(localStorage.getItem(logs[i][1]))})`,
      handler: () => {
        downloadLogByID(i)
        return false;
      },
      item: logs[i][4]
    }
  } else {
    return {
      label: `Export ${logs[i][2]} (${getSize(localStorage.getItem(logs[i][1]))})`,
      handler: () => {
        downloadLogByID(i)
        return false;
      }
    }
  }
}

/**
 * Writes data to a new line.
 * @param keyword The identifier key for the log you're writing to
 * @param data The string you're writing to the given log
 */
export function toLog(keyword: string, data: string) {
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], localStorage.getItem(logs[logKeys.indexOf(keyword)][1] + "\n" + data))
}
/**
 * Writes data on the same line you were on.
 * @param keyword The identifier key for the log you're writing to
 * @param data The string you're writing to the given log
 */
export function appendLog(keyword: string, data: string) {
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], localStorage.getItem(logs[logKeys.indexOf(keyword)][1] + data))
}
/**
 * 
 * Clears all data from a log.
 * @param keyword The identifier key for the log you want to reste
 */
export function clearLog(keyword: string) {
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], "---- " + logs[logKeys.indexOf(keyword)][3] + " ----" + logs[logKeys.indexOf(keyword)][5])
}
/**
 * Saves a log to your device.
 * @param keyword The identifier key for the log you want to reste
 */
export function downloadLog(keyword: string) {
  var d = localStorage.getItem(logs[logKeys.indexOf(keyword)][1])
  // logs[logKeys.indexOf(keyword)][1]
  const blob = new Blob([ d ], {type: "text/json"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${logs[logKeys.indexOf(keyword)][0]}`;
  link.click();
  link.remove();
}
export function downloadLogByID(i: integer) {
  console.log(i)
  var d = localStorage.getItem(logs[i][1])
  const blob = new Blob([ d ], {type: "text/json"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = `${logs[i][0]}`;
  link.click();
  link.remove();
}
export function logTeam(scene: BattleScene, floor: integer = undefined) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  var team = scene.getEnemyParty()
  if (team[0].hasTrainer()) {
    var sprite = scene.currentBattle.trainer.config.getSpriteKey()
    var trainerCat = Utils.getEnumKeys(TrainerType)[Utils.getEnumValues(TrainerType).indexOf(scene.currentBattle.trainer.config.trainerType)]
    setRow("e", floor + ",0," + sprite + ",trainer," + trainerCat + ",,,,,,,,,,,,", floor, 0)
  } else {
    for (var i = 0; i < team.length; i++) {
      logPokemon(scene, floor, i, team[i])
    }
    if (team.length == 1) {
      //setRow("e", ",,,,,,,,,,,,,,,,", floor, 1)
    }
  }
}
export function logPokemon(scene: BattleScene, floor: integer = undefined, slot: integer, pokemon: EnemyPokemon) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  var modifiers: string[] = []
  var mods = pokemon.getHeldItems()
  for (var i = 0; i < mods.length; i++) {
    modifiers.push(mods[i].type.name + (mods[i].getMaxStackCount(scene) == 1 ? "" : " x" + mods[i].getStackCount()))
  }
  var sprite = pokemon.getBattleSpriteAtlasPath()
  // floor,party slot,encounter,species,ability,passive,level,gender,isBoss,nature,HP IV,Attack IV,Defense IV,Sp. Atk IV,Sp. Def IV,Speed IV,Items separated by slashes /
  var newLine = floor + ","
    + slot + ","
    + sprite + ","
    + (pokemon.hasTrainer() ? "trainer_pokemon" : "wild") + ","
    + pokemon.species.getName(pokemon.formIndex) + (pokemon.getFormKey() == "" ? "" : " (" + pokemon.getFormKey() + ")") + ","
    + pokemon.getAbility().name.toLowerCase() + ","
    + pokemon.getPassiveAbility().name.toLowerCase() + ","
    + pokemon.level + ","
    + (pokemon.gender == 0 ? "M" : (pokemon.gender == 1 ? "F" : "")) + ","
    + (pokemon.isBoss() ? "true" : "false") + ","
    + getNatureName(pokemon.nature) + ","
    + pokemon.ivs[0] + ","
    + pokemon.ivs[1] + ","
    + pokemon.ivs[2] + ","
    + pokemon.ivs[3] + ","
    + pokemon.ivs[4] + ","
    + pokemon.ivs[5] + ","
    + modifiers.join("/")
  //console.log(idx, data.slice(0, idx), newLine, data.slice(idx))
  setRow("e", newLine, floor, slot)
  //console.log(localStorage.getItem(logs[logKeys.indexOf("e")][1]).split("\n"))
}
export function dataSorter(a: string, b: string) {
  var da = a.split(",")
  var db = b.split(",")
  if (da[0] == "---- " + logs[logKeys.indexOf("e")][3] + " ----") {
    return -1;
  }
  if (db[0] == "---- " + logs[logKeys.indexOf("e")][3] + " ----") {
    return 1;
  }
  if (da[0] == db[0]) {
    return ((da[1] as any) * 1) - ((db[1] as any) * 1)
  }
  return ((da[0] as any) * 1) - ((db[0] as any) * 1)
}
export function setRow(keyword: string, newLine: string, floor: integer, slot: integer) {
  var data = localStorage.getItem(logs[logKeys.indexOf(keyword)][1]).split("\n")
  data.sort(dataSorter)
  var idx = 1
  if (slot == -1) {
    while (idx < data.length && (data[idx].split(",")[0] as any) * 1 < floor) {
      idx++
    }
    idx--
    slot = ((data[idx].split(",")[1] as any) * 1) + 1
  } else {
    while (idx < data.length && (data[idx].split(",")[0] as any) * 1 <= floor && (data[idx].split(",")[1] as any) * 1 <= slot) {
      idx++
    }
    idx--
    for (var i = 0; i < data.length; i++) {
      if (data[i] == ",,,,,,,,,,,,,,,,") {
        data.splice(i, 1)
        if (idx > i) idx--
        i--
      }
    }
    console.log((data[idx].split(",")[0] as any) * 1, floor, (data[idx].split(",")[1] as any) * 1, slot)
    if (idx < data.length && (data[idx].split(",")[0] as any) * 1 == floor && (data[idx].split(",")[1] as any) * 1 == slot) {
      data[idx] = newLine
      console.log("Overwrote data at " + idx)
      var i: number;
      for (i = 0; i < Math.max(0, idx - 2) && i < 2; i++) {
        console.log(i + " " + data[i])
      }
      if (i == 3 && i != Math.min(0, idx - 2)) {
        console.log("...")
      }
      for (i = Math.max(0, idx - 2); i <= idx + 2 && i < data.length; i++) {
        console.log(i + (i == idx ? " >> " : " ") + data[i])
      }
      localStorage.setItem(logs[logKeys.indexOf(keyword)][1], data.join("\n"));
      return;
    }
    idx++
  }
  for (var i = 0; i < data.length; i++) {
    if (data[i] == ",,,,,,,,,,,,,,,,") {
      data.splice(i, 1)
      if (idx > i) idx--
      i--
    }
  }
  console.log("Inserted data at " + idx)
  var i: number;
  for (i = 0; i < Math.max(0, idx - 2) && i < 2; i++) {
    console.log(i + " " + data[i])
  }
  if (i == 3 && i != Math.min(0, idx - 2)) {
    console.log("...")
  }
  for (i = Math.max(0, idx - 2); i < idx; i++) {
    console.log(i + " " + data[i])
  }
  console.log(i + " >> " + newLine)
  for (i = idx; i <= idx + 2 && i < data.length; i++) {
    console.log(i + " " + data[i])
  }
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], data.slice(0, idx).join("\n") + "\n" + newLine + (data.slice(idx).length == 0 ? "" : "\n") + data.slice(idx).join("\n"));
}