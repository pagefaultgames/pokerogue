import i18next from "i18next";
import * as Utils from "./utils";
import Pokemon from "./field/pokemon";
import { PlayerPokemon, EnemyPokemon } from "./field/pokemon";
import { Nature, getNatureName } from "./data/nature";
import BattleScene from "./battle-scene";
import { OptionSelectItem } from "./ui/abstact-option-select-ui-handler";
import { TrainerType } from "#enums/trainer-type";

/**
 * All logs.
 * 
 * Format: [filename, localStorage key, name, header, item sprite, header suffix]
 */
export const logs: string[][] = [
  ["instructions.txt", "path_log", "Steps", "Run Steps", "blunder_policy", ""],
  ["encounters.csv", "enc_log", "Encounters", "Encounter Data", "ub", ",,,,,,,,,,,,,,,,"],
  ["log.txt", "debug_log", "Debug", "Debug Log", "wide_lens", ""],
]
export var logKeys: string[] = [
  "i", // Instructions/steps
  "e", // Encounters
  "d", // Debug
];

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
      setRow("e", ",,,,,,,,,,,,,,,,", floor, 1)
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
    console.log((data[idx].split(",")[0] as any) * 1, floor, (data[idx].split(",")[1] as any) * 1, slot)
    if (idx < data.length && (data[idx].split(",")[0] as any) * 1 == floor && (data[idx].split(",")[1] as any) * 1 == slot) {
      data[idx] = newLine
      console.log("Overwrote data at " + idx)
      for (var i = 0; i < Math.max(0, idx - 2) && i < 2; i++) {
        console.log(i + " " + data[i])
      }
      if (Math.min(0, idx - 2) > 3) {
        console.log("...")
      }
      for (var i = Math.max(0, idx - 2); i <= idx + 2 && i < data.length; i++) {
        console.log(i + (i == idx ? " >> " : " ") + data[i])
      }
      localStorage.setItem(logs[logKeys.indexOf(keyword)][1], data.join("\n"));
      return;
    }
    idx++
  }
  console.log("Inserted data at " + idx)
  for (var i = 0; i < Math.max(0, idx - 2) && i < 2; i++) {
    console.log(i + " " + data[i])
  }
  if (Math.min(0, idx - 2) > 3) {
    console.log("...")
  }
  for (var i = Math.max(0, idx - 2); i < idx; i++) {
    console.log(i + " " + data[i])
  }
  console.log(i + " >> " + newLine)
  for (var i = idx; i <= idx + 2 && i < data.length; i++) {
    console.log(i + " " + data[i])
  }
  localStorage.setItem(logs[logKeys.indexOf(keyword)][1], data.slice(0, idx).join("\n") + "\n" + newLine + (data.slice(idx).length == 0 ? "" : "\n") + data.slice(idx).join("\n"));
}