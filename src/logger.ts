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
import { getBiomeName, PokemonPools, SpeciesTree } from "./data/biomes";
import { trainerConfigs } from "./data/trainer-config";
import { Mode } from "./ui/ui";
import { TitlePhase } from "./phases";
import { Item } from "pokenode-ts";
import Trainer from "./field/trainer";
import { Species } from "./enums/species";
import { junit } from "node:test/reporters";
import { i } from "vitest/dist/reporters-xEmem8D4.js";
import { GameModes } from "./game-mode";

/**
 * All logs.
 * 
 * Format: [filename, localStorage key, name, header, item sprite, header suffix]
 */
export const logs: string[][] = [
  //["instructions.txt", "path_log", "Steps", "Run Steps", "blunder_policy", ""],
  //["encounters.csv", "enc_log", "Encounters", "Encounter Data", "ub", ",,,,,,,,,,,,,,,,"],
  ["drpd.json", "drpd", "DRPD", "", "wide_lens", ""],
  //["drpd1.json", "drpd1", "DRPD 1", "", "wide_lens", ""],
  //["drpd2.json", "drpd2", "DRPD 2", "", "wide_lens", ""],
  //["drpd3.json", "drpd3", "DRPD 3", "", "wide_lens", ""],
  //["drpd4.json", "drpd4", "DRPD 4", "", "wide_lens", ""],
  //["drpd5.json", "drpd5", "DRPD 5", "", "wide_lens", ""],
]
export const logKeys: string[] = [
  "i", // Instructions/steps
  "e", // Encounters
  "d", // Debug
];

export function getLogID(scene: BattleScene) {
  return "drpd_log:" + scene.seed
}
export function getLogs() {
  while(logs.length > 0)
    logs.pop()
  for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).substring(0, 9) == "drpd_log:") {
      logs.push(["drpd.json", localStorage.key(i), localStorage.key(i).substring(9), "", "", ""])
    }
  }
}
export function getMode(scene: BattleScene) {
  switch (scene.gameMode.modeId) {
    case GameModes.CLASSIC:
      return "Classic"
    case GameModes.ENDLESS:
      return "Endless"
    case GameModes.SPLICED_ENDLESS:
      return "Spliced Endless"
    case GameModes.DAILY:
      return "Daily"
    case GameModes.CHALLENGE:
      return "Challenge"
  }
}

export const rarities = []
export const rarityslot = [0]

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
  starters?: PokeData[]
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

export const Actions = []

export function newDocument(name: string = "Untitled Run", authorName: string | string[] = "Write your name here"): DRPD {
  return {
    version: DRPD_Version,
    title: name,
    authors: (Array.isArray(authorName) ? authorName : [authorName]),
    date: (new Date().getUTCMonth() + 1 < 10 ? "0" : "") + (new Date().getUTCMonth() + 1) + "-" + (new Date().getUTCDate() < 10 ? "0" : "") + new Date().getUTCDate() + "-" + new Date().getUTCFullYear(),
    waves: new Array(50),
    starters: new Array(3),
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
export function exportTrainer(trainer: Trainer): TrainerData {
  if (trainer.config.getTitle(0, trainer.variant) == "Finn") {
    return {
      id: trainer.config.trainerType,
      name: "Finn",
      type: "Rival"
    }
  }
  if (trainer.config.getTitle(0, trainer.variant) == "Ivy") {
    return {
      id: trainer.config.trainerType,
      name: "Ivy",
      type: "Rival"
    }
  }
  return {
    id: trainer.config.trainerType,
    name: trainer.name,
    type: trainer.config.getTitle(0, trainer.variant)
  }
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

export function generateOption(i: integer, saves: any): OptionSelectItem {
  var filename: string = (JSON.parse(localStorage.getItem(logs[i][1])) as DRPD).title
  var op: OptionSelectItem = {
    label: `Export ${filename} (${getSize(printDRPD("", "", JSON.parse(localStorage.getItem(logs[i][1])) as DRPD))})`,
    handler: () => {
      downloadLogByID(i)
      return false;
    }
  }
  for (var j = 0; j < saves.length; j++) {
    console.log(saves[j].seed, logs[i][2], saves[j].seed == logs[i][2])
    if (saves[j].seed == logs[i][2]) {
      op.label = "[Slot " + (j + 1) + "]" + op.label.substring(6)
    }
  }
  if (logs[i][4] != "") {
    op.label = " " + op.label
    op.item = logs[i][4]
  }
  return op;
}
export function generateAddOption(i: integer, scene: BattleScene, o: TitlePhase) {
  var op: OptionSelectItem = {
    label: "Generate log " + logs[i][0],
    handler: () => {
      localStorage.setItem(logs[i][1], JSON.stringify(newDocument()))
      o.callEnd();
      return true;
    }
  }
  return op;
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
  var d = JSON.parse(localStorage.getItem(logs[logKeys.indexOf(keyword)][1]))
  const blob = new Blob([ printDRPD("", "", d as DRPD) ], {type: "text/json"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  var date: string = (d as DRPD).date
  var filename: string = date[0] + date[1] + "_" + date[3] + date[4] + "_" + date[6] + date[7] + date[8] + date[9] + "_route.json"
  link.download = `${filename}`;
  link.click();
  link.remove();
}
export function downloadLogByID(i: integer) {
  console.log(i)
  var d = JSON.parse(localStorage.getItem(logs[i][1]))
  const blob = new Blob([ printDRPD("", "", d as DRPD) ], {type: "text/json"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  var date: string = (d as DRPD).date
  var filename: string = date[0] + date[1] + "_" + date[3] + date[4] + "_" + date[6] + date[7] + date[8] + date[9] + "_route.json"
  link.download = `${filename}`;
  link.click();
  link.remove();
}
export function logTeam(scene: BattleScene, floor: integer = undefined) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  var team = scene.getEnemyParty()
  console.log("Log Enemy Team")
  if (team[0].hasTrainer()) {
    //var sprite = scene.currentBattle.trainer.config.getSpriteKey()
    //var trainerCat = Utils.getEnumKeys(TrainerType)[Utils.getEnumValues(TrainerType).indexOf(scene.currentBattle.trainer.config.trainerType)]
    //setRow("e", floor + ",0," + sprite + ",trainer," + trainerCat + ",,,,,,,,,,,,", floor, 0)
  } else {
    for (var i = 0; i < team.length; i++) {
      logPokemon(scene, floor, i, team[i], rarities[i])
    }
    if (team.length == 1) {
      //setRow("e", ",,,,,,,,,,,,,,,,", floor, 1)
    }
  }
}
export function logActions(scene: BattleScene, floor: integer, action: string) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  console.log("Log Action", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  wv.actions.push(action)
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
export function logShop(scene: BattleScene, floor: integer, action: string) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  console.log("Log Shop Item", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  wv.shop = action
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
export function getWave(drpd: DRPD, floor: integer, scene: BattleScene) {
  var wv: Wave;
  var insertPos: integer;
  console.log(drpd.waves)
  if (drpd.waves[floor - 1] != undefined) {
    return drpd.waves[floor - 1]
  }
  drpd.waves[floor - 1] = {
    id: floor,
    reload: false,
    //type: floor % 10 == 0 ? "boss" : (floor % 10 == 5 ? "trainer" : "wild"),
    type: floor % 10 == 0 ? "boss" : "wild",
    double: scene.currentBattle.double,
    actions: [],
    shop: "",
    biome: getBiomeName(scene.arena.biomeType),
    pokemon: []
  }
  return drpd.waves[floor - 1]
  for (var i = 0; i < drpd.waves.length; i++) {
    if (drpd.waves[i] != undefined && drpd.waves[i] != null) {
      if (drpd.waves[i].id == floor) {
        wv = drpd.waves[i]
        console.log("Found wave for floor " + floor + " at index " + i)
        if (wv.pokemon == undefined) wv.pokemon = []
      }
    } else if (insertPos == undefined) {
      insertPos = i
    }
  }
  if (wv == undefined && insertPos != undefined) {
    console.log("Created new wave for floor " + floor + " at index " + insertPos)
    drpd.waves[insertPos] = {
      id: floor,
      reload: false,
      //type: floor % 10 == 0 ? "boss" : (floor % 10 == 5 ? "trainer" : "wild"),
      type: floor % 10 == 0 ? "boss" : "wild",
      double: scene.currentBattle.double,
      actions: [],
      shop: "",
      biome: getBiomeName(scene.arena.biomeType),
      pokemon: []
    }
    wv = drpd.waves[insertPos]
  }
  drpd.waves.sort((a, b) => {
    if (a == undefined) return 1;  // empty values move to the bottom
    if (b == undefined) return -1; // empty values move to the bottom
    return a.id - b.id
  })
  for (var i = 0; i < drpd.waves.length - 1; i++) {
    if (drpd.waves[i] != undefined && drpd.waves[i+1] != undefined) {
      if (drpd.waves[i].id == drpd.waves[i+1].id) {
        drpd.waves[i] = undefined
        drpd.waves.sort((a, b) => {
          if (a == undefined) return 1;  // empty values move to the bottom
          if (b == undefined) return -1; // empty values move to the bottom
          return a.id - b.id
        })
      }
    }
  }
  if (wv == undefined) {
    console.error("Out of wave slots??")
    scene.ui.showText("Out of wave slots!\nClearing duplicates...", null, () => {
      for (var i = 0; i < drpd.waves.length - 1; i++) {
        if (drpd.waves[i] != undefined && drpd.waves[i+1] != undefined) {
          if (drpd.waves[i].id == drpd.waves[i+1].id) {
            drpd.waves[i+1] = undefined
            drpd.waves.sort((a, b) => {
              if (a == undefined) return 1;  // empty values move to the bottom
              if (b == undefined) return -1; // empty values move to the bottom
              return a.id - b.id
            })
          }
        }
      }
      if (drpd.waves[49] != undefined) {
        scene.ui.showText("No space!\nPress F12 for info")
        console.error("There should have been 50 slots, but somehow the program ran out of space.")
        console.error("Go yell at @redstonewolf8557 to fix this")
      } else {
        for (var i = 0; i < drpd.waves.length; i++) {
          if (drpd.waves[i] != undefined && drpd.waves[i] != null) {
            if (drpd.waves[i].id == floor) {
              wv = drpd.waves[i]
              console.log("Found wave for floor " + floor + " at index " + i)
              if (wv.pokemon == undefined) wv.pokemon = []
            }
          } else if (insertPos == undefined) {
            insertPos = i
          }
        }
        if (wv == undefined && insertPos != undefined) {
          console.log("Created new wave for floor " + floor + " at index " + insertPos)
          drpd.waves[insertPos] = {
            id: floor,
            reload: false,
            //type: floor % 10 == 0 ? "boss" : (floor % 10 == 5 ? "trainer" : "wild"),
            type: floor % 10 == 0 ? "boss" : "wild",
            double: scene.currentBattle.double,
            actions: [],
            shop: "",
            biome: getBiomeName(scene.arena.biomeType),
            pokemon: []
          }
          wv = drpd.waves[insertPos]
        }
        drpd.waves.sort((a, b) => {
          if (a == undefined) return 1;  // empty values move to the bottom
          if (b == undefined) return -1; // empty values move to the bottom
          return a.id - b.id
        })
        if (wv == undefined) {
          scene.ui.showText("Failed to make space\nPress F12 for info")
        console.error("There should be space to store a new wave, but the program failed to find space anyways")
        console.error("Go yell at @redstonewolf8557 to fix this")
        }
      }
    })
  }
  return wv;
}
function checkForPokeInBiome(species: Species, pool: (Species | SpeciesTree)[]): boolean {
  //console.log(species, pool)
  for (var i = 0; i < pool.length; i++) {
    if (typeof pool[i] === "number") {
      //console.log(pool[i] + " == " + species + "? " + (pool[i] == species))
      if (pool[i] == species) return true;
    } else {
      var k = Object.keys(pool[i])
      //console.log(pool[i], k)
      for (var j = 0; j < k.length; j++) {
        //console.log(pool[i][k[j]] + " == " + species + "? " + (pool[i][k[j]] == species))
        if (pool[i][k[j]] == species) return true;
      }
    }
  }
  return false;
}
export function logPokemon(scene: BattleScene, floor: integer = undefined, slot: integer, pokemon: EnemyPokemon, encounterRarity?: string) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  /*
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
  */
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  console.log("Log Enemy Pokemon", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  var pk: PokeData = exportPokemon(pokemon, encounterRarity)
  if (wv.pokemon[slot] != undefined) {
    if (encounterRarity == "" || encounterRarity == undefined) {
      if (wv.pokemon[slot].rarity != undefined && wv.pokemon[slot].rarity != "???") pk.rarity = wv.pokemon[slot].rarity
      else {
        var biome = scene.arena.biomeType
        console.log(scene.arena.pokemonPool)
        var tiernames = [
          "Common",
          "Uncommon",
          "Rare",
          "Super Rare",
          "Ultra Rare",
          "Common",
          "Rare",
          "Super Rare",
          "Ultra Rare",
        ]
        for (var i = 0; i < tiernames.length; i++) {
          if (checkForPokeInBiome(wv.pokemon[slot].id, scene.arena.pokemonPool[i]) == true) {
            console.log("Autofilled rarity for " + pk.name + " as " + tiernames[i])
            pk.rarity = tiernames[i]
          }
        }
      }
    }
    if (JSON.stringify(wv.pokemon[slot]) != JSON.stringify(pk)) {
      console.log("A different Pokemon already exists in this slot! Flagging as a reload")
      wv.reload = true
    }
  }
  if (pk.rarity == undefined) {
    var biome = scene.arena.biomeType
    console.log(scene.arena.pokemonPool)
    var tiernames = [
      "Common",
      "Uncommon",
      "Rare",
      "Super Rare",
      "Ultra Rare",
      "Common",
      "Rare",
      "Super Rare",
      "Ultra Rare",
    ]
    for (var i = 0; i < tiernames.length; i++) {
      if (wv.pokemon[slot] != undefined)
      if (checkForPokeInBiome(wv.pokemon[slot].id, scene.arena.pokemonPool[i]) == true) {
        console.log("Autofilled rarity for " + pk.name + " as " + tiernames[i])
        pk.rarity = tiernames[i]
      }
    }
  }
  if (pk.rarity == undefined) pk.rarity = "[Unknown]"
  wv.pokemon[slot] = pk;
  while (wv.actions.length > 0)
    wv.actions.pop()
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
export function logTrainer(scene: BattleScene, floor: integer = undefined) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  console.log("Log Trainer", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  var t: TrainerData = exportTrainer(scene.currentBattle.trainer)
  wv.trainer = t
  wv.type = "trainer"
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
export function logPlayerTeam(scene: BattleScene) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  //var wv: Wave = getWave(drpd, 1, scene)
  console.log("Log Player Starters", drpd)
  var P = scene.getParty()
  for (var i = 0; i < P.length; i++) {
    drpd.starters[i] = exportPokemon(P[i])
  }
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
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
export function printDRPD(inData: string, indent: string, drpd: DRPD): string {
  inData += indent + "{"
  inData += "\n" + indent + "  \"version\": \"" + drpd.version + "\""
  inData += ",\n" + indent + "  \"title\": \"" + drpd.title + "\""
  inData += ",\n" + indent + "  \"authors\": [\"" + drpd.authors.join("\", \"") + "\"]"
  inData += ",\n" + indent + "  \"date\": \"" + drpd.date + "\""
  inData += ",\n" + indent + "  \"waves\": [\n"
  var isFirst = true
  for (var i = 0; i < drpd.waves.length; i++) {
    if (drpd.waves[i] != undefined) {
      if (isFirst) {
        isFirst = false;
      } else {
        inData += ",\n"
      }
      inData = printWave(inData, indent + "    ", drpd.waves[i])
    }
  }
  inData += "\n" + indent + "  ]\n" + indent + "}"
  return inData;
}
function printWave(inData: string, indent: string, wave: Wave): string {
  inData += indent + "{"
  inData += "\n" + indent + "  \"id\": " + wave.id + ""
  inData += ",\n" + indent + "  \"reload\": " + wave.reload + ""
  inData += ",\n" + indent + "  \"type\": \"" + wave.type + "\""
  inData += ",\n" + indent + "  \"double\": " + wave.double + ""
  var isFirst = true
  if (wave.actions.length > 0) {
    inData += ",\n" + indent + "  \"actions\": ["
    for (var i = 0; i < wave.actions.length; i++) {
      if (wave.actions[i] != undefined) {
        if (isFirst) {
          isFirst = false;
        } else {
          inData += ","
        }
        inData += "\n    " + indent + "\"" + wave.actions[i] + "\""
      }
    }
    if (!isFirst) inData += "\n"
    inData += indent + "  ]"
  } else {
    inData += ",\n" + indent + "  \"actions\": []"
  }
  inData += ",\n  " + indent + "\"shop\": \"" + wave.shop + "\""
  inData += ",\n  " + indent + "\"biome\": \"" + wave.biome + "\""
  if (wave.trainer) {
    inData += ",\n  " + indent + "\"trainer\": "
    inData = printTrainer(inData, indent + "  ", wave.trainer)
  }
  if (wave.pokemon.length > 0) {
    inData += ",\n  " + indent + "\"pokemon\": [\n"
    isFirst = true
    for (var i = 0; i < wave.pokemon.length; i++) {
      if (wave.pokemon[i] != undefined) {
        if (isFirst) {
          isFirst = false;
        } else {
          inData += ",\n"
        }
        inData = printPoke(inData, indent + "    ", wave.pokemon[i])
      }
    }
    inData += "\n" + indent + "  ]"
  }
  inData += "\n" + indent + "}"
  return inData;
}
function printPoke(inData: string, indent: string, pokemon: PokeData) {
  inData += indent + "{"
  inData += "\n" + indent + "  \"id\": " + pokemon.id
  inData += ",\n" + indent + "  \"name\": \"" + pokemon.name + "\""
  inData += ",\n" + indent + "  \"ability\": \"" + pokemon.ability + "\""
  inData += ",\n" + indent + "  \"isHiddenAbility\": " + pokemon.isHiddenAbility
  inData += ",\n" + indent + "  \"passiveAbility\": \"" + pokemon.passiveAbility + "\""
  inData += ",\n" + indent + "  \"nature\": \n"
  inData = printNature(inData, indent + "    ", pokemon.nature)
  inData += ",\n" + indent + "  \"gender\": \"" + pokemon.gender + "\""
  inData += ",\n" + indent + "  \"rarity\": \"" + pokemon.rarity + "\""
  inData += ",\n" + indent + "  \"captured\": " + pokemon.captured
  inData += ",\n" + indent + "  \"level\": " + pokemon.level
  if (pokemon.items.length > 0) {
    inData += ",\n" + indent + "  \"items\": [\n"
    var isFirst = true
    for (var i = 0; i < pokemon.items.length; i++) {
      if (pokemon.items[i] != undefined) {
        if (isFirst) {
          isFirst = false;
        } else {
          inData += ","
        }
        inData = printItem(inData, indent + "    ", pokemon.items[i])
      }
    }
    if (!isFirst) inData += "\n"
    inData += indent + "  ]"
  } else {
    inData += ",\n" + indent + "  \"items\": []"
  }
  inData += ",\n" + indent + "  \"ivs\": "
  inData = printIV(inData, indent + "  ", pokemon.ivs)
  //inData += ",\n" + indent + "  \"rarity\": " + pokemon.rarity
  inData += "\n" + indent + "}"
  return inData;
}
function printNature(inData: string, indent: string, nature: NatureData) {
  inData += indent + "{"
  inData += "\n" + indent + "  \"name\": \"" + nature.name + "\""
  inData += ",\n" + indent + "  \"increased\": \"" + nature.increased + "\""
  inData += ",\n" + indent + "  \"decreased\": \"" + nature.decreased + "\""
  inData += "\n" + indent + "}"
  return inData;
}
function printIV(inData: string, indent: string, iv: IVData) {
  inData += "{"
  inData += "\n" + indent + "  \"hp\": " + iv.hp
  inData += ",\n" + indent + "  \"atk\": " + iv.atk
  inData += ",\n" + indent + "  \"def\": " + iv.def
  inData += ",\n" + indent + "  \"spatk\": " + iv.spatk
  inData += ",\n" + indent + "  \"spdef\": " + iv.spdef
  inData += ",\n" + indent + "  \"speed\": " + iv.speed
  inData += "\n" + indent + "}"
  return inData;
}
function printTrainer(inData: string, indent: string, trainer: TrainerData) {
  inData += "{"
  inData += "\n" + indent + "  \"id\": \"" + trainer.id + "\""
  inData += ",\n" + indent + "  \"name\": \"" + trainer.name + "\""
  inData += ",\n" + indent + "  \"type\": \"" + trainer.type + "\""
  inData += "\n" + indent + "}"
  return inData;
}
function printItem(inData: string, indent: string, item: ItemData) {
  inData += indent + "{"
  inData += "\n" + indent + "  \"id\": \"" + item.id + "\""
  inData += ",\n" + indent + "  \"name\": \"" + item.name + "\""
  inData += ",\n" + indent + "  \"quantity\": " + item.quantity
  inData += "\n" + indent + "}"
  return inData;
}