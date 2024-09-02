//#region 00 Imports
import i18next from "i18next";
import * as Utils from "./utils";
import Pokemon from "./field/pokemon";
import { PlayerPokemon, EnemyPokemon } from "./field/pokemon";
import { Nature, getNatureDecrease, getNatureIncrease, getNatureName } from "./data/nature";
import BattleScene from "./battle-scene";
import { OptionSelectItem } from "./ui/abstact-option-select-ui-handler";
import { BypassSpeedChanceModifier, EnemyAttackStatusEffectChanceModifier, ExtraModifierModifier, PokemonHeldItemModifier } from "./modifier/modifier";
import { getBiomeName, PokemonPools, SpeciesTree } from "./data/biomes";
import { Mode } from "./ui/ui";
import { TitlePhase } from "./phases/title-phase";
import Trainer from "./field/trainer";
import { Species } from "./enums/species";
import { GameMode, GameModes } from "./game-mode";
import PersistentModifierData from "./system/modifier-data";
import PokemonSpecies from "./data/pokemon-species";
import { getStatusEffectCatchRateMultiplier, StatusEffect } from "./data/status-effect";
import { decrypt, SessionSaveData } from "./system/game-data";
import { loggedInUser } from "./account";
import PokemonData from "./system/pokemon-data";
import TrainerData from "./system/trainer-data";
import ArenaData from "./system/arena-data";
import ChallengeData from "./system/challenge-data";
import { Challenges } from "./enums/challenges";
import { getPlayerModifierTypeOptions, ModifierPoolType, ModifierTypeOption, regenerateModifierPoolThresholds } from "./modifier/modifier-type";

/*
SECTIONS
00 Imports         import statements, as well as this list.
01 Variables       Contains variables, constants, value holders, and the like.
02 Downloading     Functions for exporting DRPD data to .json files.
03 Log Handler     Catalogs and manages the log array.
04 Utilities       General functions.
05 DRPD            Stores data about a run.
06 Wave            Stores data about a Wave.
07 Pokémon         Stores data about a Pokémon.
08 Nature          Stores data about a Pokémon's Nature.
09 IVs             Stores data about a Pokémon's Individual Values (IVs).
10 Trainer         Stores data about the opposing Trainer, if any.
11 Item            Stores data about held items.
12 Ingame Menu     Functions for the "Manage Logs" menu ingame.
13 Logging Events  Functions for adding data to the logger.
*/

//#endregion





// #region 01 Variables

// constants
/** The number of enemy actions to log. */
export const EnemyEventLogCount = 3
/** The current DRPD version. */
export const DRPD_Version = "1.1.0b"
/** (Unused / reference only) All the log versions that this mod can keep updated.
 * @see updateLog
*/
export const acceptedVersions = [
  "1.0.0",
  "1.0.0a",
  "1.1.0",
  "1.1.0a",
  "1.1.0b",
]

// Value holders
/** Holds the encounter rarities for the Pokemon in this wave. */
export const rarities = []
/** Used to store rarity tier between files when calculating and storing a Pokemon's encounter rarity.
 * 
 * The second index is (very lazily) used to store a log's name/seed for `setFileInfo`.
 * @see setFileInfo
 */
export const rarityslot = [0, ""]
/** Stores a list of the user's battle actions in a turn.
 * 
 * Its contents are printed to the current wave's actions list, separated by pipes `|`, when the turn begins playing out. */
export const Actions: string[] = []
/** Used for enemy attack prediction. Stored here so that it's universally available. */
export const enemyPlan: string[] = []

// Booleans
export const isPreSwitch: Utils.BooleanHolder = new Utils.BooleanHolder(false);
export const isFaintSwitch: Utils.BooleanHolder = new Utils.BooleanHolder(false);
export const SheetsMode = new Utils.BooleanHolder(false)

// #endregion





//#region 02 Downloading
/**
 * Saves a log to your device.
 * @param i The index of the log you want to save.
 */
export function downloadLogByID(i: integer) {
  console.log(i)
  var d = JSON.parse(localStorage.getItem(logs[i][1])!)
  const blob = new Blob([ printDRPD("", "", d as DRPD) ], {type: "text/json"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  var date: string = (d as DRPD).date
  var filename: string = date[5] + date[6] + "_" + date[8] + date[9] + "_" + date[0] + date[1] + date[2] + date[3] + "_" + (d as DRPD).label + ".json"
  link.download = `${filename}`;
  link.click();
  link.remove();
}
/**
 * Saves a log to your device in an alternate format.
 * @param i The index of the log you want to save.
 */
export function downloadLogByIDToSheet(i: integer) {
  console.log(i)
  var d = JSON.parse(localStorage.getItem(logs[i][1])!)
  SheetsMode.value = true;
  const blob = new Blob([ printDRPD("", "", d as DRPD) ], {type: "text/json"});
  SheetsMode.value = false;
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  var date: string = (d as DRPD).date
  var filename: string = date[5] + date[6] + "_" + date[8] + date[9] + "_" + date[0] + date[1] + date[2] + date[3] + "_" + (d as DRPD).label + "_sheetexport" + ".json"
  link.download = `${filename}`;
  link.click();
  link.remove();
}
//#endregion





// #region 03 Log Handler


// These are general utilities for keeping track of the user's logs.
// For the functions that log the player's actions, see "13. Logging Events"


/**
 * Stores logs.
 * Generate a new list with `getLogs()`.
 * 
 * @see getLogs
 */
export const logs: string[][] = [
  ["drpd.json", "drpd", "DRPD", "", "wide_lens", ""],
]
/** @deprecated */
export const logKeys: string[] = [
  "i", // Instructions/steps
  "e", // Encounters
  "d", // Debug
];

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
 * 
 * @see logs
 */
export function getLogs() {
  while(logs.length > 0)
    logs.pop()
  for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)!.substring(0, 9) == "drpd_log:") {
      logs.push(["drpd.json", localStorage.key(i)!, localStorage.key(i)!.substring(9), "", "", ""])
      for (var j = 0; j < 5; j++) {
        var D = parseSlotData(j)
        if (D != undefined)
          if (logs[logs.length - 1][2] == D.seed) {
            logs[logs.length - 1][3] = j.toString()
          }
      }
    }
  }
  /*
  logs.forEach((log, idx) => {
    var dat = JSON.parse(localStorage.getItem(logs[idx][1])) as DRPD;
    logs[idx][4] = dat.version + "-" + dat.date
  })
  logs.sort((a, b) => {
    var data1 = a[4].split("-")
    var data2 = b[4].split("-")
    var S = 0
    // Sort by game version
    if (S == 0) {
      S = acceptedVersions.indexOf(data1[0]) - acceptedVersions.indexOf(b[0])
      if (acceptedVersions.indexOf(data1[0]) == -1) {
        S = -1
        if (acceptedVersions.indexOf(data2[0]) == -1) {
          S = 0
        }
      } else if (acceptedVersions.indexOf(data2[0]) == -1) {
        S = 1
      }
    }
    // Sort by year
    if (S == 0) {
      S = (Number(data1[1]) - Number(data2[1]))
    }
    // Sort by month
    if (S == 0) {
      S = (Number(data1[2]) - Number(data2[2]))
    }
    // Sort by day
    if (S == 0) {
      S = (Number(data1[3]) - Number(data2[3]))
    }
    return S;
  })
  logs.forEach((log, idx) => {
    logs[idx][4] = ""
  })
  */
}
/**
 * Returns a string for the name of the current game mode.
 * @param scene The BattleScene. Used to get the game mode.
 * @returns The name of the game mode, for use in naming a game log.
 */
export function getMode(scene: BattleScene) {
  if (scene.gameMode == undefined)
    return "???"
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

// #endregion





// #region 04 Utilities

/**
 * Pulls the current run's DRPD from LocalStorage using the run's RNG seed.
 * 
 * When loaded, the file is automatically updated and assigned a seed
 * @param scene The BattleScene. Used to get the wave number, which is what determines the name of the log we need.
 * @returns The DRPD file, or `null` if there is no file for this run.
 */
export function getDRPD(scene: BattleScene): DRPD {
  if (localStorage.getItem(getLogID(scene)) == null) {
    var D = newDocument(getMode(scene) + " Run")
    D.seed = scene.seed
    localStorage.setItem(getLogID(scene), JSON.stringify(D))
  }
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))!) as DRPD;
  drpd = updateLog(drpd);
  //scene.arenaFlyout.updateFieldText()
  return drpd;
}

export function save(scene: BattleScene, drpd: DRPD) {
  console.log(drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}

/**
 * Testing purposes only. Currently unused.
 */
export const RNGState: number[] = []

/**
 * The waves that autosaves are created at.
 */
export const autoCheckpoints: integer[] = [
  1,
  11,
  21,
  31,
  41,
  50
]

/**
 * Used to get the filesize of a string.
 */
export const byteSize = str => new Blob([str]).size
/**
 * Contains names for different file size units.
 * 
 * B: 1 byte
 * 
 * KB: 1,000 bytes
 * 
 * MB: 1,000,000 bytes
 * 
 * GB: 1,000,000,000 bytes
 * 
 * TB: 1,000,000,000,000 bytes
 */
const filesizes = ["b", "kb", "mb", "gb", "tb"]
/**
 * Returns the size of a file, in bytes, KB, MB, GB, or (hopefully not) TB.
 * @param str The data to get the size of.
 * @returns The file size. Every thousand units is moved up to the next unit and rounded to the nearest tenth (i.e. 1,330,000 bytes will return "1.3mb" - 1,330,000b --> 1,330kb --> 1.3mb)
 * @see filesizes
 */
export function getSize(str: string) {
  var d = byteSize(str)
  var unit = 0
  while (d > 1000 && unit < filesizes.length - 1) {
    d = Math.round(d/100)/10
    unit++
  }
  return d.toString() + filesizes[unit]
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
 * Formats a Pokemon in the player's party.
 * 
 * If multiple Pokemon of the same species exist in the party, it will specify which slot they are in.
 * @param scene The BattleScene, for getting the player's party.
 * @param index The slot index.
 * @returns [INDEX] NAME (example: `[1] Walking Wake` is a Walking Wake in the first party slot)
 */
export function playerPokeName(scene: BattleScene, index: integer | Pokemon | PlayerPokemon) {
  var species: string[] = []
  var dupeSpecies: string[] = []
  for (var i = 0; i < scene.getParty().length; i++) {
    if (!species.includes(scene.getParty()[i].name)) {
      species.push(scene.getParty()[i].name)
    } else if (!dupeSpecies.includes(scene.getParty()[i].name)) {
      dupeSpecies.push(scene.getParty()[i].name)
    }
  }
  if (typeof index == "number") {
    //console.log(scene.getParty()[index], species, dupeSpecies)
    if (dupeSpecies.includes(scene.getParty()[index].name))
      return scene.getParty()[index].name + " (Slot " + (index  + 1) + ")"
    return scene.getParty()[index].name
  }
  if (!index.isPlayer()) {
    return "[Not a player Pokemon??]"
  }
  //console.log(index.name, species, dupeSpecies)
  if (dupeSpecies.includes(index.name))
    return index.name + " (Slot " + (scene.getParty().indexOf(index as PlayerPokemon) + 1) + ")"
  return index.name
}
/**
 * Formats a Pokemon in the opposing party.
 * 
 * If multiple Pokemon of the same species exist in the party, it will specify which slot they are in.
 * @param scene The BattleScene, for getting the enemy's party.
 * @param index The slot index.
 * @returns [INDEX] NAME (example: `[2] Zigzagoon` is a Zigzagoon in the right slot (for a double battle) or in the second party slot (for a single battle against a Trainer))
 */
export function enemyPokeName(scene: BattleScene, index: integer | Pokemon | EnemyPokemon) {
  var species: string[] = []
  var dupeSpecies: string[] = []
  for (var i = 0; i < scene.getEnemyParty().length; i++) {
    if (!species.includes(scene.getEnemyParty()[i].name)) {
      species.push(scene.getEnemyParty()[i].name)
    } else if (!dupeSpecies.includes(scene.getEnemyParty()[i].name)) {
      dupeSpecies.push(scene.getEnemyParty()[i].name)
    }
  }
  if (typeof index == "number") {
    //console.log(scene.getEnemyParty()[index], species, dupeSpecies)
    if (dupeSpecies.includes(scene.getEnemyParty()[index].name))
      return scene.getEnemyParty()[index].name + " (Slot " + (index  + 1) + ")"
    return scene.getEnemyParty()[index].name
  }
  if (index.isPlayer()) {
    return "[Not an enemy Pokemon??]"
  }
  //console.log(index.name, species, dupeSpecies)
  if (dupeSpecies.includes(index.name))
    return index.name + " (Slot " + (scene.getEnemyParty().indexOf(index as EnemyPokemon) + 1) + ")"
  return index.name
}
// LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "")

// #endregion





// #region 05 DRPD
/**
 * The Daily Run Pathing Description (DRPD) Specification is a JSON standard for organizing the information about a daily run.
 */
export interface DRPD {
  /** The version of this run. @see DRPD_Version */
  version: string,
  /** The run seed for this day. */
  seed: string,
  /** The display name of this run. Not to be confused with `label`. Entered by the user. */
  title?: string,
  /** The webpage path and internal name of this run. Entered by the user. Not to be confused with `title`, which is only a cosmetic identifier. */
  label: string,
  /** A unique ID for this run. Currently unused, but may be used in the future. */
  uuid: string,
  /** The name(s) of the users that worked on this run. Entered by the user. */
  authors: string[],
  /** The date that this document was created on. Does NOT automatically detect the date of daily runs (It can't) */
  date: string,
  /**
   * A list of all the waves in this Daily Run.
   * 
   * A completed Daily Run will have 50 waves.
   * 
   * This array automatically sorts by wave number, with blank slots being pushed to the bottom.
   * 
   * @see Wave
   */
  waves: Wave[],
  /** The Pokemon that the player started with. Daily runs will have 3. @see PokeData */
  starters?: PokeData[],
  /** The maximum luck value you can have. If your luck value is higher than this, some floors may break. */
  maxluck?: integer;
  minSafeLuckFloor?: integer[];
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
 * Creates a new document in the DRPD format
 * @param name (Optional) The name for the file. Defaults to "Untitled Run".
 * @param authorName (Optional) The author(s) of the file. Defaults to "Write your name here".
 * @returns The fresh DRPD document.
 */
export function newDocument(name: string = "Untitled Run", authorName: string | string[] = "Write your name here"): DRPD {
  var ret: DRPD = {
    version: DRPD_Version,
    seed: "",
    title: name,
    label: "unnamedRoute",
    uuid: "",
    authors: (Array.isArray(authorName) ? authorName : [authorName]),
    date: new Date().getUTCFullYear() + "-" + (new Date().getUTCMonth() + 1 < 10 ? "0" : "") + (new Date().getUTCMonth() + 1) + "-" + (new Date().getUTCDate() < 10 ? "0" : "") + new Date().getUTCDate(),
    waves: new Array(50),
    starters: new Array(3),
    //maxluck: 14,
    //minSafeLuckFloor: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  }
  var RState = Phaser.Math.RND.state()
  ret.uuid = Phaser.Math.RND.uuid()
  Phaser.Math.RND.state(RState)
  return ret;
}
/**
 * Prints a DRPD as a string, for saving it to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param drpd The `DRPD` to export.
 * @returns `inData`, with all the DRPD's data appended to it.
 * 
 * @see downloadLogByID
 */
export function printDRPD(inData: string, indent: string, drpd: DRPD): string {
  console.log("Printing for sheet?: " + SheetsMode.value)
  inData += indent + "{"
  inData += "\n" + indent + "  \"version\": \"" + drpd.version + "\""
  inData += ",\n" + indent + "  \"seed\": \"" + drpd.seed + "\""
  inData += ",\n" + indent + "  \"title\": \"" + drpd.title + "\""
  inData += ",\n" + indent + "  \"authors\": [\"" + drpd.authors.join("\", \"") + "\"]"
  inData += ",\n" + indent + "  \"date\": \"" + drpd.date + "\""
  inData += ",\n" + indent + "  \"label\": \"" + drpd.label + "\""
  inData += ",\n" + indent + "  \"uuid\": \"" + drpd.uuid + "\""
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
    inData += "\n" + indent + "  ]\n"
  } else {
    inData += ",\n" + indent + "  \"waves\": []"
  }
  inData += ",\n" + indent + "  \"starters\": [\n"
  var isFirst = true
  if (drpd.starters) {
    for (var i = 0; i < drpd.starters.length; i++) {
      if (drpd.starters[i] != undefined && drpd.starters[i] != null) {
        if (isFirst) {
          isFirst = false;
        } else {
          inData += ",\n"
        }
        inData = printPoke(inData, indent + "    ", drpd.starters[i])
      }
    }
  }
  inData += "\n" + indent + "  ]\n" + indent + "}"
  return inData;
}





/**
 * Updates a DRPD, checkings its version and making any necessary changes to it in order to keep it up to date.
 * 
 * @param drpd The DRPD document to update. Its version will be read automatically.
 * @see DRPD
 */
function updateLog(drpd: DRPD): DRPD {
  if (drpd.date[2] == "-") {
    var date_month = drpd.date.substring(0, 2)
    var date_day = drpd.date.substring(3, 5)
    var date_year = drpd.date.substring(6, 10)
    console.log(`Corrected date from ${drpd.date} to ${date_year}-${date_month}-${date_day}`)
    drpd.date = `${date_year}-${date_month}-${date_day}`
  }
  if (drpd.version == "1.0.0") {
    drpd.version = "1.0.0a"
    console.log("Updated to 1.0.0a - changed item IDs to strings")
    for (var i = 0; i < drpd.waves.length; i++) {
      if (drpd.waves[i] != undefined) {
        if (drpd.waves[i].pokemon) {
          for (var j = 0; j < drpd.waves[i].pokemon!.length; j++) {
            for (var k = 0; k < drpd.waves[i].pokemon![j].items.length; k++) {
              drpd.waves[i].pokemon![j].items[k].id = drpd.waves[i].pokemon![j].items[k].id.toString()
            }
          }
        }
      }
    }
    for (var j = 0; j < drpd.starters!.length; j++) {
      for (var k = 0; k < drpd.starters![j].items.length; k++) {
        drpd.starters![j].items[k].id = drpd.starters![j].items[k].id.toString()
      }
    }
  } // 1.0.0 → 1.0.0a
  if (drpd.version == "1.0.0a") {
    drpd.version = "1.1.0"
    var RState = Phaser.Math.RND.state()
    drpd.uuid = Phaser.Math.RND.uuid()
    Phaser.Math.RND.state(RState)
    drpd.label = "route"
  } // 1.0.0a → 1.1.0
  if (drpd.version == "1.1.0") {
    drpd.version = "1.1.0a"
    drpd.maxluck = 14
    drpd.minSafeLuckFloor = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  } // 1.1.0 → 1.1.0a
  if (drpd.version == "1.1.0a") {
    drpd.version = "1.1.0b"
    for (var i = 0; i < drpd.waves.length; i++) {
      if (drpd.waves[i] && drpd.waves[i].pokemon) {
        for (var j = 0; j < drpd.waves[i].pokemon!.length; j++) {
          drpd.waves[i].pokemon![j].iv_raw = drpd.waves[i].pokemon![j].ivs!
          drpd.waves[i].pokemon![j].ivs = undefined
          drpd.waves[i].pokemon![j].iv = formatIVs(drpd.waves[i].pokemon![j].ivs!)
        }
      }
    }
  } // 1.1.0a → 1.1.0b
  return drpd;
}
// #endregion





// #region 06 Wave
/**
 * A Wave is one individual battle in the run.
 * Each group of ten waves has the same biome.
 */
export interface Wave {
  /** The wave number. Used to label the wave, detect and delete duplicates, and automatically sort `DRPD.waves[]`. */
  id: integer,
  /** Set to `true` if a reload is required to play this wave properly.Setting this value is the PITA I have ever dealt with. */
  reload: boolean,
  /**
   * The specific type of wave.
   * 
   * `wild`: This is a wild encounter.
   * 
   * `trainer`: This is a trainer battle.
   * 
   * `boss`: This is a boss floor (floors 10, 20, 30, etc). Overrides the two values above.
   */
  type: "wild" | "trainer" | "boss",
  /** Set to `true` if this is a double battle. */
  double: boolean,
  /** The list of actions that the player took during this wave. */
  actions: string[],
  /** The item that the player took in the shop. A blank string (`""`) if there is no shop (wave 10, 20, 30, etc.) or the player fled from battle. */
  shop: string,
  /** The biome that this battle takes place in. */
  biome: string,
  /** If true, the next time an action is logged, all previous actions will be deleted.
   * @see Wave.actions
   * @see logActions
   * @see resetWaveActions
   */
  clearActionsFlag: boolean,
  /** The trainer that you fight in this floor, if any.
   * @see LogTrainerData
   * @see Wave.type
   */
  trainer?: LogTrainerData,
  /** The Pokémon that you have to battle against.
   * Not included if this is a trainer battle.
   * @see PokeData
   * @see Wave.type
   */
  pokemon?: PokeData[],
  /**
   * Contains the first 3 turns or so of the enemy's actions.
   * Used to check for refreshes.
   */
  initialActions: string[],
  /**
   * Contains the names of the first set of modifier rewards.
   * Used to check for refreshes.
   */
  modifiers: string[]
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
    clearActionsFlag: false,
    biome: getBiomeName(scene.arena.biomeType),
    initialActions: [],
    modifiers: []
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
        id: scene.currentBattle.trainer!.config.trainerType,
        name: scene.currentBattle.trainer!.name,
        type: scene.currentBattle.trainer!.config.title
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
      inData += ",\n" + indent + "  \"actions\": \""
      var isFirst = true
        for (var i = 0; i < wave.actions.length; i++) {
          if (wave.actions[i] != undefined) {
            if (isFirst) {
              isFirst = false;
            } else {
              inData += "CHAR(10)"
            }
            inData += wave.actions[i]
          }
        }
      inData +=  "\""
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
    inData += ",\n" + indent + "  \"actions\": [\"[No actions?]\"]"
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
 * Retrieves a wave from the DRPD. If the wave doesn't exist, it creates a new one.
 * @param drpd The document to read from.
 * @param floor The wave index to retrieve.
 * @param scene The BattleScene, used for creating a new wave
 * @returns The requested `Wave`.
 */
export function getWave(drpd: DRPD, floor: integer, scene: BattleScene): Wave {
  var wv: Wave | undefined = undefined;
  var insertPos: integer | undefined = undefined;
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
      clearActionsFlag: false,
      biome: getBiomeName(scene.arena.biomeType),
      initialActions: [],
      modifiers: [],
      //pokemon: []
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
        drpd.waves.splice(i, 1)
        drpd.waves.sort((a, b) => {
          if (a == undefined) return 1;  // empty values move to the bottom
          if (b == undefined) return -1; // empty values move to the bottom
          return a.id - b.id
        })
      }
    }
  }
  if (wv == undefined) {
    if (scene.gameMode.modeId != GameModes.DAILY || true) {
      if (scene.gameMode.modeId == GameModes.DAILY) {
        console.log(";-;")
      }
      drpd.waves.push({
        id: floor,
        reload: false,
        //type: floor % 10 == 0 ? "boss" : (floor % 10 == 5 ? "trainer" : "wild"),
        type: floor % 10 == 0 ? "boss" : "wild",
        double: scene.currentBattle.double,
        actions: [],
        shop: "",
        biome: getBiomeName(scene.arena.biomeType),
        clearActionsFlag: false,
        initialActions: [],
        modifiers: [],
        //pokemon: []
      })
      return drpd.waves[drpd.waves.length - 1]
    }
    /*
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
            clearActionsFlag: false,
            initialActions: [],
            modifiers: [],
            //pokemon: []
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
            clearActionsFlag: false,
            biome: getBiomeName(scene.arena.biomeType),
            initialActions: [],
            modifiers: [],
            //pokemon: []
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
    */
  }
  if (wv == undefined) {
    scene.ui.showText("Failed to retrieve wave\nPress F12 for info", 10000)
    console.error("Failed to retrieve wave??")
    console.error("this mod i stg")
    console.error("Go yell at @redstonewolf8557 to fix this")
    return {
      id: -1,
      reload: true,
      type: "wild",
      double: false,
      actions: [
        "THIS IS AN ERROR!",
        "TypeScript forced me to specify a value",
        "REPORT THIS TO REDSTONEWOLF"
      ],
      shop: "",
      biome: "",
      clearActionsFlag: false,
      initialActions: [],
      modifiers: []
    };
  }
  return wv;
}
// #endregion





// #region 07 Pokémon
/**
 * Stores information about a Pokémon.
 * 
 * This data type is used in `DRPD.starters` to list the player's starting Pokémon, or in `Wave.pokemon` to list the opponent(s) in a wild encounter.
 */
export interface PokeData {
  /** The party position of this Pokémon, as of the beginning of the battle. */
  id: integer,
  /** The name of this Pokémon as it would appear in the party list or in battle. */
  name: string,
  /** The Pokémon's primary ability. */
  ability: string,
  /** Set to `true` if this Pokémon's ability is its Hidden Ability.
   * @see PokeData.ability
   */
  isHiddenAbility: boolean,
  /** The Pokémon's passive / secondary ability. */
  passiveAbility: string,
  /** The Pokémon's nature. Influences its stats.
   * @see NatureData
   */
  nature: NatureData,
  /** The Pokémon's gender. */
  gender: "Male" | "Female" | "Genderless",
  /** The Pokémon's encounter rarity within the current biome. */
  rarity: string,
  /** Whether or not the Pokémon was captured. */
  captured: boolean,
  /** The Pokémon's level. */
  level: integer,
  /** The Pokémon's Held Items, if any.
   * @see ItemData
   */
  items: ItemData[],
  /** The Pokémon's IVs. Influences its base stats.
   * @see IVData
   */
  iv_raw: IVData,
  /** The Pokémon's IVs, printed as ordered text. */
  iv: string[],
  /** @deprecated */
  ivs?: IVData,
  /** The Pokémon that was used to generate this `PokeData`. Not exported.
   * @see Pokemon
   */
  source?: Pokemon
}
/**
 * Exports a Pokemon's data as `PokeData`.
 * @param pokemon The Pokemon to store.
 * @param encounterRarity The rarity tier of the Pokemon for this biome.
 * @returns The Pokemon data.
 */
export function exportPokemon(pokemon: Pokemon, encounterRarity?: string): PokeData {
  return {
    id: Utils.getEnumValues(Species).indexOf(pokemon.species.speciesId),
    name: pokemon.species.getName(),
    ability: pokemon.getAbility().name,
    isHiddenAbility: pokemon.hasAbility(pokemon.species.abilityHidden),
    passiveAbility: pokemon.getPassiveAbility().name,
    nature: exportNature(pokemon.nature),
    gender: pokemon.gender == 0 ? "Male" : (pokemon.gender == 1 ? "Female" : "Genderless"),
    rarity: encounterRarity!,
    captured: false,
    level: pokemon.level,
    items: pokemon.getHeldItems().map((item, idx) => exportItem(item)),
    iv_raw: exportIVs(pokemon.ivs),
    iv: formatIVs(pokemon.ivs)
  }
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
  if (SheetsMode.value) {
    inData += ",\n" + indent + "  \"items\": \""
    var isFirst = true
      for (var i = 0; i < pokemon.items.length; i++) {
        if (pokemon.items[i] != undefined) {
          if (isFirst) {
            isFirst = false;
          } else {
            inData += "CHAR(10)"
          }
          inData += printItemNoNewline(inData, "", pokemon.items[i])
        }
      }
    inData +=  "\""
  } else {
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
  }
  inData += ",\n" + indent + "  \"ivs\": "
  inData = printIV(inData, indent + "  ", pokemon.iv_raw)
  //inData += ",\n" + indent + "  \"rarity\": " + pokemon.rarity
  inData += "\n" + indent + "}"
  return inData;
}





/**
 * Calls `logPokemon` once for each opponent or, if it's a trainer battle, logs the trainer's data.
 * @param scene The BattleScene. Used to get the enemy team and whether it's a trainer battle or not.
 * @param floor The wave index to write to. Defaults to the current wave.
 */
export function logTeam(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex) {
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
// #endregion





// #region 08 Nature
/**
 * Information about a Pokémon's nature.
 */
export interface NatureData {
  /** The display name of this nature. */
  name: string,
  /** The stat that gets a 10% increase from this nature, if any. */
  increased: "" | "atk" | "def" | "spatk" | "spdef" | "spe",
  /** The stat that gets a 10% decrease from this nature, if any. */
  decreased: "" | "atk" | "def" | "spatk" | "spdef" | "spe"
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
// #endregion





// #region 09 IVs
/**
 * Information about a Pokémon's Individual Values (IVs).
 */
export interface IVData {
  /** Influences a Pokémon's maximum health. */
  hp: integer,
  /** Influences a Pokémon's physical strength. */
  atk: integer,
  /** Influences a Pokémon's resistance to physical attacks. */
  def: integer,
  /** Influences the power of a Pokémon's ranged attacks */
  spatk: integer,
  /** Influences a Pokémon's resistance to ranged attacks. */
  spdef: integer,
  /** Influences a Pokémon's action speed. */
  speed: integer
}
/**
 * Exports a Pokémon's IVs as `IVData`.
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
export function formatIVs(ivs: integer[] | IVData): string[] {
  return [
    `HP: ${Array.isArray(ivs) ? ivs[0] : ivs.hp}`,
    `Attack: ${Array.isArray(ivs) ? ivs[1] : ivs.hp}`,
    `Defense: ${Array.isArray(ivs) ? ivs[2] : ivs.hp}`,
    `Sp. Atk: ${Array.isArray(ivs) ? ivs[3] : ivs.hp}`,
    `Sp. Def: ${Array.isArray(ivs) ? ivs[4] : ivs.hp}`,
    `Speed: ${Array.isArray(ivs) ? ivs[5] : ivs.hp}`,
  ]
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
  inData += ",\n" + indent + "  \"spe\": " + iv.speed
  inData += "\n" + indent + "}"
  return inData;
}
// #endregion





// #region 10 Trainer
/**
 * A Trainer that the player has to battle against.
 * A Trainer will have 1-6 Pokémon in their party, depending on their difficulty.
 * 
 * If the wave has a Trainer, their party is not logged, and `Wave.pokemon` is left empty.
 */
export interface LogTrainerData {
  /** The trainer type's position in the Trainers enum.
   * @see Trainer
  */
  id: integer,
  /** The Trainer's ingame name. */
  name: string,
  /** The Trainer's ingame title. */
  type: string,
}
/**
 * Exports the opposing trainer as `LogTrainerData`.
 * @param trainer The Trainer to store.
 * @returns The Trainer data.
 */
export function exportTrainer(trainer: Trainer): LogTrainerData {
  return {
    id: trainer.config.trainerType,
    name: trainer.getNameOnly(),
    type: trainer.getTitleOnly()
  }
}
/**
 * Prints a Trainer as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `LogTrainerData` to export.
 * @returns `inData`, with all the Trainer's data appended to it.
 * 
 * @see printDRPD
 */
function printTrainer(inData: string, indent: string, trainer: LogTrainerData) {
  inData += "{"
  inData += "\n" + indent + "  \"id\": \"" + trainer.id + "\""
  inData += ",\n" + indent + "  \"name\": \"" + trainer.name + "\""
  inData += ",\n" + indent + "  \"type\": \"" + trainer.type + "\""
  inData += "\n" + indent + "}"
  return inData;
}
// #endregion





// #region 11 Item
/** An item held by a Pokémon. Quantities and ownership are recorded at the start of the battle, and do not reflect items being used up or stolen. */
export interface ItemData {
  /** A type:key pair identifying the specific item.
   * 
   * Example: `FormChange:TOXIC_PLATE`
   */
  id: string,
  /** The item's ingame name. */
  name: string,
  /** This item's stack size. */
  quantity: integer,
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
/**
 * Prints an item as a string, for saving a DRPD to your device.
 * @param inData The data to add on to.
 * @param indent The indent string (just a bunch of spaces).
 * @param wave The `ItemData` to export.
 * @returns `inData`, with all the Item's data appended to it.
 * 
 * @see `downloadLogByIDToSheet`
 */
function printItemNoNewline(inData: string, indent: string, item: ItemData) {
  inData = "{\\\"id\\\": \\\"" + item.id + "\\\", \\\"name\\\": \\\"" + item.name + "\\\", \\\"quantity\\\": " + item.quantity + "}"
  return inData;
}
// #endregion





//#region 12 Ingame Menu

/**
 * Sets the name, author, and label for a file.
 * @param title The display name of the file.
 * @param authors The author(s) of the file.
 */
export function setFileInfo(title: string, authors: string[], label: string) {
  console.log("Setting file " + rarityslot[1] + " to " + title + " / [" + authors.join(", ") + "]")
  var fileID = rarityslot[1] as string
  var drpd = JSON.parse(localStorage.getItem(fileID)!) as DRPD;
  drpd = updateLog(drpd)
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
  drpd.title = title;
  drpd.authors = authors;
  drpd.label = label;
  localStorage.setItem(fileID, JSON.stringify(drpd))
}

/**
 * Generates a UI option to save a log to your device.
 * @param i The slot number. Corresponds to an index in `logs`.
 * @param saves Your session data. Used to label logs if they match one of your save slots.
 * @returns A UI option.
 */
export function generateOption(i: integer, saves: any): OptionSelectItem {
  var filename: string = (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).title!
  var op: OptionSelectItem = {
    label: `Export ${filename} (${getSize(printDRPD("", "", JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD))})`,
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
  var filename: string = (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).title || "unlabeled"
  var op: OptionSelectItem = {
    label: `Export ${filename} (${getSize(printDRPD("", "", JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD))})`,
    handler: () => {
      rarityslot[1] = logs[i][1]
      //scene.phaseQueue[0].end()
      scene.ui.setMode(Mode.NAME_LOG, {
        autofillfields: [
          (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).title,
          (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).authors.join(", "),
          (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).label,
        ],
        buttonActions: [
          () => {
            console.log("Rename")
            scene.ui.playSelect();
            phase.callEnd()
          },
          () => {
            console.log("Export")
            scene.ui.playSelect();
            downloadLogByID(i)
            phase.callEnd()
          },
          () => {
            console.log("Export to Sheets")
            scene.ui.playSelect();
            downloadLogByIDToSheet(i)
            phase.callEnd()
          },
          () => {
            console.log("Delete")
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
    //console.log(saves[j].seed, logs[i][2], saves[j].seed == logs[i][2])
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
export function generateEditHandler(scene: BattleScene, logId: string, callback: Function) {
  var i;
  for (var j = 0; j < logs.length; j++) {
    if (logs[j][2] == logId) {
      i = j;
    }
  }
  if (i == undefined)
    return; // Failed to find a log
  return (): boolean => {
    rarityslot[1] = logs[i][1]
    //scene.phaseQueue[0].end()
    scene.ui.setMode(Mode.NAME_LOG, {
      autofillfields: [
        (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).title,
        (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).authors.join(", "),
        (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).label,
      ],
      buttonActions: [
        () => {
          console.log("Rename")
          scene.ui.playSelect();
          callback()
        },
        () => {
          console.log("Export")
          scene.ui.playSelect();
          downloadLogByID(i)
          callback()
        },
        () => {
          console.log("Export to Sheets")
          scene.ui.playSelect();
          downloadLogByIDToSheet(i)
          callback()
        },
        () => {
          console.log("Delete")
          scene.ui.playSelect();
          localStorage.removeItem(logs[i][1])
          callback()
        }
      ]
    });
    return false;
  }
}
/**
 * Generates a UI option to save a log to your device.
 * @param i The slot number. Corresponds to an index in `logs`.
 * @param saves Your session data. Used to label logs if they match one of your save slots.
 * @returns A UI option.
 */
export function generateEditHandlerForLog(scene: BattleScene, i: integer, callback: Function) {
  return (): boolean => {
    rarityslot[1] = logs[i][1]
    //scene.phaseQueue[0].end()
    scene.ui.setMode(Mode.NAME_LOG, {
      autofillfields: [
        (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).title,
        (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).authors.join(", "),
        (JSON.parse(localStorage.getItem(logs[i][1])!) as DRPD).label,
      ],
      buttonActions: [
        () => {
          console.log("Rename")
          scene.ui.playSelect();
          callback()
        },
        () => {
          console.log("Export")
          scene.ui.playSelect();
          downloadLogByID(i)
          callback()
        },
        () => {
          console.log("Export to Sheets")
          scene.ui.playSelect();
          downloadLogByIDToSheet(i)
          callback()
        },
        () => {
          console.log("Delete")
          scene.ui.playSelect();
          localStorage.removeItem(logs[i][1])
          callback()
        }
      ]
    });
    return false;
  }
}

//#endregion





//#region 13 Logging Events

//        * The functions in this section are sorted in alphabetical order.

/**
 * Logs the actions that the player took.
 * 
 * This includes attacks you perform, items you transfer during the shop, Poke Balls you throw, running from battl, (or attempting to), and switching (including pre-switches).
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param action The text you want to add to the actions list.
 * 
 * @see resetWaveActions
 */
export function logActions(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex, action: string) {
  var drpd = getDRPD(scene)
  console.log(`Logging an action: "${action}"`)
  var wv: Wave = getWave(drpd, floor, scene)
  if (wv.double == undefined)
    wv.double = false
  if (wv.clearActionsFlag) {
    console.log("Triggered clearActionsFlag")
    wv.clearActionsFlag = false
    wv.actions = []
  }
  wv.actions.push(action)
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs the actions that the player took, adding text to the most recent action.
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param action The text you want to add to the actions list.
 * 
 * @see resetWaveActions
 */
export function appendAction(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex, action: string) {
  var drpd = getDRPD(scene)
  var wv: Wave = getWave(drpd, floor, scene)
  if (wv.clearActionsFlag) {
    console.log("Triggered clearActionsFlag")
    wv.clearActionsFlag = false
    wv.actions = []
  }
  console.log(`Appending to an action: "${wv.actions[wv.actions.length - 1]}" + "${action}"`)
  if (wv.double == undefined)
    wv.double = false
  wv.actions[wv.actions.length - 1] = wv.actions[wv.actions.length - 1] + action
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs the actions that the player took.
 * 
 * This includes attacks you perform, items you transfer during the shop, Poke Balls you throw, running from battl, (or attempting to), and switching (including pre-switches).
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to.
 * @param action The text you want to add to the actions list.
 * 
 * @see resetWaveActions
 */
export function getActionCount(scene: BattleScene, floor: integer) {
  var drpd = getDRPD(scene)
  console.log(`Checking action count`)
  console.log(drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  if (wv.double == undefined)
    wv.double = false
  if (wv.clearActionsFlag) {
    console.log("Triggered clearActionsFlag")
    wv.clearActionsFlag = false
    wv.actions = []
  }
  return (wv.actions.length)
}
/**
 * Logs that a Pokémon was captured.
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param target The Pokémon that you captured.
 */
export function logCapture(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex, target: EnemyPokemon) {
  var drpd = getDRPD(scene)
  console.log(`Logging successful capture: ${target.name}`)
  var wv: Wave = getWave(drpd, floor, scene)
  var pkslot = target.partyslot
  if (wv.id != -1) {
    wv.pokemon![pkslot].captured = true;
    console.log("--> ", drpd)
    localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
  } else {
    console.error("Error: Failed to log capture")
  }
}
/**
 * Logs the player's current party.
 * 
 * Called on Floor 1 to store the starters list.
 * @param scene  The BattleScene. Used to get the log ID and the player's party.
 */
export function logPlayerTeam(scene: BattleScene) {
  var drpd = getDRPD(scene)
  console.log(`Logging player starters: ${scene.getParty().map(p => p.name).join(", ")}`)
  var P = scene.getParty()
  for (var i = 0; i < P.length; i++) {
    drpd.starters![i] = exportPokemon(P[i])
  }
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Checks the minimum luck that will break this floor's shop, and updates the appropriate values.
 * @param scene  The BattleScene.
 */
export function logLuck(scene: BattleScene) {
  //return;
  var drpd = getDRPD(scene)
  if (scene.waveShinyMinToBreak > 0) {
    console.log(`Logging luck stats`)
    drpd.maxluck = Math.min(drpd.maxluck!, scene.waveShinyMinToBreak - 1)
    for (var i = scene.waveShinyMinToBreak; i <= 14; i++) {
      drpd.minSafeLuckFloor![i] = Math.max(drpd.minSafeLuckFloor![i], scene.currentBattle.waveIndex)
    }
    console.log("--> ", drpd)
    localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
  } else {
    console.log(`Skipped logging luck stats: Luck has no effect on this floor`)
  }
}
/**
 * Logs a wild Pokémon to a wave's data.
 * @param scene The BattleScene. Used to retrieve the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param slot The slot to write to. In a single battle, 0 = the Pokémon that is out first. In a double battle, 0 = Left and 1 = Right.
 * @param pokemon The `EnemyPokemon` to store the data of. (Automatically converted via `exportPokemon`)
 * @param encounterRarity The rarity tier of this Pokémon. If not specified, it calculates this automatically by searching the current biome's species pool.
 */
export function logPokemon(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex, slot: integer, pokemon: EnemyPokemon, encounterRarity?: string) {
  var drpd = getDRPD(scene)
  console.log(`Logging opposing team member: ${pokemon.name}`)
  var wv: Wave = getWave(drpd, floor, scene)
  var pk: PokeData = exportPokemon(pokemon, encounterRarity)
  pk.source = pokemon
  pokemon.partyslot = slot;
  if (wv.pokemon == undefined)
    wv.pokemon = []
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
  //while (wv.actions.length > 0)
    //wv.actions.pop()
  //wv.actions = []
  wv.clearActionsFlag = false;
  wv.shop = ""
  drpd.seed = scene.seed
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs what the player took from the rewards pool and, if applicable, who they used it on.
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param action The shop action. Left blank if there was no shop this floor or if you ran away. Logged as "Skip taking items" if you didn't take anything for some reason.
 */
export function logShop(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex, action: string) {
  var drpd = getDRPD(scene)
  console.log(`Logging shop result: "${action}"`)
  var wv: Wave = getWave(drpd, floor, scene)
  wv.shop = action
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Logs the current floor's Trainer.
 * @param scene The BattleScene. Used to get the log ID and trainer data.
 * @param floor The wave index to write to. Defaults to the current floor.
 */
export function logTrainer(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex) {
  var drpd: DRPD = JSON.parse(localStorage.getItem(getLogID(scene))!) as DRPD;
  drpd = updateLog(drpd);
  console.log(`Logging trainer: ${scene.currentBattle.trainer!.getTitleOnly()} ${scene.currentBattle.trainer!.getNameOnly()}`)
  var wv: Wave = getWave(drpd, floor, scene)
  var t: LogTrainerData = exportTrainer(scene.currentBattle.trainer!)
  wv.trainer = t
  wv.type = "trainer"
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}





/**
 * Flags a wave as a reset.
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to.
 */
export function flagReset(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex) {
  var drpd = getDRPD(scene)
  console.log("Flag Reset", drpd)
  var wv = getWave(drpd, floor, scene)
  wv.reload = true;
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
/**
 * Flags a wave as a reset, unless this is your first time playing the wave.
 * @param scene The BattleScene. Used to get the log ID.
 * @param floor The wave index to write to. Defaults to the current floor.
 */
export function flagResetIfExists(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex) {
  var drpd = getDRPD(scene)
  var waveExists = false
  for (var i = 0; i < drpd.waves.length; i++) {
    if (drpd.waves[i] != undefined) {
      if (drpd.waves[i].id == floor) {
        waveExists = true;
      }
    }
  }
  if (!waveExists) {
    console.log("Skipped wave reset because this is not a reload", drpd)
    return;
  }
  console.log("Flag reset as wave was already played before", drpd)
  var wv = getWave(drpd, floor, scene)
  wv.reload = true;
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}



/**
 * Clears the action list for a wave.
 * @param scene The BattleScene. Used to get the log ID and trainer data.
 * @param floor The wave index to write to. Defaults to the current floor.
 * @param softflag Rather than deleting everything right away, the actions will be cleared the next time we attempt to log an action.
 * 
 * @see logActions
 */
export function resetWaveActions(scene: BattleScene, floor: integer = scene.currentBattle.waveIndex, softflag: boolean) {
  var drpd = getDRPD(scene)
  console.log("Clear Actions", drpd)
  var wv: Wave = getWave(drpd, floor, scene)
  if (softflag) {
    wv.clearActionsFlag = true;
  } else {
    wv.actions = []
  }
  console.log("--> ", drpd)
  localStorage.setItem(getLogID(scene), JSON.stringify(drpd))
}
//#endregion





// #region Utils from Phases.ts
export const tierNames = [
  "Poké",
  "Great",
  "Ultra",
  "Rogue",
  "Master"
]
/**
 * This function rolls for modifiers with a certain luck value, checking to see if shiny luck would affect your results.
 * @param scene 
 * @param predictionCost 
 * @param rerollOverride 
 * @param modifierOverride 
 * @returns 
 */
export function shinyCheckStep(scene: BattleScene, predictionCost: Utils.IntegerHolder, rerollOverride: integer, modifierOverride?: integer) {
  var minLuck = -1
  var modifierPredictions: ModifierTypeOption[][] = []
  const party = scene.getParty();
  regenerateModifierPoolThresholds(party, ModifierPoolType.PLAYER, rerollOverride);
  const modifierCount = new Utils.IntegerHolder(3);
  scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
  if (modifierOverride) {
    //modifierCount.value = modifierOverride
  }
  var isOk = true;
  const typeOptions: ModifierTypeOption[] = getPlayerModifierTypeOptions(modifierCount.value, scene.getParty(), undefined, scene, true, true);
  typeOptions.forEach((option, idx) => {
    let lastTier = option.type!.tier
    if (option.alternates && option.alternates.length > 0) {
      for (var i = 0; i < option.alternates.length; i++) {
        if (option.alternates[i] > lastTier) {
          //lastTier = option.alternates[i]
          //console.log("Conflict found! (" + i + " luck, " + rerollOverride + " rolls, item " + (idx + 1) + ")")
          isOk = false // Shiny Luck affects this wave in some way
          if (minLuck == -1 && i != 0)
            minLuck = i
        }
      }
    }
  })
  modifierPredictions.push(typeOptions)
  predictionCost.value += (Math.min(Math.ceil(scene.currentBattle.waveIndex / 10) * 250 * Math.pow(2, rerollOverride), Number.MAX_SAFE_INTEGER))
  return [isOk, minLuck];
}
/**
 * Simulates modifier rolls for as many rerolls as you can afford, checking to see if shiny luck will alter your results.
 * @param scene The current `BattleScene`.
 * @returns `true` if no changes were detected, `false` otherwise
 */
export function runShinyCheck(scene: BattleScene, mode: integer, wv?: integer) {
  var minLuck: integer = -1
  if (mode == 1) {
    scene.emulateReset(wv)
  } else {
    scene.resetSeed(wv);
  }
  const predictionCost = new Utils.IntegerHolder(0)
  var isOk = true;
  for (var i = 0; predictionCost.value < scene.money && i < 8; i++) {
    var r = shinyCheckStep(scene, predictionCost, i)
    isOk = isOk && (r[0] as boolean)
    if (isOk || (r[1] as integer) === -1) {
      // Do nothing
    } else if (minLuck == -1) {
      minLuck = (r[1] as integer)
      console.log("Luck " + r[1] + " breaks")
    } else {
      console.log("Updated from " + minLuck + " to " + Math.min(minLuck, (r[1] as integer)))
      minLuck = Math.min(minLuck, (r[1] as integer))
    }
  }
  if (mode == 1) {
    scene.restoreSeed(wv)
  } else {
    scene.resetSeed(wv);
  }
  if (!isOk) {
    console.log("Conflict found!")
  }
  if (minLuck == 15) {
    //minLuck = 0
  }
  return [isOk, minLuck]
}
function catchCalc(pokemon: EnemyPokemon) {
  const _3m = 3 * pokemon.getMaxHp();
  const _2h = 2 * pokemon.hp;
  const catchRate = pokemon.species.catchRate;
  const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
  const rate1 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1) / _3m) * statusMultiplier)))));
  const rate2 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1.5) / _3m) * statusMultiplier)))));
  const rate3 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 2) / _3m) * statusMultiplier)))));
  const rate4 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 3) / _3m) * statusMultiplier)))));

  var rates = [rate1, rate2, rate3, rate4]
  var rates2 = rates.map(r => ((r/65536) ** 3))
  //console.log(rates2)

  return rates2
}
function catchCalcRaw(pokemon: EnemyPokemon) {
  const _3m = 3 * pokemon.getMaxHp();
  const _2h = 2 * pokemon.hp;
  const catchRate = pokemon.species.catchRate;
  const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
  const rate1 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1) / _3m) * statusMultiplier)))));
  const rate2 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1.5) / _3m) * statusMultiplier)))));
  const rate3 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 2) / _3m) * statusMultiplier)))));
  const rate4 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 3) / _3m) * statusMultiplier)))));

  var rates = [rate1, rate2, rate3, rate4]
  var rates2 = rates.map(r => ((r/65536) ** 3))
  //console.log(rates2)
  //console.log("output: ", rates)

  return rates
}

/**
 * Finds the best Poké Ball to catch a Pokemon with, and the % chance of capturing it.
 * @param pokemon The Pokémon to get the catch rate for.
 * @param override Show the best Poké Ball to use, even if you don't have any.
 * @returns The name and % rate of the best Poké Ball.
 */
export function findBest(scene: BattleScene, pokemon: EnemyPokemon, override?: boolean) {
  var rates = catchCalc(pokemon)
  var rates_raw = catchCalcRaw(pokemon)
  var rolls = []
  var offset = 0
  scene.getModifiers(BypassSpeedChanceModifier, true).forEach(m => {
    //console.log(m, m.getPokemon(this.scene), pokemon)
    var p = m.getPokemon(scene)
    scene.getField().forEach((p2, idx) => {
      if (p == p2) {
        console.log(m.getPokemon(scene)?.name + " (Position: " + (idx + 1) + ") has a Quick Claw")
        offset++
      }
    })
  })
  scene.currentBattle.multiInt(scene, rolls, offset + 3, 65536, undefined, "Catch prediction")
  //console.log(rolls)
  //console.log(rolls.slice(offset, offset + 3))
  if (scene.pokeballCounts[0] == 0 && !override) rates[0] = 0
  if (scene.pokeballCounts[1] == 0 && !override) rates[1] = 0
  if (scene.pokeballCounts[2] == 0 && !override) rates[2] = 0
  if (scene.pokeballCounts[3] == 0 && !override) rates[3] = 0
  var rates2 = rates.slice()
  rates2.sort(function(a, b) {return b - a})
  const ballNames = [
    "Poké Ball",
    "Great Ball",
    "Ultra Ball",
    "Rogue Ball",
    "Master Ball"
  ]
  var func_output = ""
  rates_raw.forEach((v, i) => {
    if (scene.pokeballCounts[i] == 0 && !override)
      return; // Don't list success for Poke Balls we don't have
    //console.log(ballNames[i])
    //console.log(v, rolls[offset + 0], v > rolls[offset + 0])
    //console.log(v, rolls[offset + 1], v > rolls[offset + 1])
    //console.log(v, rolls[offset + 2], v > rolls[offset + 2])
    if (v > rolls[offset + 0]) {
      //console.log("1 roll")
      if (v > rolls[offset + 1]) {
        //console.log("2 roll")
        if (v > rolls[offset + 2]) {
          //console.log("Caught!")
          if (func_output == "") {
            func_output = ballNames[i] + " catches"
          }
        }
      }
    }
    if (v > rolls[offset] && v > rolls[1 + offset] && v > rolls[2 + offset]) {
      if (func_output == "") {
        func_output = ballNames[i] + " catches"
      }
    }
  })
  if (func_output != "") {
    return func_output
  }
  return "Can't catch"
  var n = ""
  switch (rates2[0]) {
    case rates[0]:
      // Poke Balls are best
      n = "Poké Ball "
      break;
    case rates[1]:
      // Great Balls are best
      n = "Great Ball "
      break;
    case rates[2]:
      // Ultra Balls are best
      n = "Ultra Ball "
      break;
    case rates[3]:
      // Rogue Balls are best
      n = "Rogue Ball "
      break;
    default:
      // Master Balls are the only thing that will work
      if (scene.pokeballCounts[4] != 0 || override) {
        return "Master Ball";
      } else {
        return "No balls"
      }
  }
  return n + " (FAIL)"
  return n + Math.round(rates2[0] * 100) + "%";
}
export function parseSlotData(slotId: integer): SessionSaveData | undefined {
  var S = localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`)
  if (S == null) {
    // No data in this slot
    return undefined;
  }
  var dataStr = decrypt(S, true)
  var Save = JSON.parse(dataStr, (k: string, v: any) => {
    /*const versions = [ scene.game.config.gameVersion, sessionData.gameVersion || '0.0.0' ];

    if (versions[0] !== versions[1]) {
      const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
    }*/

    if (k === "party" || k === "enemyParty") {
      const ret: PokemonData[] = [];
      if (v === null) {
        v = [];
      }
      for (const pd of v) {
        ret.push(new PokemonData(pd));
      }
      return ret;
    }

    if (k === "trainer") {
      return v ? new TrainerData(v) : null;
    }

    if (k === "modifiers" || k === "enemyModifiers") {
      const player = k === "modifiers";
      const ret: PersistentModifierData[] = [];
      if (v === null) {
        v = [];
      }
      for (const md of v) {
        if (md?.className === "ExpBalanceModifier") { // Temporarily limit EXP Balance until it gets reworked
          md.stackCount = Math.min(md.stackCount, 4);
        }
        if (md instanceof EnemyAttackStatusEffectChanceModifier && md.effect === StatusEffect.FREEZE || md.effect === StatusEffect.SLEEP) {
          continue;
        }
        ret.push(new PersistentModifierData(md, player));
      }
      return ret;
    }

    if (k === "arena") {
      return new ArenaData(v);
    }

    if (k === "challenges") {
      const ret: ChallengeData[] = [];
      if (v === null) {
        v = [];
      }
      for (const c of v) {
        ret.push(new ChallengeData(c));
      }
      return ret;
    }

    return v;
  }) as SessionSaveData;
  Save.slot = slotId
  Save.description = (slotId + 1) + " - "
  var challengeParts: ChallengeData[] | undefined[] = new Array(5)
  var nameParts: string[] | undefined[] = new Array(5)
  if (Save.challenges != undefined) {
    for (var i = 0; i < Save.challenges.length; i++) {
      switch (Save.challenges[i].id) {
        case Challenges.SINGLE_TYPE:
          challengeParts[0] = Save.challenges[i]
          nameParts[1] = Save.challenges[i].toChallenge().getValue()
          nameParts[1] = nameParts[1][0].toUpperCase() + nameParts[1].substring(1)
          if (nameParts[1] == "unknown") {
            nameParts[1] = undefined
            challengeParts[1] = undefined
          }
          break;
        case Challenges.SINGLE_GENERATION:
          challengeParts[1] = Save.challenges[i]
          nameParts[0] = "Gen " + Save.challenges[i].value
          if (nameParts[0] == "Gen 0") {
            nameParts[0] = undefined
            challengeParts[0] = undefined
          }
          break;
        case Challenges.LOWER_MAX_STARTER_COST:
          challengeParts[2] = Save.challenges[i]
          nameParts[3] = (10 - challengeParts[0]!.value) + "cost"
          break;
        case Challenges.LOWER_STARTER_POINTS:
          challengeParts[3] = Save.challenges[i]
          nameParts[4] = (10 - challengeParts[0]!.value) + "pt"
          break;
        case Challenges.FRESH_START:
          challengeParts[4] = Save.challenges[i]
          nameParts[2] = "FS"
          break;
      }
    }
  }
  for (var i = 0; i < challengeParts.length; i++) {
    if (challengeParts[i] == undefined || challengeParts[i] == null) {
      challengeParts.splice(i, 1)
      i--
    }
  }
  for (var i = 0; i < nameParts.length; i++) {
    if (nameParts[i] == undefined || nameParts[i] == null || nameParts[i] == "") {
      nameParts.splice(i, 1)
      i--
    }
  }
  if (challengeParts.length == 1 && false) {
    switch (challengeParts[0]!.id) {
      case Challenges.SINGLE_TYPE:
        Save.description += "Mono " + challengeParts[0]!.toChallenge().getValue()
        break;
      case Challenges.SINGLE_GENERATION:
        Save.description += "Gen " + challengeParts[0]!.value
        break;
      case Challenges.LOWER_MAX_STARTER_COST:
        Save.description += "Max cost " + (10 - challengeParts[0]!.value)
        break;
      case Challenges.LOWER_STARTER_POINTS:
        Save.description += (10 - challengeParts[0]!.value) + "-point"
        break;
      case Challenges.FRESH_START:
        Save.description += "Fresh Start"
        break;
    }
  } else if (challengeParts.length == 0) {
    switch (Save.gameMode) {
      case GameModes.CLASSIC:
        Save.description += "Classic";
        break;
      case GameModes.ENDLESS:
        Save.description += "Endless";
        break;
      case GameModes.SPLICED_ENDLESS:
        Save.description += "Endless+";
        break;
      case GameModes.DAILY:
        Save.description += "Daily";
        break;
    }
  } else {
    Save.description += nameParts.join(" ")
  }
  Save.description += " (" + getBiomeName(Save.arena.biome) + " " + Save.waveIndex + ")"
  return Save;
}
// #endregion