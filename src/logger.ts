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
import { LoginPhase, TitlePhase } from "./phases";
import { Item } from "pokenode-ts";
import Trainer from "./field/trainer";
import { Species } from "./enums/species";
import { junit } from "node:test/reporters";
import { i } from "vitest/dist/reporters-xEmem8D4.js";
import { GameMode, GameModes } from "./game-mode";

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

export const autoCheckpoints: integer[] = [
  1,
  11,
  21,
  31,
  41,
  50
]

/**
 * Uses the save's RNG seed to create a log ID. Used to assign each save its own log.
 * @param scene The BattleScene.
 * @returns The ID of the current save's log.
 */
export function getLogID(scene: BattleScene) {
  return "drpd_log:" + scene.seed
}
/**
 * Gets a log's item list storage, for detecting reloads via a change in the loot rewards.
 * 
 * Not used yet.
 * @param scene The BattleScene.
 * @returns The ID of the current save's log.
 */
export function getItemsID(scene: BattleScene) {
  return "drpd_items:" + scene.seed
}
/**
 * Resets the `logs` array, and creates a list of all game logs in LocalStorage.
 */
export function getLogs() {
  while(logs.length > 0)
    logs.pop()
  for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).substring(0, 9) == "drpd_log:") {
      logs.push(["drpd.json", localStorage.key(i), localStorage.key(i).substring(9), "drpd_items:" + localStorage.key(i).substring(9), "", ""])
    }
  }
}
/**
 * Returns a string for the name of the current game mode.
 * @param scene The BattleScene. Used to get the game mode.
 * @returns The name of the game mode, for use in naming a game log.
 */
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

/**
 * Formats a Pokemon in the player's party.
 * @param scene The BattleScene, for getting the player's party.
 * @param index The slot index.
 * @returns [INDEX] NAME (example: `[1] Walking Wake` is a Walking Wake in the first party slot)
 */
export function playerPokeName(scene: BattleScene, index: integer | Pokemon | PlayerPokemon) {
  if (typeof index == "number") {
    return "[" + (index  + 1) + "] " + scene.getParty()[index].name
  }
  return "[" + (scene.getParty().indexOf(index as PlayerPokemon) + 1) + "] " + index.name
}
/**
 * Formats a Pokemon in the opposing party.
 * @param scene The BattleScene, for getting the enemy's party.
 * @param index The slot index.
 * @returns [INDEX] NAME (example: `[2] Zigzagoon` is a Zigzagoon in the right slot (for a double battle) or in the second party slot (for a single battle against a Trainer))
 */
export function enemyPokeName(scene: BattleScene, index: integer | Pokemon | EnemyPokemon) {
  if (typeof index == "number") {
    return "[" + (index  + 1) + "] " + scene.getEnemyParty()[index].name
  }
  return "[" + (scene.getEnemyParty().indexOf(index as EnemyPokemon) + 1) + "] " + index.name
}
// LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "")

export const rarities = []
export const rarityslot = [0, ""]

export const isPreSwitch: Utils.BooleanHolder = new Utils.BooleanHolder(false);
export const isFaintSwitch: Utils.BooleanHolder = new Utils.BooleanHolder(false);

export var StoredLog: DRPD = undefined;

export const DRPD_Version = "1.0.0a"
export const acceptedVersions = [
  "1.0.0",
  "1.0.0a",
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

/**
 * Creates a new document in the DRPD format
 * @param name (Optional) The name for the file. Defaults to "Untitled Run".
 * @param authorName (Optional) The author(s) of the file. Defaults to "Write your name here".
 * @returns The fresh DRPD document.
 */
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
/**
 * Imports a string as a DRPD.
 * @param drpd The JSON string to import.
 * @returns The imported document.
 */
export function importDocument(drpd: string): DRPD {
  return JSON.parse(drpd) as DRPD;
}
/**
 * Exports a Pokemon's data as `PokeData`.
 * @param pokemon The Pokemon to store.
 * @param encounterRarity The rarity tier of the Pokemon for this biome.
 * @returns The Pokemon data.
 */
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
    items: pokemon.getHeldItems().map((item, idx) => exportItem(item)),
    ivs: exportIVs(pokemon.ivs)
  }
}
/**
 * Exports a Pokemon's nature as `NatureData`.
 * @param nature The nature to store.
 * @returns The nature data.
 */
export function exportNature(nature: Nature): NatureData {
  return {
    name: getNatureName(nature),
    increased: getNatureIncrease(nature),
    decreased: getNatureDecrease(nature),
  }
}
/**
 * Exports a Held Item as `ItemData`.
 * @param item The item to store.
 * @returns The item data.
 */
export function exportItem(item: PokemonHeldItemModifier): ItemData {
  return {
    id: item.type.identifier,
    name: item.type.name,
    quantity: item.getStackCount()
  }
}
/**
 * Exports a Pokemon's IVs as `IVData`.
 * @param ivs The IV array to store.
 * @returns The IV data.
 */
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
/**
 * Exports the current battle as a `Wave`.
 * @param scene The BattleScene. Used to retrieve information about the current wave.
 * @returns The wave data.
 */
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
  if (ret.double == undefined) ret.double = false;
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
/**
 * Exports the opposing trainer as `TrainerData`.
 * @param trainer The Trainer to store.
 * @returns The Trainer data.
 */
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

export function getDRPD(scene: BattleScene): DRPD {
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  drpd = updateLog(drpd);
  //scene.arenaFlyout.updateFieldText()
  return drpd;
}

/**
 * Generates a UI option to save a log to your device.
 * @param i The slot number. Corresponds to an index in `logs`.
 * @param saves Your session data. Used to label logs if they match one of your save slots.
 * @returns A UI option.
 */
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
      op.label = "[Slot " + (saves[j].slot + 1) + "]" + op.label.substring(6)
    }
  }
  if (logs[i][4] != "") {
    op.label = " " + op.label
    op.item = logs[i][4]
  }
  return op;
}
/**
 * Generates a UI option to save a log to your device.
 * @param i The slot number. Corresponds to an index in `logs`.
 * @param saves Your session data. Used to label logs if they match one of your save slots.
 * @returns A UI option.
 */
export function generateEditOption(scene: BattleScene, i: integer, saves: any, phase: TitlePhase): OptionSelectItem {
  var filename: string = (JSON.parse(localStorage.getItem(logs[i][1])) as DRPD).title
  var op: OptionSelectItem = {
    label: `Export ${filename} (${getSize(printDRPD("", "", JSON.parse(localStorage.getItem(logs[i][1])) as DRPD))})`,
    handler: () => {
      rarityslot[1] = logs[i][1]
      //scene.phaseQueue[0].end()
      scene.ui.setMode(Mode.NAME_LOG, {
        autofillfields: [
          (JSON.parse(localStorage.getItem(logs[i][1])) as DRPD).title,
          (JSON.parse(localStorage.getItem(logs[i][1])) as DRPD).authors.join(", ")
        ],
        buttonActions: [
          () => {
            scene.ui.playSelect();
            phase.callEnd()
          },
          () => {
            scene.ui.playSelect();
            downloadLogByID(i)
            phase.callEnd()
          },
          () => {
            scene.ui.playSelect();
            downloadLogByIDToSheet(i)
            phase.callEnd()
          },,
          () => {
            scene.ui.playSelect();
            localStorage.removeItem(logs[i][1])
            phase.callEnd()
          }
        ]
      });
      return false;
    }
  }
  for (var j = 0; j < saves.length; j++) {
    console.log(saves[j].seed, logs[i][2], saves[j].seed == logs[i][2])
    if (saves[j].seed == logs[i][2]) {
      op.label = "[Slot " + (saves[j].slot + 1) + "]" + op.label.substring(6)
    }
  }
  if (logs[i][4] != "") {
    op.label = " " + op.label
    op.item = logs[i][4]
  }
  return op;
}
/**
 * Generates an option to create a new log.
 * 
 * Not used.
 * @param i The slot number. Corresponds to an index in `logs`.
 * @param scene The current scene. Not used.
 * @param o The current game phase. Used to return to the previous menu. Not necessary anymore lol
 * @returns A UI option.
 * 
 * wow this function sucks
 * @deprecated
 */
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
export function setFileInfo(title: string, authors: string[]) {
  var fileID = rarityslot[1] as string
  var drpd = JSON.parse(localStorage.getItem(fileID)) as DRPD;
  drpd.title = title;
  for (var i = 0; i < authors.length; i++) {
    while (authors[i][0] == " ") {
      authors[i] = authors[i].substring(1)
    }
    while (authors[i][authors[i].length - 1] == " ") {
      authors[i] = authors[i].substring(0, authors[i].length - 1)
    }
  }
  for (var i = 0; i < authors.length; i++) {
    if (authors[i] == "") {
      authors.splice(i, 1)
      i--;
    }
  }
  drpd.authors = authors;
  localStorage.setItem(fileID, JSON.stringify(drpd))
}
/**
 * Saves a log to your device.
 * @param keyword The identifier key for the log you want to save.
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
/**
 * Saves a log to your device.
 * @param i The index of the log you want to save.
 */
export const SheetsMode = new Utils.BooleanHolder(false)
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
export function downloadLogByIDToSheet(i: integer) {
  console.log(i)
  var d = JSON.parse(localStorage.getItem(logs[i][1]))
  SheetsMode.value = true;
  const blob = new Blob([ printDRPD("", "", d as DRPD) ], {type: "text/json"});
  SheetsMode.value = false;
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  var date: string = (d as DRPD).date
  var filename: string = date[0] + date[1] + "_" + date[3] + date[4] + "_" + date[6] + date[7] + date[8] + date[9] + "_route.json"
  link.download = `${filename}`;
  link.click();
  link.remove();
}
/**
 * Calls `logPokemon` once for each opponent or, if it's a trainer battle, logs the trainer's data.
 * @param scene The BattleScene. Used to get the enemy team and whether it's a trainer battle or not.
 * @param floor The wave index to write to. Defaults to the current wave.
 */
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
/**
 * Logs the actions that the player took.
 * 
 * This includes attacks you perform, items you transfer during the shop, Poke Balls you throw, running from battl, (or attempting to), and switching (including pre-switches).
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to.
 * @param action The text you want to add to the actions list.
 */
export function logActions(scene: BattleScene, floor: integer, action: string) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
  console.log("Log Action", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  wv.actions.push(action)
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs what the player took from the rewards pool and, if applicable, who they used it on.
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to.
 * @param action The shop action. Left blank if there was no shop this floor or if you ran away. Logged as "Skip taking items" if you didn't take anything for some reason.
 */
export function logShop(scene: BattleScene, floor: integer, action: string) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
  console.log("Log Shop Item", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  wv.shop = action
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Retrieves a wave from the DRPD. If the wave doesn't exist, it creates a new one.
 * @param drpd The document to read from.
 * @param floor The wave index to retrieve.
 * @param scene The BattleScene, used for creating a new wave
 * @returns The requested `Wave`.
 */
export function getWave(drpd: DRPD, floor: integer, scene: BattleScene): Wave {
  var wv: Wave;
  var insertPos: integer;
  console.log(drpd.waves)
  for (var i = 0; i < drpd.waves.length; i++) {
    if (drpd.waves[i] != undefined && drpd.waves[i] != null) {
      if (drpd.waves[i].id == floor) {
        wv = drpd.waves[i]
        console.log("Found wave for floor " + floor + " at index " + i)
        if (wv.pokemon == undefined) wv.pokemon = []
        return wv;
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
      if (drpd.waves[drpd.waves.length - 1] != undefined) {
        if (scene.gameMode.modeId == GameModes.DAILY) {
          scene.ui.showText("No space!\nPress F12 for info")
          console.error("There should have been 50 slots, but somehow the program ran out of space.")
          console.error("Go yell at @redstonewolf8557 to fix this")
        } else {
          drpd.waves.push(null)
          console.log("Created new wave for floor " + floor + " at newly inserted index " + insertPos)
          drpd.waves[drpd.waves.length - 1] = {
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
          wv = drpd.waves[drpd.waves.length - 1]
        }
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
          return undefined;
        }
      }
    })
  }
  if (wv == undefined) {
    scene.ui.showText("Failed to retrieve wave\nPress F12 for info")
    console.error("Failed to retrieve wave??")
    console.error("this mod i stg")
    console.error("Go yell at @redstonewolf8557 to fix this")
    return undefined;
  }
  return wv;
}
/**
 * Compares a Species to a biome's tier pool.
 * @param species The species to search for.
 * @param pool The SpeciesPool tier to compare.
 * @returns whether or not `species` was found in the `pool`.
 */
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
/**
 * Logs a wild Pokemon to a wave's data.
 * @param scene The BattleScene. Used to retrieve the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param slot The slot to write to. In a single battle, 0 = the Pokemon that is out first. In a double battle, 0 = Left and 1 = Right.
 * @param pokemon The `EnemyPokemon` to store the data of. (Automatically converted via `exportPokemon`)
 * @param encounterRarity The rarity tier of this Pokemon. If not specified, it calculates this automatically by searching the current biome's species pool.
 */
export function logPokemon(scene: BattleScene, floor: integer = undefined, slot: integer, pokemon: EnemyPokemon, encounterRarity?: string) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
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
          "Common Boss",
          "Rare Boss",
          "Super Rare Boss",
          "Ultra Rare Boss",
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
      "Common Boss",
      "Rare Boss",
      "Super Rare Boss",
      "Ultra Rare Boss",
    ]
    for (var i = 0; i < tiernames.length; i++) {
      if (wv.pokemon[slot] != undefined)
      if (checkForPokeInBiome(wv.pokemon[slot].id, scene.arena.pokemonPool[i]) == true) {
        console.log("Autofilled rarity for " + pk.name + " as " + tiernames[i])
        pk.rarity = tiernames[i]
      }
    }
  }
  if (pk.rarity == undefined)
    pk.rarity = "[Unknown]"
  wv.pokemon[slot] = pk;
  while (wv.actions.length > 0)
    wv.actions.pop()
  wv.actions = []
  wv.shop = ""
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Clears the action list for a wave.
 * @param scene The BattleScene. Used to get the log ID and trainer data.
 * @param floor The wave index to write to. Defaults to the current floor.
 */
export function resetWaveActions(scene: BattleScene, floor: integer = undefined) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
  console.log("Clear Actions", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  wv.actions = []
  console.log(drpd, wv)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs the current floor's Trainer.
 * @param scene The BattleScene. Used to get the log ID and trainer data.
 * @param floor The wave index to write to. Defaults to the current floor.
 */
export function logTrainer(scene: BattleScene, floor: integer = undefined) {
  if (floor == undefined) floor = scene.currentBattle.waveIndex
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))) as DRPD;
  drpd = updateLog(drpd);
  console.log("Log Trainer", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  var t: TrainerData = exportTrainer(scene.currentBattle.trainer)
  wv.trainer = t
  wv.type = "trainer"
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs the player's current party.
 * 
 * Called on Floor 1 to store the starters list.
 * @param scene  The BattleScene. Used to get the log ID and the player's party.
 */
export function logPlayerTeam(scene: BattleScene) {
  if (localStorage.getItem(getLogID(scene)) == null) localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
  console.log("Log Player Starters", drpd)
  var P = scene.getParty()
  for (var i = 0; i < P.length; i++) {
    drpd.starters[i] = exportPokemon(P[i])
  }
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * A sort function, used to sort csv columns.
 * 
 * No longer used as we are using .json format instead.
 * @deprecated
 */
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
/**
 * Writes or replaces a csv row.
 * 
 * No longer used as we are using .json format instead.
 * @param keyword The keyword/ID of the log to write to.
 * @param newLine The data to write.
 * @param floor The floor to write to. Used for sorting.
 * @param slot  The slot to write to. Used for sorting.
 * @deprecated
 */
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
export function flagReset(scene: BattleScene, floor: integer = undefined) {
  if (floor == undefined)
    floor = scene.currentBattle.waveIndex;
  if (localStorage.getItem(getLogID(scene)) == null)
    localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
  var wv = getWave(drpd, floor, scene)
  wv.reload = true;
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
export function flagResetIfExists(scene: BattleScene, floor: integer = undefined) {
  if (floor == undefined)
    floor = scene.currentBattle.waveIndex;
  if (localStorage.getItem(getLogID(scene)) == null)
    localStorage.setItem(getLogID(scene), JSON.stringify(newDocument(getMode(scene) + " Run")))
  var drpd = getDRPD(scene)
  var waveExists = false
  for (var i = 0; i < drpd.waves.length; i++) {
    if (drpd.waves[i] != undefined) {
      if (drpd.waves[i].id == floor) {
        waveExists = true;
      }
    }
  }
  if (!waveExists) return;
  var wv = getWave(drpd, floor, scene)
  wv.reload = true;
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Prints a DRPD as a string, for saving it to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param drpd The `DRPD` to export.
 * @returns `inData`, with all the DRPD's data appended to it.
 * 
 * @see printWave
 */
export function printDRPD(inData: string, indent: string, drpd: DRPD): string {
  inData += indent + "{"
  inData += "\n" + indent + "  \"version\": \"" + drpd.version + "\""
  inData += ",\n" + indent + "  \"title\": \"" + drpd.title + "\""
  inData += ",\n" + indent + "  \"authors\": [\"" + drpd.authors.join("\", \"") + "\"]"
  inData += ",\n" + indent + "  \"date\": \"" + drpd.date + "\""
  if (drpd.waves) {
    inData += ",\n" + indent + "  \"waves\": [\n"
    var isFirst = true
    for (var i = 0; i < drpd.waves.length; i++) {
      if (drpd.waves[i] != undefined && drpd.waves[i] != null) {
        if (isFirst) {
          isFirst = false;
        } else {
          inData += ",\n"
        }
        inData = printWave(inData, indent + "    ", drpd.waves[i])
      }
    }
  } else {
    inData += ",\n" + indent + "  \"waves\": []"
  }
  inData += "\n" + indent + "  ]\n" + indent + "}"
  return inData;
}
/**
 * Prints a wave as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `Wave` to export.
 * @returns `inData`, with all the wave's data appended to it.
 * 
 * @see printDRPD
 */
function printWave(inData: string, indent: string, wave: Wave): string {
  inData += indent + "{"
  inData += "\n" + indent + "  \"id\": " + wave.id + ""
  inData += ",\n" + indent + "  \"reload\": " + wave.reload + ""
  inData += ",\n" + indent + "  \"type\": \"" + wave.type + "\""
  inData += ",\n" + indent + "  \"double\": " + wave.double + ""
  var isFirst = true
  if (wave.actions.length > 0) {
    if (SheetsMode.value) {
      inData += ",\n" + indent + "  \"actions\": [" + wave.actions.join("CHAR(10)") + "]"
    } else {
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
    }
  } else {
    inData += ",\n" + indent + "  \"actions\": []"
  }
  inData += ",\n  " + indent + "\"shop\": \"" + wave.shop + "\""
  inData += ",\n  " + indent + "\"biome\": \"" + wave.biome + "\""
  if (wave.trainer) {
    inData += ",\n  " + indent + "\"trainer\": "
    inData = printTrainer(inData, indent + "  ", wave.trainer)
  }
  if (wave.pokemon)
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
      if (SheetsMode.value && wave.pokemon.length == 1) {
        inData += "," + indent + "    \n{" + indent + "    \n}"
      }
      inData += "\n" + indent + "  ]"
    }
  inData += "\n" + indent + "}"
  return inData;
}
/**
 * Prints a Pokemon as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `PokeData` to export.
 * @returns `inData`, with all the Pokemon's data appended to it.
 * 
 * @see printDRPD
 */
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
  if (!SheetsMode.value)
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
/**
 * Prints a Nature as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `NatureData` to export.
 * @returns `inData`, with all the nature data appended to it.
 * 
 * @see printDRPD
 */
function printNature(inData: string, indent: string, nature: NatureData) {
  inData += indent + "{"
  inData += "\n" + indent + "  \"name\": \"" + nature.name + "\""
  inData += ",\n" + indent + "  \"increased\": \"" + nature.increased + "\""
  inData += ",\n" + indent + "  \"decreased\": \"" + nature.decreased + "\""
  inData += "\n" + indent + "}"
  return inData;
}
/**
 * Prints a Pokemon's IV data as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `IVData` to export.
 * @returns `inData`, with the IV data appended to it.
 * 
 * @see printDRPD
 */
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
/**
 * Prints a Trainer as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `TrainerData` to export.
 * @returns `inData`, with all the Trainer's data appended to it.
 * 
 * @see printDRPD
 */
function printTrainer(inData: string, indent: string, trainer: TrainerData) {
  inData += "{"
  inData += "\n" + indent + "  \"id\": \"" + trainer.id + "\""
  inData += ",\n" + indent + "  \"name\": \"" + trainer.name + "\""
  inData += ",\n" + indent + "  \"type\": \"" + trainer.type + "\""
  inData += "\n" + indent + "}"
  return inData;
}
/**
 * Prints an item as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `ItemData` to export.
 * @returns `inData`, with all the Item's data appended to it.
 * 
 * @see printDRPD
 */
function printItem(inData: string, indent: string, item: ItemData) {
  inData += indent + "{"
  inData += "\n" + indent + "  \"id\": \"" + item.id + "\""
  inData += ",\n" + indent + "  \"name\": \"" + item.name + "\""
  inData += ",\n" + indent + "  \"quantity\": " + item.quantity
  inData += "\n" + indent + "}"
  return inData;
}


function updateLog(drpd: DRPD): DRPD {
  if (drpd.version == "1.0.0") {
    drpd.version = "1.0.0a"
    console.log("Updated to 1.0.0a - changed item IDs to strings")
    for (var i = 0; i < drpd.waves.length; i++) {
      if (drpd.waves[i] != undefined) {
        if (drpd.waves[i].pokemon != undefined) {
          for (var j = 0; j < drpd.waves[i].pokemon.length; j++) {
            for (var k = 0; k < drpd.waves[i].pokemon[j].items.length; k++) {
              drpd.waves[i].pokemon[j].items[k].id = drpd.waves[i].pokemon[j].items[k].id.toString()
            }
          }
        }
      }
    }
    for (var j = 0; j < drpd.starters.length; j++) {
      for (var k = 0; k < drpd.starters[j].items.length; k++) {
        drpd.starters[j].items[k].id = drpd.starters[j].items[k].id.toString()
      }
    }
  } // 1.0.0 → 1.0.0a
  return drpd;
}