import BattleScene, { PokeballCounts, bypassLogin } from "../battle-scene";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "../field/pokemon";
import { pokemonEvolutions, pokemonPrevolutions } from "../data/pokemon-evolutions";
import PokemonSpecies, { allSpecies, getPokemonSpecies, noStarterFormKeys, speciesStarters } from "../data/pokemon-species";
import * as Utils from "../utils";
import * as Overrides from "../overrides";
import PokemonData from "./pokemon-data";
import PersistentModifierData from "./modifier-data";
import ArenaData from "./arena-data";
import { Unlockables } from "./unlockables";
import { GameModes, getGameMode } from "../game-mode";
import { BattleType } from "../battle";
import TrainerData from "./trainer-data";
import { trainerConfigs } from "../data/trainer-config";
import { SettingKeys, resetSettings, setSetting } from "./settings/settings";
import { achvs } from "./achv";
import EggData from "./egg-data";
import { Egg } from "../data/egg";
import { VoucherType, vouchers } from "./voucher";
import { AES, enc } from "crypto-js";
import { Mode } from "../ui/ui";
import { clientSessionId, loggedInUser, updateUserInfo } from "../account";
import { Nature } from "../data/nature";
import { GameStats } from "./game-stats";
import { Tutorial } from "../tutorial";
import { speciesEggMoves } from "../data/egg-moves";
import { allMoves } from "../data/move";
import { TrainerVariant } from "../field/trainer";
import { OutdatedPhase, ReloadSessionPhase } from "#app/phases";
import { Variant, variantData } from "#app/data/variant";
import {setSettingGamepad, SettingGamepad, settingGamepadDefaults} from "./settings/settings-gamepad";
import {setSettingKeyboard, SettingKeyboard} from "#app/system/settings/settings-keyboard";
import { TerrainChangedEvent, WeatherChangedEvent } from "#app/events/arena.js";
import { EnemyAttackStatusEffectChanceModifier } from "../modifier/modifier";
import { StatusEffect } from "#app/data/status-effect.js";
import ChallengeData from "./challenge-data";
import { Device } from "#enums/devices";
import { GameDataType } from "#enums/game-data-type";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";

export const defaultStarterSpecies: Species[] = [
  Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE,
  Species.CHIKORITA, Species.CYNDAQUIL, Species.TOTODILE,
  Species.TREECKO, Species.TORCHIC, Species.MUDKIP,
  Species.TURTWIG, Species.CHIMCHAR, Species.PIPLUP,
  Species.SNIVY, Species.TEPIG, Species.OSHAWOTT,
  Species.CHESPIN, Species.FENNEKIN, Species.FROAKIE,
  Species.ROWLET, Species.LITTEN, Species.POPPLIO,
  Species.GROOKEY, Species.SCORBUNNY, Species.SOBBLE,
  Species.SPRIGATITO, Species.FUECOCO, Species.QUAXLY
];

const saveKey = "x0i2O7WRiANTqPmZ"; // Temporary; secure encryption is not yet necessary

export function getDataTypeKey(dataType: GameDataType, slotId: integer = 0): string {
  switch (dataType) {
  case GameDataType.SYSTEM:
    return "data";
  case GameDataType.SESSION:
    let ret = "sessionData";
    if (slotId) {
      ret += slotId;
    }
    return ret;
  case GameDataType.SETTINGS:
    return "settings";
  case GameDataType.TUTORIALS:
    return "tutorials";
  case GameDataType.SEEN_DIALOGUES:
    return "seenDialogues";
  }
}

export function encrypt(data: string, bypassLogin: boolean): string {
  return (bypassLogin
    ? (data: string) => btoa(data)
    : (data: string) => AES.encrypt(data, saveKey))(data);
}

export function decrypt(data: string, bypassLogin: boolean): string {
  return (bypassLogin
    ? (data: string) => atob(data)
    : (data: string) => AES.decrypt(data, saveKey).toString(enc.Utf8))(data);
}

interface SystemSaveData {
  trainerId: integer;
  secretId: integer;
  gender: PlayerGender;
  dexData: DexData;
  starterData: StarterData;
  gameStats: GameStats;
  unlocks: Unlocks;
  achvUnlocks: AchvUnlocks;
  voucherUnlocks: VoucherUnlocks;
  voucherCounts: VoucherCounts;
  eggs: EggData[];
  gameVersion: string;
  timestamp: integer;
  eggPity: integer[];
  unlockPity: integer[];
}

export interface SessionSaveData {
  seed: string;
  playTime: integer;
  gameMode: GameModes;
  party: PokemonData[];
  enemyParty: PokemonData[];
  modifiers: PersistentModifierData[];
  enemyModifiers: PersistentModifierData[];
  arena: ArenaData;
  pokeballCounts: PokeballCounts;
  money: integer;
  score: integer;
  waveIndex: integer;
  battleType: BattleType;
  trainer: TrainerData;
  gameVersion: string;
  timestamp: integer;
  challenges: ChallengeData[];
}

interface Unlocks {
  [key: integer]: boolean;
}

interface AchvUnlocks {
  [key: string]: integer
}

interface VoucherUnlocks {
  [key: string]: integer
}

export interface VoucherCounts {
    [type: string]: integer;
}

export interface DexData {
  [key: integer]: DexEntry
}

export interface DexEntry {
  seenAttr: bigint;
  caughtAttr: bigint;
  natureAttr: integer,
  seenCount: integer;
  caughtCount: integer;
  hatchedCount: integer;
  ivs: integer[];
}

export const DexAttr = {
  NON_SHINY: 1n,
  SHINY: 2n,
  MALE: 4n,
  FEMALE: 8n,
  DEFAULT_VARIANT: 16n,
  VARIANT_2: 32n,
  VARIANT_3: 64n,
  DEFAULT_FORM: 128n
};

export interface DexAttrProps {
  shiny: boolean;
  female: boolean;
  variant: Variant;
  formIndex: integer;
}

export const AbilityAttr = {
  ABILITY_1: 1,
  ABILITY_2: 2,
  ABILITY_HIDDEN: 4
};

export type StarterMoveset = [ Moves ] | [ Moves, Moves ] | [ Moves, Moves, Moves ] | [ Moves, Moves, Moves, Moves ];

export interface StarterFormMoveData {
  [key: integer]: StarterMoveset
}

export interface StarterMoveData {
  [key: integer]: StarterMoveset | StarterFormMoveData
}

export interface StarterAttributes {
  nature?: integer;
  ability?: integer;
  variant?: integer;
  form?: integer;
  female?: boolean;
}

export interface StarterPreferences {
  [key: integer]: StarterAttributes;
}

// the latest data saved/loaded for the Starter Preferences. Required to reduce read/writes. Initialize as "{}", since this is the default value and no data needs to be stored if present.
// if they ever add private static variables, move this into StarterPrefs
const StarterPrefers_DEFAULT : string = "{}";
let StarterPrefers_private_latest : string = StarterPrefers_DEFAULT;

// This is its own class as StarterPreferences...
// - don't need to be loaded on startup
// - isn't stored with other data
// - don't require to be encrypted
// - shouldn't require calls outside of the starter selection
export class StarterPrefs {
  // called on starter selection show once
  static load(): StarterPreferences {
    return JSON.parse(
      StarterPrefers_private_latest = (localStorage.getItem(`starterPrefs_${loggedInUser?.username}`) || StarterPrefers_DEFAULT)
    );
  }

  // called on starter selection clear, always
  static save(prefs: StarterPreferences): void {
    const pStr : string = JSON.stringify(prefs);
    if (pStr !== StarterPrefers_private_latest) {
      // something changed, store the update
      localStorage.setItem(`starterPrefs_${loggedInUser?.username}`, pStr);
    }
  }
}

export interface StarterDataEntry {
  moveset: StarterMoveset | StarterFormMoveData;
  eggMoves: integer;
  candyCount: integer;
  friendship: integer;
  abilityAttr: integer;
  passiveAttr: integer;
  valueReduction: integer;
  classicWinCount: integer;
}

export interface StarterData {
  [key: integer]: StarterDataEntry
}

export interface TutorialFlags {
  [key: string]: boolean
}

export interface SeenDialogues {
  [key: string]: boolean;
}

const systemShortKeys = {
  seenAttr: "$sa",
  caughtAttr: "$ca",
  natureAttr: "$na",
  seenCount: "$s" ,
  caughtCount: "$c",
  hatchedCount: "$hc",
  ivs: "$i",
  moveset: "$m",
  eggMoves: "$em",
  candyCount: "$x",
  friendship: "$f",
  abilityAttr: "$a",
  passiveAttr: "$pa",
  valueReduction: "$vr",
  classicWinCount: "$wc"
};

export class GameData {
  private scene: BattleScene;

  public trainerId: integer;
  public secretId: integer;

  public gender: PlayerGender;

  public dexData: DexData;
  private defaultDexData: DexData;

  public starterData: StarterData;

  public gameStats: GameStats;

  public unlocks: Unlocks;

  public achvUnlocks: AchvUnlocks;

  public voucherUnlocks: VoucherUnlocks;
  public voucherCounts: VoucherCounts;
  public eggs: Egg[];
  public eggPity: integer[];
  public unlockPity: integer[];

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.loadSettings();
    this.loadGamepadSettings();
    this.loadMappingConfigs();
    this.trainerId = Utils.randInt(65536);
    this.secretId = Utils.randInt(65536);
    this.starterData = {};
    this.gameStats = new GameStats();
    this.unlocks = {
      [Unlockables.ENDLESS_MODE]: false,
      [Unlockables.MINI_BLACK_HOLE]: false,
      [Unlockables.SPLICED_ENDLESS_MODE]: false
    };
    this.achvUnlocks = {};
    this.voucherUnlocks = {};
    this.voucherCounts = {
      [VoucherType.REGULAR]: 0,
      [VoucherType.PLUS]: 0,
      [VoucherType.PREMIUM]: 0,
      [VoucherType.GOLDEN]: 0
    };
    this.eggs = [];
    this.eggPity = [0, 0, 0, 0];
    this.unlockPity = [0, 0, 0, 0];
    this.initDexData();
    this.initStarterData();
  }

  public getSystemSaveData(): SystemSaveData {
    return {
      trainerId: this.trainerId,
      secretId: this.secretId,
      gender: this.gender,
      dexData: this.dexData,
      starterData: this.starterData,
      gameStats: this.gameStats,
      unlocks: this.unlocks,
      achvUnlocks: this.achvUnlocks,
      voucherUnlocks: this.voucherUnlocks,
      voucherCounts: this.voucherCounts,
      eggs: this.eggs.map(e => new EggData(e)),
      gameVersion: this.scene.game.config.gameVersion,
      timestamp: new Date().getTime(),
      eggPity: this.eggPity.slice(0),
      unlockPity: this.unlockPity.slice(0)
    };
  }

  public saveSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.scene.ui.savingIcon.show();
      const data = this.getSystemSaveData();

      const maxIntAttrValue = Math.pow(2, 31);
      const systemData = JSON.stringify(data, (k: any, v: any) => typeof v === "bigint" ? v <= maxIntAttrValue ? Number(v) : v.toString() : v);

      localStorage.setItem(`data_${loggedInUser.username}`, encrypt(systemData, bypassLogin));

      if (!bypassLogin) {
        Utils.apiPost(`savedata/system/update?clientSessionId=${clientSessionId}`, systemData, undefined, true)
          .then(response => response.text())
          .then(error => {
            this.scene.ui.savingIcon.hide();
            if (error) {
              if (error.startsWith("client version out of date")) {
                this.scene.clearPhaseQueue();
                this.scene.unshiftPhase(new OutdatedPhase(this.scene));
              } else if (error.startsWith("session out of date")) {
                this.scene.clearPhaseQueue();
                this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
              }
              console.error(error);
              return resolve(false);
            }
            resolve(true);
          });
      } else {
        this.scene.ui.savingIcon.hide();

        resolve(true);
      }
    });
  }

  public loadSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      console.log("Client Session:", clientSessionId);

      if (bypassLogin && !localStorage.getItem(`data_${loggedInUser.username}`)) {
        return resolve(false);
      }

      if (!bypassLogin) {
        Utils.apiFetch(`savedata/system/get?clientSessionId=${clientSessionId}`, true)
          .then(response => response.text())
          .then(response => {
            if (!response.length || response[0] !== "{") {
              if (response.startsWith("sql: no rows in result set")) {
                this.scene.queueMessage("Save data could not be found. If this is a new account, you can safely ignore this message.", null, true);
                return resolve(true);
              } else if (response.indexOf("Too many connections") > -1) {
                this.scene.queueMessage("Too many people are trying to connect and the server is overloaded. Please try again later.", null, true);
                return resolve(false);
              }
              console.error(response);
              return resolve(false);
            }

            const cachedSystem = localStorage.getItem(`data_${loggedInUser.username}`);
            this.initSystem(response, cachedSystem ? AES.decrypt(cachedSystem, saveKey).toString(enc.Utf8) : null).then(resolve);
          });
      } else {
        this.initSystem(decrypt(localStorage.getItem(`data_${loggedInUser.username}`), bypassLogin)).then(resolve);
      }
    });
  }

  public initSystem(systemDataStr: string, cachedSystemDataStr?: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      try {
        let systemData = this.parseSystemData(systemDataStr);

        if (cachedSystemDataStr) {
          const cachedSystemData = this.parseSystemData(cachedSystemDataStr);
          if (cachedSystemData.timestamp > systemData.timestamp) {
            console.debug("Use cached system");
            systemData = cachedSystemData;
            systemDataStr = cachedSystemDataStr;
          } else {
            this.clearLocalData();
          }
        }

        console.debug(systemData);

        localStorage.setItem(`data_${loggedInUser.username}`, encrypt(systemDataStr, bypassLogin));

        /*const versions = [ this.scene.game.config.gameVersion, data.gameVersion || '0.0.0' ];

        if (versions[0] !== versions[1]) {
          const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
        }*/

        this.trainerId = systemData.trainerId;
        this.secretId = systemData.secretId;

        this.gender = systemData.gender;

        this.saveSetting(SettingKeys.Player_Gender, systemData.gender === PlayerGender.FEMALE ? 1 : 0);

        const initStarterData = !systemData.starterData;

        if (initStarterData) {
          this.initStarterData();

          if (systemData["starterMoveData"]) {
            const starterMoveData = systemData["starterMoveData"];
            for (const s of Object.keys(starterMoveData)) {
              this.starterData[s].moveset = starterMoveData[s];
            }
          }

          if (systemData["starterEggMoveData"]) {
            const starterEggMoveData = systemData["starterEggMoveData"];
            for (const s of Object.keys(starterEggMoveData)) {
              this.starterData[s].eggMoves = starterEggMoveData[s];
            }
          }

          this.migrateStarterAbilities(systemData, this.starterData);
        } else {
          if ([ "1.0.0", "1.0.1" ].includes(systemData.gameVersion)) {
            this.migrateStarterAbilities(systemData);
          }
          //this.fixVariantData(systemData);
          this.fixStarterData(systemData);
          // Migrate ability starter data if empty for caught species
          Object.keys(systemData.starterData).forEach(sd => {
            if (systemData.dexData[sd].caughtAttr && !systemData.starterData[sd].abilityAttr) {
              systemData.starterData[sd].abilityAttr = 1;
            }
          });
          this.starterData = systemData.starterData;
        }

        if (systemData.gameStats) {
          if (systemData.gameStats.legendaryPokemonCaught !== undefined && systemData.gameStats.subLegendaryPokemonCaught === undefined) {
            this.fixLegendaryStats(systemData);
          }
          this.gameStats = systemData.gameStats;
        }

        if (systemData.unlocks) {
          for (const key of Object.keys(systemData.unlocks)) {
            if (this.unlocks.hasOwnProperty(key)) {
              this.unlocks[key] = systemData.unlocks[key];
            }
          }
        }

        if (systemData.achvUnlocks) {
          for (const a of Object.keys(systemData.achvUnlocks)) {
            if (achvs.hasOwnProperty(a)) {
              this.achvUnlocks[a] = systemData.achvUnlocks[a];
            }
          }
        }

        if (systemData.voucherUnlocks) {
          for (const v of Object.keys(systemData.voucherUnlocks)) {
            if (vouchers.hasOwnProperty(v)) {
              this.voucherUnlocks[v] = systemData.voucherUnlocks[v];
            }
          }
        }

        if (systemData.voucherCounts) {
          Utils.getEnumKeys(VoucherType).forEach(key => {
            const index = VoucherType[key];
            this.voucherCounts[index] = systemData.voucherCounts[index] || 0;
          });
        }

        this.eggs = systemData.eggs
          ? systemData.eggs.map(e => e.toEgg())
          : [];

        this.eggPity = systemData.eggPity ? systemData.eggPity.slice(0) : [0, 0, 0, 0];
        this.unlockPity = systemData.unlockPity ? systemData.unlockPity.slice(0) : [0, 0, 0, 0];

        this.dexData = Object.assign(this.dexData, systemData.dexData);
        this.consolidateDexData(this.dexData);
        this.defaultDexData = null;

        if (initStarterData) {
          const starterIds = Object.keys(this.starterData).map(s => parseInt(s) as Species);
          for (const s of starterIds) {
            this.starterData[s].candyCount += this.dexData[s].caughtCount;
            this.starterData[s].candyCount += this.dexData[s].hatchedCount * 2;
            if (this.dexData[s].caughtAttr & DexAttr.SHINY) {
              this.starterData[s].candyCount += 4;
            }
          }
        }

        resolve(true);
      } catch (err) {
        console.error(err);
        resolve(false);
      }
    });
  }

  parseSystemData(dataStr: string): SystemSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
      if (k === "gameStats") {
        return new GameStats(v);
      } else if (k === "eggs") {
        const ret: EggData[] = [];
        if (v === null) {
          v = [];
        }
        for (const e of v) {
          ret.push(new EggData(e));
        }
        return ret;
      }

      return k.endsWith("Attr") && ![ "natureAttr", "abilityAttr", "passiveAttr" ].includes(k) ? BigInt(v) : v;
    }) as SystemSaveData;
  }

  convertSystemDataStr(dataStr: string, shorten: boolean = false): string {
    if (!shorten) {
      // Account for past key oversight
      dataStr = dataStr.replace(/\$pAttr/g, "$pa");
    }
    const fromKeys = shorten ? Object.keys(systemShortKeys) : Object.values(systemShortKeys);
    const toKeys = shorten ? Object.values(systemShortKeys) : Object.keys(systemShortKeys);
    for (const k in fromKeys) {
      dataStr = dataStr.replace(new RegExp(`${fromKeys[k].replace("$", "\\$")}`, "g"), toKeys[k]);
    }

    return dataStr;
  }

  public async verify(): Promise<boolean> {
    if (bypassLogin) {
      return true;
    }

    const response = await Utils.apiFetch(`savedata/system/verify?clientSessionId=${clientSessionId}`, true)
      .then(response => response.json());

    if (!response.valid) {
      this.scene.clearPhaseQueue();
      this.scene.unshiftPhase(new ReloadSessionPhase(this.scene, JSON.stringify(response.systemData)));
      this.clearLocalData();
      return false;
    }

    return true;
  }

  public clearLocalData(): void {
    if (bypassLogin) {
      return;
    }
    localStorage.removeItem(`data_${loggedInUser.username}`);
    for (let s = 0; s < 5; s++) {
      localStorage.removeItem(`sessionData${s ? s : ""}_${loggedInUser.username}`);
    }
  }

  /**
   * Saves a setting to localStorage
   * @param setting string ideally of SettingKeys
   * @param valueIndex index of the setting's option
   * @returns true
   */
  public saveSetting(setting: string, valueIndex: integer): boolean {
    let settings: object = {};
    if (localStorage.hasOwnProperty("settings")) {
      settings = JSON.parse(localStorage.getItem("settings"));
    }

    setSetting(this.scene, setting, valueIndex);

    settings[setting] = valueIndex;

    localStorage.setItem("settings", JSON.stringify(settings));

    return true;
  }

  /**
   * Saves the mapping configurations for a specified device.
   *
   * @param deviceName - The name of the device for which the configurations are being saved.
   * @param config - The configuration object containing custom mapping details.
   * @returns `true` if the configurations are successfully saved.
   */
  public saveMappingConfigs(deviceName: string, config): boolean {
    const key = deviceName.toLowerCase();  // Convert the gamepad name to lowercase to use as a key
    let mappingConfigs: object = {};  // Initialize an empty object to hold the mapping configurations
    if (localStorage.hasOwnProperty("mappingConfigs")) {// Check if 'mappingConfigs' exists in localStorage
      mappingConfigs = JSON.parse(localStorage.getItem("mappingConfigs"));
    }  // Parse the existing 'mappingConfigs' from localStorage
    if (!mappingConfigs[key]) {
      mappingConfigs[key] = {};
    }  // If there is no configuration for the given key, create an empty object for it
    mappingConfigs[key].custom = config.custom;  // Assign the custom configuration to the mapping configuration for the given key
    localStorage.setItem("mappingConfigs", JSON.stringify(mappingConfigs));  // Save the updated mapping configurations back to localStorage
    return true;  // Return true to indicate the operation was successful
  }

  /**
   * Loads the mapping configurations from localStorage and injects them into the input controller.
   *
   * @returns `true` if the configurations are successfully loaded and injected; `false` if no configurations are found in localStorage.
   *
   * @remarks
   * This method checks if the 'mappingConfigs' entry exists in localStorage. If it does not exist, the method returns `false`.
   * If 'mappingConfigs' exists, it parses the configurations and injects each configuration into the input controller
   * for the corresponding gamepad or device key. The method then returns `true` to indicate success.
   */
  public loadMappingConfigs(): boolean {
    if (!localStorage.hasOwnProperty("mappingConfigs")) {// Check if 'mappingConfigs' exists in localStorage
      return false;
    }  // If 'mappingConfigs' does not exist, return false

    const mappingConfigs = JSON.parse(localStorage.getItem("mappingConfigs"));  // Parse the existing 'mappingConfigs' from localStorage

    for (const key of Object.keys(mappingConfigs)) {// Iterate over the keys of the mapping configurations
      this.scene.inputController.injectConfig(key, mappingConfigs[key]);
    }  // Inject each configuration into the input controller for the corresponding key

    return true;  // Return true to indicate the operation was successful
  }

  public resetMappingToFactory(): boolean {
    if (!localStorage.hasOwnProperty("mappingConfigs")) {// Check if 'mappingConfigs' exists in localStorage
      return false;
    }  // If 'mappingConfigs' does not exist, return false
    localStorage.removeItem("mappingConfigs");
    this.scene.inputController.resetConfigs();
  }

  /**
   * Saves a gamepad setting to localStorage.
   *
   * @param setting - The gamepad setting to save.
   * @param valueIndex - The index of the value to set for the gamepad setting.
   * @returns `true` if the setting is successfully saved.
   *
   * @remarks
   * This method initializes an empty object for gamepad settings if none exist in localStorage.
   * It then updates the setting in the current scene and iterates over the default gamepad settings
   * to update the specified setting with the new value. Finally, it saves the updated settings back
   * to localStorage and returns `true` to indicate success.
   */
  public saveControlSetting(device: Device, localStoragePropertyName: string, setting: SettingGamepad|SettingKeyboard, settingDefaults, valueIndex: integer): boolean {
    let settingsControls: object = {};  // Initialize an empty object to hold the gamepad settings

    if (localStorage.hasOwnProperty(localStoragePropertyName)) {  // Check if 'settingsControls' exists in localStorage
      settingsControls = JSON.parse(localStorage.getItem(localStoragePropertyName));  // Parse the existing 'settingsControls' from localStorage
    }

    if (device === Device.GAMEPAD) {
      setSettingGamepad(this.scene, setting as SettingGamepad, valueIndex);  // Set the gamepad setting in the current scene
    } else if (device === Device.KEYBOARD) {
      setSettingKeyboard(this.scene, setting as SettingKeyboard, valueIndex);  // Set the keyboard setting in the current scene
    }

    Object.keys(settingDefaults).forEach(s => {  // Iterate over the default gamepad settings
      if (s === setting) {// If the current setting matches, update its value
        settingsControls[s] = valueIndex;
      }
    });

    localStorage.setItem(localStoragePropertyName, JSON.stringify(settingsControls));  // Save the updated gamepad settings back to localStorage

    return true;  // Return true to indicate the operation was successful
  }

  /**
   * Loads Settings from local storage if available
   * @returns true if succesful, false if not
   */
  private loadSettings(): boolean {
    resetSettings(this.scene);

    if (!localStorage.hasOwnProperty("settings")) {
      return false;
    }

    const settings = JSON.parse(localStorage.getItem("settings"));

    for (const setting of Object.keys(settings)) {
      setSetting(this.scene, setting, settings[setting]);
    }
  }

  private loadGamepadSettings(): boolean {
    Object.values(SettingGamepad).map(setting => setting as SettingGamepad).forEach(setting => setSettingGamepad(this.scene, setting, settingGamepadDefaults[setting]));

    if (!localStorage.hasOwnProperty("settingsGamepad")) {
      return false;
    }
    const settingsGamepad = JSON.parse(localStorage.getItem("settingsGamepad"));

    for (const setting of Object.keys(settingsGamepad)) {
      setSettingGamepad(this.scene, setting as SettingGamepad, settingsGamepad[setting]);
    }
  }

  public saveTutorialFlag(tutorial: Tutorial, flag: boolean): boolean {
    const key = getDataTypeKey(GameDataType.TUTORIALS);
    let tutorials: object = {};
    if (localStorage.hasOwnProperty(key)) {
      tutorials = JSON.parse(localStorage.getItem(key));
    }

    Object.keys(Tutorial).map(t => t as Tutorial).forEach(t => {
      const key = Tutorial[t];
      if (key === tutorial) {
        tutorials[key] = flag;
      } else {
        tutorials[key] ??= false;
      }
    });

    localStorage.setItem(key, JSON.stringify(tutorials));

    return true;
  }

  public getTutorialFlags(): TutorialFlags {
    const key = getDataTypeKey(GameDataType.TUTORIALS);
    const ret: TutorialFlags = {};
    Object.values(Tutorial).map(tutorial => tutorial as Tutorial).forEach(tutorial => ret[Tutorial[tutorial]] = false);

    if (!localStorage.hasOwnProperty(key)) {
      return ret;
    }

    const tutorials = JSON.parse(localStorage.getItem(key));

    for (const tutorial of Object.keys(tutorials)) {
      ret[tutorial] = tutorials[tutorial];
    }

    return ret;
  }

  public saveSeenDialogue(dialogue: string): boolean {
    const key = getDataTypeKey(GameDataType.SEEN_DIALOGUES);
    const dialogues: object = this.getSeenDialogues();

    dialogues[dialogue] = true;
    localStorage.setItem(key, JSON.stringify(dialogues));
    console.log("Dialogue saved as seen:", dialogue);

    return true;
  }

  public getSeenDialogues(): SeenDialogues {
    const key = getDataTypeKey(GameDataType.SEEN_DIALOGUES);
    const ret: SeenDialogues = {};

    if (!localStorage.hasOwnProperty(key)) {
      return ret;
    }

    const dialogues = JSON.parse(localStorage.getItem(key));

    for (const dialogue of Object.keys(dialogues)) {
      ret[dialogue] = dialogues[dialogue];
    }

    return ret;
  }

  private getSessionSaveData(scene: BattleScene): SessionSaveData {
    return {
      seed: scene.seed,
      playTime: scene.sessionPlayTime,
      gameMode: scene.gameMode.modeId,
      party: scene.getParty().map(p => new PokemonData(p)),
      enemyParty: scene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: scene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: scene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(scene.arena),
      pokeballCounts: scene.pokeballCounts,
      money: scene.money,
      score: scene.score,
      waveIndex: scene.currentBattle.waveIndex,
      battleType: scene.currentBattle.battleType,
      trainer: scene.currentBattle.battleType === BattleType.TRAINER ? new TrainerData(scene.currentBattle.trainer) : null,
      gameVersion: scene.game.config.gameVersion,
      timestamp: new Date().getTime(),
      challenges: scene.gameMode.challenges.map(c => new ChallengeData(c))
    } as SessionSaveData;
  }

  getSession(slotId: integer): Promise<SessionSaveData> {
    return new Promise(async (resolve, reject) => {
      if (slotId < 0) {
        return resolve(null);
      }
      const handleSessionData = async (sessionDataStr: string) => {
        try {
          const sessionData = this.parseSessionData(sessionDataStr);
          resolve(sessionData);
        } catch (err) {
          reject(err);
          return;
        }
      };

      if (!bypassLogin && !localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser.username}`)) {
        Utils.apiFetch(`savedata/session/get?slot=${slotId}&clientSessionId=${clientSessionId}`, true)
          .then(response => response.text())
          .then(async response => {
            if (!response.length || response[0] !== "{") {
              console.error(response);
              return resolve(null);
            }

            localStorage.setItem(`sessionData${slotId ? slotId : ""}_${loggedInUser.username}`, encrypt(response, bypassLogin));

            await handleSessionData(response);
          });
      } else {
        const sessionData = localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser.username}`);
        if (sessionData) {
          await handleSessionData(decrypt(sessionData, bypassLogin));
        } else {
          return resolve(null);
        }
      }
    });
  }

  loadSession(scene: BattleScene, slotId: integer, sessionData?: SessionSaveData): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const initSessionFromData = async (sessionData: SessionSaveData) => {
          console.debug(sessionData);

          scene.gameMode = getGameMode(sessionData.gameMode || GameModes.CLASSIC);
          if (sessionData.challenges) {
            scene.gameMode.challenges = sessionData.challenges.map(c => c.toChallenge());
          }

          scene.setSeed(sessionData.seed || scene.game.config.seed[0]);
          scene.resetSeed();

          console.log("Seed:", scene.seed);

          scene.sessionPlayTime = sessionData.playTime || 0;
          scene.lastSavePlayTime = 0;

          const loadPokemonAssets: Promise<void>[] = [];

          const party = scene.getParty();
          party.splice(0, party.length);

          for (const p of sessionData.party) {
            const pokemon = p.toPokemon(scene) as PlayerPokemon;
            pokemon.setVisible(false);
            loadPokemonAssets.push(pokemon.loadAssets());
            party.push(pokemon);
          }

          Object.keys(scene.pokeballCounts).forEach((key: string) => {
            scene.pokeballCounts[key] = sessionData.pokeballCounts[key] || 0;
          });
          if (Overrides.POKEBALL_OVERRIDE.active) {
            scene.pokeballCounts = Overrides.POKEBALL_OVERRIDE.pokeballs;
          }

          scene.money = sessionData.money || 0;
          scene.updateMoneyText();

          if (scene.money > this.gameStats.highestMoney) {
            this.gameStats.highestMoney = scene.money;
          }

          scene.score = sessionData.score;
          scene.updateScoreText();

          scene.newArena(sessionData.arena.biome);

          const battleType = sessionData.battleType || 0;
          const trainerConfig = sessionData.trainer ? trainerConfigs[sessionData.trainer.trainerType] : null;
          const battle = scene.newBattle(sessionData.waveIndex, battleType, sessionData.trainer, battleType === BattleType.TRAINER ? trainerConfig?.doubleOnly || sessionData.trainer?.variant === TrainerVariant.DOUBLE : sessionData.enemyParty.length > 1);
          battle.enemyLevels = sessionData.enemyParty.map(p => p.level);

          scene.arena.init();

          sessionData.enemyParty.forEach((enemyData, e) => {
            const enemyPokemon = enemyData.toPokemon(scene, battleType, e, sessionData.trainer?.variant === TrainerVariant.DOUBLE) as EnemyPokemon;
            battle.enemyParty[e] = enemyPokemon;
            if (battleType === BattleType.WILD) {
              battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
            }

            loadPokemonAssets.push(enemyPokemon.loadAssets());
          });

          scene.arena.weather = sessionData.arena.weather;
          scene.arena.eventTarget.dispatchEvent(new WeatherChangedEvent(null, scene.arena.weather?.weatherType, scene.arena.weather?.turnsLeft));

          scene.arena.terrain = sessionData.arena.terrain;
          scene.arena.eventTarget.dispatchEvent(new TerrainChangedEvent(null, scene.arena.terrain?.terrainType, scene.arena.terrain?.turnsLeft));
          // TODO
          //scene.arena.tags = sessionData.arena.tags;

          const modifiersModule = await import("../modifier/modifier");

          for (const modifierData of sessionData.modifiers) {
            const modifier = modifierData.toModifier(scene, modifiersModule[modifierData.className]);
            if (modifier) {
              scene.addModifier(modifier, true);
            }
          }

          scene.updateModifiers(true);

          for (const enemyModifierData of sessionData.enemyModifiers) {
            const modifier = enemyModifierData.toModifier(scene, modifiersModule[enemyModifierData.className]);
            if (modifier) {
              scene.addEnemyModifier(modifier, true);
            }
          }

          scene.updateModifiers(false);

          Promise.all(loadPokemonAssets).then(() => resolve(true));
        };
        if (sessionData) {
          initSessionFromData(sessionData);
        } else {
          this.getSession(slotId)
            .then(data => initSessionFromData(data))
            .catch(err => {
              reject(err);
              return;
            });
        }
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

  deleteSession(slotId: integer): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (bypassLogin) {
        localStorage.removeItem(`sessionData${this.scene.sessionSlotId ? this.scene.sessionSlotId : ""}_${loggedInUser.username}`);
        return resolve(true);
      }

      updateUserInfo().then(success => {
        if (success !== null && !success) {
          return resolve(false);
        }
        Utils.apiFetch(`savedata/session/delete?slot=${slotId}&clientSessionId=${clientSessionId}`, true).then(response => {
          if (response.ok) {
            loggedInUser.lastSessionSlot = -1;
            localStorage.removeItem(`sessionData${this.scene.sessionSlotId ? this.scene.sessionSlotId : ""}_${loggedInUser.username}`);
            resolve(true);
          }
          return response.text();
        }).then(error => {
          if (error) {
            if (error.startsWith("session out of date")) {
              this.scene.clearPhaseQueue();
              this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
            }
            console.error(error);
            resolve(false);
          }
          resolve(true);
        });
      });
    });
  }

  /* Defines a localStorage item 'daily' to check on clears, offline implementation of savedata/newclear API
  If a GameModes clear other than Daily is checked, newClear = true as usual
  If a Daily mode is cleared, checks if it was already cleared before, based on seed, and returns true only to new daily clear runs */
  offlineNewClear(scene: BattleScene): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const sessionData = this.getSessionSaveData(scene);
      const seed = sessionData.seed;
      let daily: string[] = [];

      if (sessionData.gameMode === GameModes.DAILY) {
        if (localStorage.hasOwnProperty("daily")) {
          daily = JSON.parse(atob(localStorage.getItem("daily")));
          if (daily.includes(seed)) {
            return resolve(false);
          } else {
            daily.push(seed);
            localStorage.setItem("daily", btoa(JSON.stringify(daily)));
            return resolve(true);
          }
        } else {
          daily.push(seed);
          localStorage.setItem("daily", btoa(JSON.stringify(daily)));
          return resolve(true);
        }
      } else {
        return resolve(true);
      }
    });
  }

  tryClearSession(scene: BattleScene, slotId: integer): Promise<[success: boolean, newClear: boolean]> {
    return new Promise<[boolean, boolean]>(resolve => {
      if (bypassLogin) {
        localStorage.removeItem(`sessionData${slotId ? slotId : ""}_${loggedInUser.username}`);
        return resolve([true, true]);
      }

      updateUserInfo().then(success => {
        if (success !== null && !success) {
          return resolve([false, false]);
        }
        const sessionData = this.getSessionSaveData(scene);
        Utils.apiPost(`savedata/session/clear?slot=${slotId}&trainerId=${this.trainerId}&secretId=${this.secretId}&clientSessionId=${clientSessionId}`, JSON.stringify(sessionData), undefined, true).then(response => {
          if (response.ok) {
            loggedInUser.lastSessionSlot = -1;
            localStorage.removeItem(`sessionData${this.scene.sessionSlotId ? this.scene.sessionSlotId : ""}_${loggedInUser.username}`);
          }
          return response.json();
        }).then(jsonResponse => {
          if (!jsonResponse.error) {
            return resolve([true, jsonResponse.success as boolean]);
          }
          if (jsonResponse && jsonResponse.error.startsWith("session out of date")) {
            this.scene.clearPhaseQueue();
            this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
          }
          console.error(jsonResponse);
          resolve([false, false]);
        });
      });
    });
  }

  parseSessionData(dataStr: string): SessionSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
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
  }

  saveAll(scene: BattleScene, skipVerification: boolean = false, sync: boolean = false, useCachedSession: boolean = false, useCachedSystem: boolean = false): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      Utils.executeIf(!skipVerification, updateUserInfo).then(success => {
        if (success !== null && !success) {
          return resolve(false);
        }
        if (sync) {
          this.scene.ui.savingIcon.show();
        }
        const sessionData = useCachedSession ? this.parseSessionData(decrypt(localStorage.getItem(`sessionData${scene.sessionSlotId ? scene.sessionSlotId : ""}_${loggedInUser.username}`), bypassLogin)) : this.getSessionSaveData(scene);

        const maxIntAttrValue = Math.pow(2, 31);
        const systemData = useCachedSystem ? this.parseSystemData(decrypt(localStorage.getItem(`data_${loggedInUser.username}`), bypassLogin)) : this.getSystemSaveData();

        const request = {
          system: systemData,
          session: sessionData,
          sessionSlotId: scene.sessionSlotId,
          clientSessionId: clientSessionId
        };

        localStorage.setItem(`data_${loggedInUser.username}`, encrypt(JSON.stringify(systemData, (k: any, v: any) => typeof v === "bigint" ? v <= maxIntAttrValue ? Number(v) : v.toString() : v), bypassLogin));

        localStorage.setItem(`sessionData${scene.sessionSlotId ? scene.sessionSlotId : ""}_${loggedInUser.username}`, encrypt(JSON.stringify(sessionData), bypassLogin));

        console.debug("Session data saved");

        if (!bypassLogin && sync) {
          Utils.apiPost("savedata/updateall", JSON.stringify(request, (k: any, v: any) => typeof v === "bigint" ? v <= maxIntAttrValue ? Number(v) : v.toString() : v), undefined, true)
            .then(response => response.text())
            .then(error => {
              if (sync) {
                this.scene.lastSavePlayTime = 0;
                this.scene.ui.savingIcon.hide();
              }
              if (error) {
                if (error.startsWith("client version out of date")) {
                  this.scene.clearPhaseQueue();
                  this.scene.unshiftPhase(new OutdatedPhase(this.scene));
                } else if (error.startsWith("session out of date")) {
                  this.scene.clearPhaseQueue();
                  this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
                }
                console.error(error);
                return resolve(false);
              }
              resolve(true);
            });
        } else {
          this.verify().then(success => {
            this.scene.ui.savingIcon.hide();
            resolve(success);
          });
        }
      });
    });
  }

  public tryExportData(dataType: GameDataType, slotId: integer = 0): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const dataKey: string = `${getDataTypeKey(dataType, slotId)}_${loggedInUser.username}`;
      const handleData = (dataStr: string) => {
        switch (dataType) {
        case GameDataType.SYSTEM:
          dataStr = this.convertSystemDataStr(dataStr, true);
          break;
        }
        const encryptedData = AES.encrypt(dataStr, saveKey);
        const blob = new Blob([ encryptedData.toString() ], {type: "text/json"});
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `${dataKey}.prsv`;
        link.click();
        link.remove();
      };
      if (!bypassLogin && dataType < GameDataType.SETTINGS) {
        Utils.apiFetch(`savedata/${dataType === GameDataType.SYSTEM ? "system" : "session"}/get?clientSessionId=${clientSessionId}${dataType === GameDataType.SESSION ? `&slot=${slotId}` : ""}`, true)
          .then(response => response.text())
          .then(response => {
            if (!response.length || response[0] !== "{") {
              console.error(response);
              resolve(false);
              return;
            }

            handleData(response);
            resolve(true);
          });
      } else {
        const data = localStorage.getItem(dataKey);
        if (data) {
          handleData(decrypt(data, bypassLogin));
        }
        resolve(!!data);
      }
    });
  }

  public importData(dataType: GameDataType, slotId: integer = 0): void {
    const dataKey = `${getDataTypeKey(dataType, slotId)}_${loggedInUser.username}`;

    let saveFile: any = document.getElementById("saveFile");
    if (saveFile) {
      saveFile.remove();
    }

    saveFile = document.createElement("input");
    saveFile.id = "saveFile";
    saveFile.type = "file";
    saveFile.accept = ".prsv";
    saveFile.style.display = "none";
    saveFile.addEventListener("change",
      e => {
        const reader = new FileReader();

        reader.onload = (_ => {
          return e => {
            let dataName: string;
            let dataStr = AES.decrypt(e.target.result.toString(), saveKey).toString(enc.Utf8);
            let valid = false;
            try {
              dataName = GameDataType[dataType].toLowerCase();
              switch (dataType) {
              case GameDataType.SYSTEM:
                dataStr = this.convertSystemDataStr(dataStr);
                const systemData = this.parseSystemData(dataStr);
                valid = !!systemData.dexData && !!systemData.timestamp;
                break;
              case GameDataType.SESSION:
                const sessionData = this.parseSessionData(dataStr);
                valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
                break;
              case GameDataType.SETTINGS:
              case GameDataType.TUTORIALS:
                valid = true;
                break;
              }
            } catch (ex) {
              console.error(ex);
            }

            const displayError = (error: string) => this.scene.ui.showText(error, null, () => this.scene.ui.showText(null, 0), Utils.fixedInt(1500));

            if (!valid) {
              return this.scene.ui.showText(`Your ${dataName} data could not be loaded. It may be corrupted.`, null, () => this.scene.ui.showText(null, 0), Utils.fixedInt(1500));
            }

            this.scene.ui.showText(`Your ${dataName} data will be overridden and the page will reload. Proceed?`, null, () => {
              this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
                localStorage.setItem(dataKey, encrypt(dataStr, bypassLogin));

                if (!bypassLogin && dataType < GameDataType.SETTINGS) {
                  updateUserInfo().then(success => {
                    if (!success[0]) {
                      return displayError(`Could not contact the server. Your ${dataName} data could not be imported.`);
                    }
                    let url: string;
                    if (dataType === GameDataType.SESSION) {
                      url = `savedata/session/update?slot=${slotId}&trainerId=${this.trainerId}&secretId=${this.secretId}&clientSessionId=${clientSessionId}`;
                    } else {
                      url = `savedata/system/update?trainerId=${this.trainerId}&secretId=${this.secretId}&clientSessionId=${clientSessionId}`;
                    }
                    Utils.apiPost(url, dataStr, undefined, true)
                      .then(response => response.text())
                      .then(error => {
                        if (error) {
                          console.error(error);
                          return displayError(`An error occurred while updating ${dataName} data. Please contact the administrator.`);
                        }
                        window.location = window.location;
                      });
                  });
                } else {
                  window.location = window.location;
                }
              }, () => {
                this.scene.ui.revertMode();
                this.scene.ui.showText(null, 0);
              }, false, -98);
            });
          };
        })((e.target as any).files[0]);

        reader.readAsText((e.target as any).files[0]);
      }
    );
    saveFile.click();
    /*(this.scene.plugins.get('rexfilechooserplugin') as FileChooserPlugin).open({ accept: '.prsv' })
      .then(result => {
    });*/
  }

  private initDexData(): void {
    const data: DexData = {};

    for (const species of allSpecies) {
      data[species.speciesId] = {
        seenAttr: 0n, caughtAttr: 0n, natureAttr: 0, seenCount: 0, caughtCount: 0, hatchedCount: 0, ivs: [ 0, 0, 0, 0, 0, 0 ]
      };
    }

    const defaultStarterAttr = DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.DEFAULT_VARIANT | DexAttr.DEFAULT_FORM;

    const defaultStarterNatures: Nature[] = [];

    this.scene.executeWithSeedOffset(() => {
      const neutralNatures = [ Nature.HARDY, Nature.DOCILE, Nature.SERIOUS, Nature.BASHFUL, Nature.QUIRKY ];
      for (let s = 0; s < defaultStarterSpecies.length; s++) {
        defaultStarterNatures.push(Utils.randSeedItem(neutralNatures));
      }
    }, 0, "default");

    for (let ds = 0; ds < defaultStarterSpecies.length; ds++) {
      const entry = data[defaultStarterSpecies[ds]] as DexEntry;
      entry.seenAttr = defaultStarterAttr;
      entry.caughtAttr = defaultStarterAttr;
      entry.natureAttr = Math.pow(2, defaultStarterNatures[ds] + 1);
      for (const i in entry.ivs) {
        entry.ivs[i] = 10;
      }
    }

    this.defaultDexData = Object.assign({}, data);
    this.dexData = data;
  }

  private initStarterData(): void {
    const starterData: StarterData = {};

    const starterSpeciesIds = Object.keys(speciesStarters).map(k => parseInt(k) as Species);

    for (const speciesId of starterSpeciesIds) {
      starterData[speciesId] = {
        moveset: null,
        eggMoves: 0,
        candyCount: 0,
        friendship: 0,
        abilityAttr: defaultStarterSpecies.includes(speciesId) ? AbilityAttr.ABILITY_1 : 0,
        passiveAttr: 0,
        valueReduction: 0,
        classicWinCount: 0
      };
    }

    this.starterData = starterData;
  }

  setPokemonSeen(pokemon: Pokemon, incrementCount: boolean = true, trainer: boolean = false): void {
    const dexEntry = this.dexData[pokemon.species.speciesId];
    dexEntry.seenAttr |= pokemon.getDexAttr();
    if (incrementCount) {
      dexEntry.seenCount++;
      this.gameStats.pokemonSeen++;
      if (!trainer && pokemon.species.subLegendary) {
        this.gameStats.subLegendaryPokemonSeen++;
      } else if (!trainer && pokemon.species.legendary) {
        this.gameStats.legendaryPokemonSeen++;
      } else if (!trainer && pokemon.species.mythical) {
        this.gameStats.mythicalPokemonSeen++;
      }
      if (!trainer && pokemon.isShiny()) {
        this.gameStats.shinyPokemonSeen++;
      }
    }
  }

  setPokemonCaught(pokemon: Pokemon, incrementCount: boolean = true, fromEgg: boolean = false): Promise<void> {
    return this.setPokemonSpeciesCaught(pokemon, pokemon.species, incrementCount, fromEgg);
  }

  setPokemonSpeciesCaught(pokemon: Pokemon, species: PokemonSpecies, incrementCount: boolean = true, fromEgg: boolean = false): Promise<void> {
    return new Promise<void>(resolve => {
      const dexEntry = this.dexData[species.speciesId];
      const caughtAttr = dexEntry.caughtAttr;
      const formIndex = pokemon.formIndex;
      if (noStarterFormKeys.includes(pokemon.getFormKey())) {
        pokemon.formIndex = 0;
      }
      const dexAttr = pokemon.getDexAttr();
      pokemon.formIndex = formIndex;
      dexEntry.caughtAttr |= dexAttr;
      if (speciesStarters.hasOwnProperty(species.speciesId)) {
        this.starterData[species.speciesId].abilityAttr |= pokemon.abilityIndex !== 1 || pokemon.species.ability2
          ? Math.pow(2, pokemon.abilityIndex)
          : AbilityAttr.ABILITY_HIDDEN;
      }
      dexEntry.natureAttr |= Math.pow(2, pokemon.nature + 1);

      const hasPrevolution = pokemonPrevolutions.hasOwnProperty(species.speciesId);
      const newCatch = !caughtAttr;
      const hasNewAttr = (caughtAttr & dexAttr) !== dexAttr;

      if (incrementCount) {
        if (!fromEgg) {
          dexEntry.caughtCount++;
          this.gameStats.pokemonCaught++;
          if (pokemon.species.subLegendary) {
            this.gameStats.subLegendaryPokemonCaught++;
          } else if (pokemon.species.legendary) {
            this.gameStats.legendaryPokemonCaught++;
          } else if (pokemon.species.mythical) {
            this.gameStats.mythicalPokemonCaught++;
          }
          if (pokemon.isShiny()) {
            this.gameStats.shinyPokemonCaught++;
          }
        } else {
          dexEntry.hatchedCount++;
          this.gameStats.pokemonHatched++;
          if (pokemon.species.subLegendary) {
            this.gameStats.subLegendaryPokemonHatched++;
          } else if (pokemon.species.legendary) {
            this.gameStats.legendaryPokemonHatched++;
          } else if (pokemon.species.mythical) {
            this.gameStats.mythicalPokemonHatched++;
          }
          if (pokemon.isShiny()) {
            this.gameStats.shinyPokemonHatched++;
          }
        }

        if (!hasPrevolution && (!pokemon.scene.gameMode.isDaily || hasNewAttr || fromEgg)) {
          this.addStarterCandy(species, (1 * (pokemon.isShiny() ? 5 * Math.pow(2, pokemon.variant || 0) : 1)) * (fromEgg || pokemon.isBoss() ? 2 : 1));
        }
      }

      const checkPrevolution = () => {
        if (hasPrevolution) {
          const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
          return this.setPokemonSpeciesCaught(pokemon, getPokemonSpecies(prevolutionSpecies), incrementCount, fromEgg).then(() => resolve());
        } else {
          resolve();
        }
      };

      if (newCatch && speciesStarters.hasOwnProperty(species.speciesId)) {
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.showText(`${species.name} has been\nadded as a starter!`, null, () => checkPrevolution(), null, true);
      } else {
        checkPrevolution();
      }
    });
  }

  incrementRibbonCount(species: PokemonSpecies, forStarter: boolean = false): integer {
    const speciesIdToIncrement: Species = species.getRootSpeciesId(forStarter);

    if (!this.starterData[speciesIdToIncrement].classicWinCount) {
      this.starterData[speciesIdToIncrement].classicWinCount = 0;
    }

    if (!this.starterData[speciesIdToIncrement].classicWinCount) {
      this.scene.gameData.gameStats.ribbonsOwned++;
    }

    const ribbonsInStats: integer = this.scene.gameData.gameStats.ribbonsOwned;

    if (ribbonsInStats >= 100) {
      this.scene.validateAchv(achvs._100_RIBBONS);
    }
    if (ribbonsInStats >= 75) {
      this.scene.validateAchv(achvs._75_RIBBONS);
    }
    if (ribbonsInStats >= 50) {
      this.scene.validateAchv(achvs._50_RIBBONS);
    }
    if (ribbonsInStats >= 25) {
      this.scene.validateAchv(achvs._25_RIBBONS);
    }
    if (ribbonsInStats >= 10) {
      this.scene.validateAchv(achvs._10_RIBBONS);
    }

    return ++this.starterData[speciesIdToIncrement].classicWinCount;
  }

  addStarterCandy(species: PokemonSpecies, count: integer): void {
    this.scene.candyBar.showStarterSpeciesCandy(species.speciesId, count);
    this.starterData[species.speciesId].candyCount += count;
  }

  setEggMoveUnlocked(species: PokemonSpecies, eggMoveIndex: integer): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const speciesId = species.speciesId;
      if (!speciesEggMoves.hasOwnProperty(speciesId) || !speciesEggMoves[speciesId][eggMoveIndex]) {
        resolve(false);
        return;
      }

      if (!this.starterData[speciesId].eggMoves) {
        this.starterData[speciesId].eggMoves = 0;
      }

      const value = Math.pow(2, eggMoveIndex);

      if (this.starterData[speciesId].eggMoves & value) {
        resolve(false);
        return;
      }

      this.starterData[speciesId].eggMoves |= value;

      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(`${eggMoveIndex === 3 ? "Rare " : ""}Egg Move unlocked: ${allMoves[speciesEggMoves[speciesId][eggMoveIndex]].name}`, null, () => resolve(true), null, true);
    });
  }

  updateSpeciesDexIvs(speciesId: Species, ivs: integer[]): void {
    let dexEntry: DexEntry;
    do {
      dexEntry = this.scene.gameData.dexData[speciesId];
      const dexIvs = dexEntry.ivs;
      for (let i = 0; i < dexIvs.length; i++) {
        if (dexIvs[i] < ivs[i]) {
          dexIvs[i] = ivs[i];
        }
      }
      if (dexIvs.filter(iv => iv === 31).length === 6) {
        this.scene.validateAchv(achvs.PERFECT_IVS);
      }
    } while (pokemonPrevolutions.hasOwnProperty(speciesId) && (speciesId = pokemonPrevolutions[speciesId]));
  }

  getSpeciesCount(dexEntryPredicate: (entry: DexEntry) => boolean): integer {
    const dexKeys = Object.keys(this.dexData);
    let speciesCount = 0;
    for (const s of dexKeys) {
      if (dexEntryPredicate(this.dexData[s])) {
        speciesCount++;
      }
    }
    return speciesCount;
  }

  getStarterCount(dexEntryPredicate: (entry: DexEntry) => boolean): integer {
    const starterKeys = Object.keys(speciesStarters);
    let starterCount = 0;
    for (const s of starterKeys) {
      const starterDexEntry = this.dexData[s];
      if (dexEntryPredicate(starterDexEntry)) {
        starterCount++;
      }
    }
    return starterCount;
  }

  getSpeciesDefaultDexAttr(species: PokemonSpecies, forSeen: boolean = false, optimistic: boolean = false): bigint {
    let ret = 0n;
    const dexEntry = this.dexData[species.speciesId];
    const attr = dexEntry.caughtAttr;
    ret |= optimistic
      ? attr & DexAttr.SHINY ? DexAttr.SHINY : DexAttr.NON_SHINY
      : attr & DexAttr.NON_SHINY || !(attr & DexAttr.SHINY) ? DexAttr.NON_SHINY : DexAttr.SHINY;
    ret |= attr & DexAttr.MALE || !(attr & DexAttr.FEMALE) ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= optimistic
      ? attr & DexAttr.SHINY ? attr & DexAttr.VARIANT_3 ? DexAttr.VARIANT_3 : attr & DexAttr.VARIANT_2 ? DexAttr.VARIANT_2 : DexAttr.DEFAULT_VARIANT : DexAttr.DEFAULT_VARIANT
      : attr & DexAttr.DEFAULT_VARIANT ? DexAttr.DEFAULT_VARIANT : attr & DexAttr.VARIANT_2 ? DexAttr.VARIANT_2 : attr & DexAttr.VARIANT_3 ? DexAttr.VARIANT_3 : DexAttr.DEFAULT_VARIANT;
    ret |= this.getFormAttr(this.getFormIndex(attr));
    return ret;
  }

  getSpeciesDexAttrProps(species: PokemonSpecies, dexAttr: bigint): DexAttrProps {
    const shiny = !(dexAttr & DexAttr.NON_SHINY);
    const female = !(dexAttr & DexAttr.MALE);
    const variant = dexAttr & DexAttr.DEFAULT_VARIANT ? 0 : dexAttr & DexAttr.VARIANT_2 ? 1 : dexAttr & DexAttr.VARIANT_3 ? 2 : 0;
    const formIndex = this.getFormIndex(dexAttr);

    return {
      shiny,
      female,
      variant,
      formIndex
    };
  }

  getStarterSpeciesDefaultAbilityIndex(species: PokemonSpecies): integer {
    const abilityAttr = this.starterData[species.speciesId].abilityAttr;
    return abilityAttr & AbilityAttr.ABILITY_1 ? 0 : !species.ability2 || abilityAttr & AbilityAttr.ABILITY_2 ? 1 : 2;
  }

  getSpeciesDefaultNature(species: PokemonSpecies): Nature {
    const dexEntry = this.dexData[species.speciesId];
    for (let n = 0; n < 25; n++) {
      if (dexEntry.natureAttr & Math.pow(2, n + 1)) {
        return n as Nature;
      }
    }
    return 0 as Nature;
  }

  getSpeciesDefaultNatureAttr(species: PokemonSpecies): integer {
    return Math.pow(2, this.getSpeciesDefaultNature(species));
  }

  getDexAttrLuck(dexAttr: bigint): integer {
    return dexAttr & DexAttr.SHINY ? dexAttr & DexAttr.VARIANT_3 ? 3 : dexAttr & DexAttr.VARIANT_2 ? 2 : 1 : 0;
  }

  getNaturesForAttr(natureAttr: integer): Nature[] {
    const ret: Nature[] = [];
    for (let n = 0; n < 25; n++) {
      if (natureAttr & Math.pow(2, n + 1)) {
        ret.push(n);
      }
    }
    return ret;
  }

  getSpeciesStarterValue(speciesId: Species): number {
    const baseValue = speciesStarters[speciesId];
    let value = baseValue;

    const decrementValue = (value: number) => {
      if (value > 1) {
        value--;
      } else {
        value /= 2;
      }
      return value;
    };

    for (let v = 0; v < this.starterData[speciesId].valueReduction; v++) {
      value = decrementValue(value);
    }

    return value;
  }

  getFormIndex(attr: bigint): integer {
    if (!attr || attr < DexAttr.DEFAULT_FORM) {
      return 0;
    }
    let f = 0;
    while (!(attr & this.getFormAttr(f))) {
      f++;
    }
    return f;
  }

  getFormAttr(formIndex: integer): bigint {
    return BigInt(Math.pow(2, 7 + formIndex));
  }

  consolidateDexData(dexData: DexData): void {
    for (const k of Object.keys(dexData)) {
      const entry = dexData[k] as DexEntry;
      if (!entry.hasOwnProperty("hatchedCount")) {
        entry.hatchedCount = 0;
      }
      if (!entry.hasOwnProperty("natureAttr") || (entry.caughtAttr && !entry.natureAttr)) {
        entry.natureAttr = this.defaultDexData[k].natureAttr || Math.pow(2, Utils.randInt(25, 1));
      }
    }
  }

  migrateStarterAbilities(systemData: SystemSaveData, initialStarterData?: StarterData): void {
    const starterIds = Object.keys(this.starterData).map(s => parseInt(s) as Species);
    const starterData = initialStarterData || systemData.starterData;
    const dexData = systemData.dexData;
    for (const s of starterIds) {
      const dexAttr = dexData[s].caughtAttr;
      starterData[s].abilityAttr = (dexAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
        | (dexAttr & DexAttr.VARIANT_2 ? AbilityAttr.ABILITY_2 : 0)
        | (dexAttr & DexAttr.VARIANT_3 ? AbilityAttr.ABILITY_HIDDEN : 0);
      if (dexAttr) {
        if (!(dexAttr & DexAttr.DEFAULT_VARIANT)) {
          dexData[s].caughtAttr ^= DexAttr.DEFAULT_VARIANT;
        }
        if (dexAttr & DexAttr.VARIANT_2) {
          dexData[s].caughtAttr ^= DexAttr.VARIANT_2;
        }
        if (dexAttr & DexAttr.VARIANT_3) {
          dexData[s].caughtAttr ^= DexAttr.VARIANT_3;
        }
      }
    }
  }

  fixVariantData(systemData: SystemSaveData): void {
    const starterIds = Object.keys(this.starterData).map(s => parseInt(s) as Species);
    const starterData = systemData.starterData;
    const dexData = systemData.dexData;
    if (starterIds.find(id => (dexData[id].caughtAttr & DexAttr.VARIANT_2 || dexData[id].caughtAttr & DexAttr.VARIANT_3) && !variantData[id])) {
      for (const s of starterIds) {
        const species = getPokemonSpecies(s);
        if (variantData[s]) {
          const tempCaughtAttr = dexData[s].caughtAttr;
          let seenVariant2 = false;
          let seenVariant3 = false;
          const checkEvoSpecies = (es: Species) => {
            seenVariant2 ||= !!(dexData[es].seenAttr & DexAttr.VARIANT_2);
            seenVariant3 ||= !!(dexData[es].seenAttr & DexAttr.VARIANT_3);
            if (pokemonEvolutions.hasOwnProperty(es)) {
              for (const pe of pokemonEvolutions[es]) {
                checkEvoSpecies(pe.speciesId);
              }
            }
          };
          checkEvoSpecies(s);
          if (dexData[s].caughtAttr & DexAttr.VARIANT_2 && !seenVariant2) {
            dexData[s].caughtAttr ^= DexAttr.VARIANT_2;
          }
          if (dexData[s].caughtAttr & DexAttr.VARIANT_3 && !seenVariant3) {
            dexData[s].caughtAttr ^= DexAttr.VARIANT_3;
          }
          starterData[s].abilityAttr = (tempCaughtAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_2 && species.ability2 ? AbilityAttr.ABILITY_2 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_3 && species.abilityHidden ? AbilityAttr.ABILITY_HIDDEN : 0);
        } else {
          const tempCaughtAttr = dexData[s].caughtAttr;
          if (dexData[s].caughtAttr & DexAttr.VARIANT_2) {
            dexData[s].caughtAttr ^= DexAttr.VARIANT_2;
          }
          if (dexData[s].caughtAttr & DexAttr.VARIANT_3) {
            dexData[s].caughtAttr ^= DexAttr.VARIANT_3;
          }
          starterData[s].abilityAttr = (tempCaughtAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_2 && species.ability2 ? AbilityAttr.ABILITY_2 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_3 && species.abilityHidden ? AbilityAttr.ABILITY_HIDDEN : 0);
        }
      }
    }
  }

  fixStarterData(systemData: SystemSaveData): void {
    for (const starterId of defaultStarterSpecies) {
      systemData.starterData[starterId].abilityAttr |= AbilityAttr.ABILITY_1;
    }
  }

  fixLegendaryStats(systemData: SystemSaveData): void {
    systemData.gameStats.subLegendaryPokemonSeen = 0;
    systemData.gameStats.subLegendaryPokemonCaught = 0;
    systemData.gameStats.subLegendaryPokemonHatched = 0;
    allSpecies.filter(s => s.subLegendary).forEach(s => {
      const dexEntry = systemData.dexData[s.speciesId];
      systemData.gameStats.subLegendaryPokemonSeen += dexEntry.seenCount;
      systemData.gameStats.legendaryPokemonSeen = Math.max(systemData.gameStats.legendaryPokemonSeen - dexEntry.seenCount, 0);
      systemData.gameStats.subLegendaryPokemonCaught += dexEntry.caughtCount;
      systemData.gameStats.legendaryPokemonCaught = Math.max(systemData.gameStats.legendaryPokemonCaught - dexEntry.caughtCount, 0);
      systemData.gameStats.subLegendaryPokemonHatched += dexEntry.hatchedCount;
      systemData.gameStats.legendaryPokemonHatched = Math.max(systemData.gameStats.legendaryPokemonHatched - dexEntry.hatchedCount, 0);
    });
    systemData.gameStats.subLegendaryPokemonSeen = Math.max(systemData.gameStats.subLegendaryPokemonSeen, systemData.gameStats.subLegendaryPokemonCaught);
    systemData.gameStats.legendaryPokemonSeen = Math.max(systemData.gameStats.legendaryPokemonSeen, systemData.gameStats.legendaryPokemonCaught);
    systemData.gameStats.mythicalPokemonSeen = Math.max(systemData.gameStats.mythicalPokemonSeen, systemData.gameStats.mythicalPokemonCaught);
  }
}
