import { pokerogueApi } from "#api/pokerogue-api";
import { clientSessionId, loggedInUser, updateUserInfo } from "#app/account";
import type { PokeballCounts } from "#app/battle-scene";
import { defaultStarterSpecies, saveKey } from "#app/constants";
import { getGameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { bypassLogin } from "#app/global-vars/bypass-login";
import Overrides from "#app/overrides";
import { Tutorial } from "#app/tutorial";
import { speciesEggMoves } from "#balance/egg-moves";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import { speciesStarterCosts } from "#balance/starters";
import { EntryHazardTag } from "#data/arena-tag";
import { allMoves, allSpecies } from "#data/data-lists";
import type { Egg } from "#data/egg";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import { loadPositionalTag } from "#data/positional-tags/load-positional-tag";
import { TerrainType } from "#data/terrain";
import { AbilityAttr } from "#enums/ability-attr";
import { BattleType } from "#enums/battle-type";
import { ChallengeType } from "#enums/challenge-type";
import { Device } from "#enums/devices";
import { DexAttr } from "#enums/dex-attr";
import { GameDataType } from "#enums/game-data-type";
import { GameModes } from "#enums/game-modes";
import type { MoveId } from "#enums/move-id";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PlayerGender } from "#enums/player-gender";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerVariant } from "#enums/trainer-variant";
import { UiMode } from "#enums/ui-mode";
import { Unlockables } from "#enums/unlockables";
import { WeatherType } from "#enums/weather-type";
import { TagAddedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#events/arena";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
// biome-ignore lint/performance/noNamespaceImport: Something weird is going on here and I don't want to touch it
import * as Modifier from "#modifiers/modifier";
import { MysteryEncounterSaveData } from "#mystery-encounters/mystery-encounter-save-data";
import type { Variant } from "#sprites/variant";
import { achvs } from "#system/achv";
import { ArenaData, type SerializedArenaData } from "#system/arena-data";
import { ChallengeData } from "#system/challenge-data";
import { EggData } from "#system/egg-data";
import { GameStats } from "#system/game-stats";
import { ModifierData as PersistentModifierData } from "#system/modifier-data";
import { PokemonData } from "#system/pokemon-data";
import { RibbonData } from "#system/ribbons/ribbon-data";
import { resetSettings, SettingKeys, setSetting } from "#system/settings";
import { SettingGamepad, setSettingGamepad, settingGamepadDefaults } from "#system/settings-gamepad";
import type { SettingKeyboard } from "#system/settings-keyboard";
import { setSettingKeyboard } from "#system/settings-keyboard";
import { TrainerData } from "#system/trainer-data";
import {
  applySessionVersionMigration,
  applySettingsVersionMigration,
  applySystemVersionMigration,
} from "#system/version-migration/version-converter";
import { VoucherType, vouchers } from "#system/voucher";
import { trainerConfigs } from "#trainers/trainer-config";
import type { DexData, DexEntry } from "#types/dex-data";
import { RUN_HISTORY_LIMIT } from "#ui/handlers/run-history-ui-handler";
import { applyChallenges } from "#utils/challenge-utils";
import { executeIf, fixedInt, isLocal, NumberHolder, randInt, randSeedItem } from "#utils/common";
import { decrypt, encrypt } from "#utils/data";
import { getEnumKeys } from "#utils/enums";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { isBeta } from "#utils/utility-vars";
import { AES, enc } from "crypto-js";
import i18next from "i18next";

function getDataTypeKey(dataType: GameDataType, slotId = 0): string {
  switch (dataType) {
    case GameDataType.SYSTEM:
      return "data";
    case GameDataType.SESSION: {
      let ret = "sessionData";
      if (slotId) {
        ret += slotId;
      }
      return ret;
    }
    case GameDataType.SETTINGS:
      return "settings";
    case GameDataType.TUTORIALS:
      return "tutorials";
    case GameDataType.SEEN_DIALOGUES:
      return "seenDialogues";
    case GameDataType.RUN_HISTORY:
      return "runHistoryData";
  }
}

// TODO: Move all these exported interfaces to @types
export interface SystemSaveData {
  trainerId: number;
  secretId: number;
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
  timestamp: number;
  eggPity: number[];
  unlockPity: number[];
}

export interface SessionSaveData {
  seed: string;
  playTime: number;
  gameMode: GameModes;
  party: PokemonData[];
  enemyParty: PokemonData[];
  modifiers: PersistentModifierData[];
  enemyModifiers: PersistentModifierData[];
  arena: ArenaData;
  pokeballCounts: PokeballCounts;
  money: number;
  score: number;
  waveIndex: number;
  battleType: BattleType;
  trainer: TrainerData;
  gameVersion: string;
  /** The player-chosen name of the run */
  name: string;
  timestamp: number;
  challenges: ChallengeData[];
  mysteryEncounterType: MysteryEncounterType | -1; // Only defined when current wave is ME,
  mysteryEncounterSaveData: MysteryEncounterSaveData;
  /**
   * Counts the amount of pokemon fainted in your party during the current arena encounter.
   */
  playerFaints: number;
}

interface Unlocks {
  [key: number]: boolean;
}

export interface AchvUnlocks {
  [key: string]: number;
}

export interface VoucherUnlocks {
  [key: string]: number;
}

export interface VoucherCounts {
  [type: string]: number;
}

export type StarterMoveset = [MoveId] | [MoveId, MoveId] | [MoveId, MoveId, MoveId] | [MoveId, MoveId, MoveId, MoveId];

export interface StarterFormMoveData {
  [key: number]: StarterMoveset;
}

export interface StarterMoveData {
  [key: number]: StarterMoveset | StarterFormMoveData;
}

export interface StarterAttributes {
  nature?: number;
  ability?: number;
  variant?: number;
  form?: number;
  female?: boolean;
  shiny?: boolean;
  favorite?: boolean;
  nickname?: string;
  tera?: PokemonType;
}

export interface DexAttrProps {
  shiny: boolean;
  female: boolean;
  variant: Variant;
  formIndex: number;
}

export type RunHistoryData = Record<number, RunEntry>;

export interface RunEntry {
  entry: SessionSaveData;
  isVictory: boolean;
  /*Automatically set to false at the moment - implementation TBD*/
  isFavorite: boolean;
}

export interface StarterDataEntry {
  moveset: StarterMoveset | StarterFormMoveData | null;
  eggMoves: number;
  candyCount: number;
  friendship: number;
  abilityAttr: number;
  passiveAttr: number;
  valueReduction: number;
  classicWinCount: number;
}

export interface StarterData {
  [key: number]: StarterDataEntry;
}

// TODO: Rework into a bitmask
export type TutorialFlags = {
  [key in Tutorial]: boolean;
};

// TODO: Rework into a bitmask
export interface SeenDialogues {
  [key: string]: boolean;
}

const systemShortKeys = {
  seenAttr: "$sa",
  caughtAttr: "$ca",
  natureAttr: "$na",
  seenCount: "$s",
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
  classicWinCount: "$wc",
};

export class GameData {
  public trainerId: number;
  public secretId: number;

  public gender: PlayerGender;

  public dexData: DexData;
  private defaultDexData: DexData | null;

  public starterData: StarterData;

  public gameStats: GameStats;
  public runHistory: RunHistoryData;

  public unlocks: Unlocks;

  public achvUnlocks: AchvUnlocks;

  public voucherUnlocks: VoucherUnlocks;
  public voucherCounts: VoucherCounts;
  public eggs: Egg[];
  public eggPity: number[];
  public unlockPity: number[];

  constructor() {
    this.loadSettings();
    this.loadGamepadSettings();
    this.loadMappingConfigs();
    this.trainerId = randInt(65536);
    this.secretId = randInt(65536);
    this.starterData = {};
    this.gameStats = new GameStats();
    this.runHistory = {};
    this.unlocks = {
      [Unlockables.ENDLESS_MODE]: false,
      [Unlockables.MINI_BLACK_HOLE]: false,
      [Unlockables.SPLICED_ENDLESS_MODE]: false,
      [Unlockables.EVIOLITE]: false,
    };
    this.achvUnlocks = {};
    this.voucherUnlocks = {};
    this.voucherCounts = {
      [VoucherType.REGULAR]: 0,
      [VoucherType.PLUS]: 0,
      [VoucherType.PREMIUM]: 0,
      [VoucherType.GOLDEN]: 0,
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
      gameVersion: globalScene.game.config.gameVersion,
      timestamp: Date.now(),
      eggPity: this.eggPity.slice(0),
      unlockPity: this.unlockPity.slice(0),
    };
  }

  /**
   * Checks if an `Unlockable` has been unlocked.
   * @param unlockable The Unlockable to check
   * @returns `true` if the player has unlocked this `Unlockable` or an override has enabled it
   */
  public isUnlocked(unlockable: Unlockables): boolean {
    if (Overrides.ITEM_UNLOCK_OVERRIDE.includes(unlockable)) {
      return true;
    }
    return this.unlocks[unlockable];
  }

  public saveSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      globalScene.ui.savingIcon.show();
      const data = this.getSystemSaveData();

      const maxIntAttrValue = 0x80000000;
      const systemData = JSON.stringify(data, (_k: any, v: any) =>
        typeof v === "bigint" ? (v <= maxIntAttrValue ? Number(v) : v.toString()) : v,
      );

      localStorage.setItem(`data_${loggedInUser?.username}`, encrypt(systemData, bypassLogin));

      if (!bypassLogin) {
        pokerogueApi.savedata.system.update({ clientSessionId }, systemData).then(error => {
          globalScene.ui.savingIcon.hide();
          if (error) {
            if (error.startsWith("session out of date")) {
              globalScene.phaseManager.clearPhaseQueue();
              globalScene.phaseManager.unshiftNew("ReloadSessionPhase");
            }
            console.error(error);
            return resolve(false);
          }
          resolve(true);
        });
      } else {
        globalScene.ui.savingIcon.hide();

        resolve(true);
      }
    });
  }

  public loadSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      console.log("Client Session:", clientSessionId);

      if (bypassLogin && !localStorage.getItem(`data_${loggedInUser?.username}`)) {
        return resolve(false);
      }

      if (!bypassLogin) {
        pokerogueApi.savedata.system.get({ clientSessionId }).then(saveDataOrErr => {
          if (
            typeof saveDataOrErr === "number"
            || !saveDataOrErr
            || saveDataOrErr.length === 0
            || saveDataOrErr[0] !== "{"
          ) {
            if (saveDataOrErr === 404) {
              globalScene.phaseManager.queueMessage(
                "Save data could not be found. If this is a new account, you can safely ignore this message.",
                null,
                true,
              );
              return resolve(true);
            }
            if (typeof saveDataOrErr === "string" && saveDataOrErr?.includes("Too many connections")) {
              globalScene.phaseManager.queueMessage(
                "Too many people are trying to connect and the server is overloaded. Please try again later.",
                null,
                true,
              );
              return resolve(false);
            }
            return resolve(false);
          }

          const cachedSystem = localStorage.getItem(`data_${loggedInUser?.username}`);
          this.initSystem(
            saveDataOrErr,
            cachedSystem ? AES.decrypt(cachedSystem, saveKey).toString(enc.Utf8) : undefined,
          ).then(resolve);
        });
      } else {
        this.initSystem(decrypt(localStorage.getItem(`data_${loggedInUser?.username}`)!, bypassLogin)).then(resolve); // TODO: is this bang correct?
      }
    });
  }

  public initSystem(systemDataStr: string, cachedSystemDataStr?: string): Promise<boolean> {
    const { promise, resolve } = Promise.withResolvers<boolean>();
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

      if (isLocal || isBeta) {
        try {
          console.debug(
            this.parseSystemData(JSON.stringify(systemData, (_, v: any) => (typeof v === "bigint" ? v.toString() : v))),
          );
        } catch (err) {
          console.debug("Attempt to log system data failed:", err);
        }
      }

      localStorage.setItem(`data_${loggedInUser?.username}`, encrypt(systemDataStr, bypassLogin));

      const lsItemKey = `runHistoryData_${loggedInUser?.username}`;
      const lsItem = localStorage.getItem(lsItemKey);
      if (!lsItem) {
        localStorage.setItem(lsItemKey, "");
      }

      applySystemVersionMigration(systemData);

      this.trainerId = systemData.trainerId;
      this.secretId = systemData.secretId;

      this.gender = systemData.gender;

      this.saveSetting(SettingKeys.Player_Gender, systemData.gender === PlayerGender.FEMALE ? 1 : 0);

      if (!systemData.starterData) {
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

        const starterIds = Object.keys(this.starterData).map(s => Number.parseInt(s) as SpeciesId);
        for (const s of starterIds) {
          this.starterData[s].candyCount += systemData.dexData[s].caughtCount;
          this.starterData[s].candyCount += systemData.dexData[s].hatchedCount * 2;
          if (systemData.dexData[s].caughtAttr & DexAttr.SHINY) {
            this.starterData[s].candyCount += 4;
          }
        }
      } else {
        this.starterData = systemData.starterData;
      }

      if (systemData.gameStats) {
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
        getEnumKeys(VoucherType).forEach(key => {
          const index = VoucherType[key];
          this.voucherCounts[index] = systemData.voucherCounts[index] || 0;
        });
      }

      this.eggs = systemData.eggs ? systemData.eggs.map(e => e.toEgg()) : [];

      this.eggPity = systemData.eggPity ? systemData.eggPity.slice(0) : [0, 0, 0, 0];
      this.unlockPity = systemData.unlockPity ? systemData.unlockPity.slice(0) : [0, 0, 0, 0];

      this.dexData = Object.assign(this.dexData, systemData.dexData);
      this.consolidateDexData(this.dexData);
      this.defaultDexData = null;

      resolve(true);
    } catch (err) {
      console.error(err);
      resolve(false);
    }
    return promise;
  }

  /**
   * Retrieves current run history data, organized by time stamp.
   * At the moment, only retrievable from locale cache
   */
  async getRunHistoryData(): Promise<RunHistoryData> {
    if (!isLocal) {
      /**
       * Networking Code DO NOT DELETE!
       * Note: Might have to be migrated to `pokerogue-api.ts`
       *
      const response = await Utils.apiFetch("savedata/runHistory", true);
      const data = await response.json();
      */
      const lsItemKey = `runHistoryData_${loggedInUser?.username}`;
      const lsItem = localStorage.getItem(lsItemKey);
      if (lsItem) {
        const cachedResponse = lsItem;
        if (cachedResponse) {
          const runHistory = JSON.parse(decrypt(cachedResponse, bypassLogin));
          return runHistory;
        }
        return {};
        // check to see whether cachedData or serverData is more up-to-date
        /**
       * Networking Code DO NOT DELETE!
       *
        if ( Object.keys(cachedRHData).length >= Object.keys(data).length ) {
          return cachedRHData;
        }
        */
      }
      localStorage.setItem(`runHistoryData_${loggedInUser?.username}`, "");
      return {};
    }
    const lsItemKey = `runHistoryData_${loggedInUser?.username}`;
    const lsItem = localStorage.getItem(lsItemKey);
    if (lsItem) {
      const cachedResponse = lsItem;
      if (cachedResponse) {
        const runHistory: RunHistoryData = JSON.parse(decrypt(cachedResponse, bypassLogin));
        return runHistory;
      }
      return {};
    }
    localStorage.setItem(`runHistoryData_${loggedInUser?.username}`, "");
    return {};
  }

  /**
   * Saves a new entry to Run History
   * @param runEntry: most recent SessionSaveData of the run
   * @param isVictory: result of the run
   * Arbitrary limit of 25 runs per player - Will delete runs, starting with the oldest one, if needed
   */
  async saveRunHistory(runEntry: SessionSaveData, isVictory: boolean): Promise<boolean> {
    const runHistoryData = await this.getRunHistoryData();
    // runHistoryData should always return run history or {} empty object
    let timestamps = Object.keys(runHistoryData).map(Number);

    // Arbitrary limit of 25 entries per user --> Can increase or decrease
    while (timestamps.length >= RUN_HISTORY_LIMIT) {
      const oldestTimestamp = Math.min.apply(Math, timestamps).toString();
      delete runHistoryData[oldestTimestamp];
      timestamps = Object.keys(runHistoryData).map(Number);
    }

    const timestamp = runEntry.timestamp.toString();
    runHistoryData[timestamp] = {
      entry: runEntry,
      isVictory,
      isFavorite: false,
    };
    localStorage.setItem(
      `runHistoryData_${loggedInUser?.username}`,
      encrypt(JSON.stringify(runHistoryData), bypassLogin),
    );
    /**
     * Networking Code DO NOT DELETE
     *
    if (!Utils.isLocal) {
      try {
        await Utils.apiPost("savedata/runHistory", JSON.stringify(runHistoryData), undefined, true);
        return true;
      } catch (err) {
        console.log("savedata/runHistory POST failed : ", err);
        return false;
      }
    }
    NOTE: should be adopted to `pokerogue-api.ts`
    */
    return true;
  }

  parseSystemData(dataStr: string): SystemSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
      if (k === "gameStats") {
        return new GameStats(v);
      }
      if (k === "eggs") {
        const ret: EggData[] = [];
        if (v === null) {
          v = [];
        }
        for (const e of v) {
          ret.push(new EggData(e));
        }
        return ret;
      }
      if (k === "ribbons") {
        return RibbonData.fromJSON(v);
      }

      return k.endsWith("Attr") && !["natureAttr", "abilityAttr", "passiveAttr"].includes(k) ? BigInt(v ?? 0) : v;
    }) as SystemSaveData;
  }

  convertSystemDataStr(dataStr: string, shorten = false): string {
    if (!shorten) {
      // Account for past key oversight
      dataStr = dataStr.replace(/\$pAttr/g, "$pa");
    }
    dataStr = dataStr.replace(/"trainerId":\d+/g, `"trainerId":${this.trainerId}`);
    dataStr = dataStr.replace(/"secretId":\d+/g, `"secretId":${this.secretId}`);
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

    const systemData = await pokerogueApi.savedata.system.verify({
      clientSessionId,
    });

    if (systemData) {
      globalScene.phaseManager.clearPhaseQueue();
      globalScene.phaseManager.unshiftNew("ReloadSessionPhase", JSON.stringify(systemData));
      this.clearLocalData();
      return false;
    }

    return true;
  }

  public clearLocalData(): void {
    if (bypassLogin) {
      return;
    }
    localStorage.removeItem(`data_${loggedInUser?.username}`);
    for (let s = 0; s < 5; s++) {
      localStorage.removeItem(`sessionData${s ? s : ""}_${loggedInUser?.username}`);
    }
  }

  /**
   * Saves a setting to localStorage
   * @param setting string ideally of SettingKeys
   * @param valueIndex index of the setting's option
   * @returns true
   */
  public saveSetting(setting: string, valueIndex: number): boolean {
    let settings: object = {};
    if (localStorage.hasOwnProperty("settings")) {
      settings = JSON.parse(localStorage.getItem("settings")!); // TODO: is this bang correct?
    }

    setSetting(setting, valueIndex);

    settings[setting] = valueIndex;
    settings["gameVersion"] = globalScene.game.config.gameVersion;

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
    const key = deviceName.toLowerCase(); // Convert the gamepad name to lowercase to use as a key
    let mappingConfigs: object = {}; // Initialize an empty object to hold the mapping configurations
    if (localStorage.hasOwnProperty("mappingConfigs")) {
      // Check if 'mappingConfigs' exists in localStorage
      mappingConfigs = JSON.parse(localStorage.getItem("mappingConfigs")!); // TODO: is this bang correct?
    } // Parse the existing 'mappingConfigs' from localStorage
    if (!mappingConfigs[key]) {
      mappingConfigs[key] = {};
    } // If there is no configuration for the given key, create an empty object for it
    mappingConfigs[key].custom = config.custom; // Assign the custom configuration to the mapping configuration for the given key
    localStorage.setItem("mappingConfigs", JSON.stringify(mappingConfigs)); // Save the updated mapping configurations back to localStorage
    return true; // Return true to indicate the operation was successful
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
    if (!localStorage.hasOwnProperty("mappingConfigs")) {
      // Check if 'mappingConfigs' exists in localStorage
      return false;
    } // If 'mappingConfigs' does not exist, return false

    const mappingConfigs = JSON.parse(localStorage.getItem("mappingConfigs")!); // Parse the existing 'mappingConfigs' from localStorage // TODO: is this bang correct?

    for (const key of Object.keys(mappingConfigs)) {
      // Iterate over the keys of the mapping configurations
      globalScene.inputController.injectConfig(key, mappingConfigs[key]);
    } // Inject each configuration into the input controller for the corresponding key

    return true; // Return true to indicate the operation was successful
  }

  public resetMappingToFactory(): boolean {
    if (!localStorage.hasOwnProperty("mappingConfigs")) {
      // Check if 'mappingConfigs' exists in localStorage
      return false;
    } // If 'mappingConfigs' does not exist, return false
    localStorage.removeItem("mappingConfigs");
    globalScene.inputController.resetConfigs();
    return true; // TODO: is `true` the correct return value?
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
  public saveControlSetting(
    device: Device,
    localStoragePropertyName: string,
    setting: SettingGamepad | SettingKeyboard,
    settingDefaults,
    valueIndex: number,
  ): boolean {
    let settingsControls: object = {}; // Initialize an empty object to hold the gamepad settings

    if (localStorage.hasOwnProperty(localStoragePropertyName)) {
      // Check if 'settingsControls' exists in localStorage
      settingsControls = JSON.parse(localStorage.getItem(localStoragePropertyName)!); // Parse the existing 'settingsControls' from localStorage // TODO: is this bang correct?
    }

    if (device === Device.GAMEPAD) {
      setSettingGamepad(setting as SettingGamepad, valueIndex);
    } else if (device === Device.KEYBOARD) {
      setSettingKeyboard(setting as SettingKeyboard, valueIndex);
    }

    Object.keys(settingDefaults).forEach(s => {
      // Iterate over the default gamepad settings
      if (s === setting) {
        // If the current setting matches, update its value
        settingsControls[s] = valueIndex;
      }
    });

    localStorage.setItem(localStoragePropertyName, JSON.stringify(settingsControls)); // Save the updated gamepad settings back to localStorage

    return true; // Return true to indicate the operation was successful
  }

  /**
   * Loads Settings from local storage if available
   * @returns true if succesful, false if not
   */
  private loadSettings(): boolean {
    resetSettings();

    if (!localStorage.hasOwnProperty("settings")) {
      return false;
    }

    const settings = JSON.parse(localStorage.getItem("settings")!); // TODO: is this bang correct?

    applySettingsVersionMigration(settings);

    for (const setting of Object.keys(settings)) {
      setSetting(setting, settings[setting]);
    }

    return true; // TODO: is `true` the correct return value?
  }

  private loadGamepadSettings(): void {
    Object.values(SettingGamepad).forEach(setting => {
      setSettingGamepad(setting, settingGamepadDefaults[setting]);
    });

    if (!localStorage.hasOwnProperty("settingsGamepad")) {
      return;
    }
    const settingsGamepad = JSON.parse(localStorage.getItem("settingsGamepad")!); // TODO: is this bang correct?

    for (const setting of Object.keys(settingsGamepad)) {
      setSettingGamepad(setting as SettingGamepad, settingsGamepad[setting]);
    }
  }

  /**
   * Save the specified tutorial as having the specified completion status.
   * @param tutorial - The {@linkcode Tutorial} whose completion status is being saved
   * @param status - The completion status to set
   */
  public saveTutorialFlag(tutorial: Tutorial, status: boolean): void {
    // Grab the prior save data tutorial
    const saveDataKey = getDataTypeKey(GameDataType.TUTORIALS);
    const tutorials: TutorialFlags = localStorage.hasOwnProperty(saveDataKey)
      ? JSON.parse(localStorage.getItem(saveDataKey)!)
      : {};

    // TODO: We shouldn't be storing this like that
    for (const key of Object.values(Tutorial)) {
      if (key === tutorial) {
        tutorials[key] = status;
      } else {
        tutorials[key] ??= false;
      }
    }

    localStorage.setItem(saveDataKey, JSON.stringify(tutorials));
  }

  public getTutorialFlags(): TutorialFlags {
    const key = getDataTypeKey(GameDataType.TUTORIALS);
    const ret: TutorialFlags = Object.values(Tutorial).reduce((acc, tutorial) => {
      acc[Tutorial[tutorial]] = false;
      return acc;
    }, {} as TutorialFlags);

    if (!localStorage.hasOwnProperty(key)) {
      return ret;
    }

    const tutorials = JSON.parse(localStorage.getItem(key)!); // TODO: is this bang correct?

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

    const dialogues = JSON.parse(localStorage.getItem(key)!); // TODO: is this bang correct?

    for (const dialogue of Object.keys(dialogues)) {
      ret[dialogue] = dialogues[dialogue];
    }

    return ret;
  }

  public getSessionSaveData(): SessionSaveData {
    return {
      seed: globalScene.seed,
      playTime: globalScene.sessionPlayTime,
      gameMode: globalScene.gameMode.modeId,
      party: globalScene.getPlayerParty().map(p => new PokemonData(p)),
      enemyParty: globalScene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: globalScene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: globalScene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(globalScene.arena),
      pokeballCounts: globalScene.pokeballCounts,
      money: Math.floor(globalScene.money),
      score: globalScene.score,
      waveIndex: globalScene.currentBattle.waveIndex,
      battleType: globalScene.currentBattle.battleType,
      trainer:
        globalScene.currentBattle.battleType === BattleType.TRAINER
          ? new TrainerData(globalScene.currentBattle.trainer)
          : null,
      gameVersion: globalScene.game.config.gameVersion,
      timestamp: Date.now(),
      challenges: globalScene.gameMode.challenges.map(c => new ChallengeData(c)),
      mysteryEncounterType: globalScene.currentBattle.mysteryEncounter?.encounterType ?? -1,
      mysteryEncounterSaveData: globalScene.mysteryEncounterSaveData,
      playerFaints: globalScene.arena.playerFaints,
    } as SessionSaveData;
  }

  async getSession(slotId: number): Promise<SessionSaveData | null> {
    const { promise, resolve, reject } = Promise.withResolvers<SessionSaveData | null>();
    if (slotId < 0) {
      resolve(null);
      return promise;
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

    if (!bypassLogin && !localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`)) {
      const response = await pokerogueApi.savedata.session.get({ slot: slotId, clientSessionId });

      if (!response || response?.length === 0 || response?.[0] !== "{") {
        console.error(response);
        resolve(null);
        return promise;
      }

      localStorage.setItem(
        `sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`,
        encrypt(response, bypassLogin),
      );

      await handleSessionData(response);
      return promise;
    }
    const sessionData = localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`);
    if (sessionData) {
      await handleSessionData(decrypt(sessionData, bypassLogin));
      return promise;
    }
    resolve(null);
    return promise;
  }

  async renameSession(slotId: number, newName: string): Promise<boolean> {
    if (slotId < 0) {
      return false;
    }
    if (newName === "") {
      return true;
    }
    const sessionData: SessionSaveData | null = await this.getSession(slotId);

    if (!sessionData) {
      return false;
    }

    sessionData.name = newName;
    // update timestamp by 1 to ensure the session is saved
    sessionData.timestamp += 1;
    const updatedDataStr = JSON.stringify(sessionData);
    const encrypted = encrypt(updatedDataStr, bypassLogin);
    const secretId = this.secretId;
    const trainerId = this.trainerId;

    if (bypassLogin) {
      localStorage.setItem(
        `sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`,
        encrypt(updatedDataStr, bypassLogin),
      );
      return true;
    }

    const response = await pokerogueApi.savedata.session.update(
      { slot: slotId, trainerId, secretId, clientSessionId },
      updatedDataStr,
    );

    if (response) {
      return false;
    }
    localStorage.setItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`, encrypted);
    const success = await updateUserInfo();
    return !(success !== null && !success);
  }

  async loadSession(slotId: number, sessionData?: SessionSaveData): Promise<boolean> {
    const { promise, resolve, reject } = Promise.withResolvers<boolean>();
    try {
      const initSessionFromData = (fromSession: SessionSaveData) => {
        if (isLocal || isBeta) {
          try {
            console.debug(
              this.parseSessionData(
                JSON.stringify(fromSession, (_, v: any) => (typeof v === "bigint" ? v.toString() : v)),
              ),
            );
          } catch (err) {
            console.debug("Attempt to log session data failed:", err);
          }
        }

        globalScene.gameMode = getGameMode(fromSession.gameMode || GameModes.CLASSIC);
        if (fromSession.challenges) {
          globalScene.gameMode.challenges = fromSession.challenges.map(c => c.toChallenge());
        }

        globalScene.setSeed(fromSession.seed || globalScene.game.config.seed[0]);
        globalScene.resetSeed();

        console.log("Seed:", globalScene.seed);

        globalScene.sessionPlayTime = fromSession.playTime || 0;
        globalScene.lastSavePlayTime = 0;

        const loadPokemonAssets: Promise<void>[] = [];

        const party = globalScene.getPlayerParty();
        party.splice(0, party.length);

        for (const p of fromSession.party) {
          const pokemon = p.toPokemon() as PlayerPokemon;
          pokemon.setVisible(false);
          loadPokemonAssets.push(pokemon.loadAssets(false));
          party.push(pokemon);
        }

        Object.keys(globalScene.pokeballCounts).forEach((key: string) => {
          globalScene.pokeballCounts[key] = fromSession.pokeballCounts[key] || 0;
        });
        if (Overrides.POKEBALL_OVERRIDE.active) {
          globalScene.pokeballCounts = Overrides.POKEBALL_OVERRIDE.pokeballs;
        }

        globalScene.money = Math.floor(fromSession.money || 0);
        globalScene.updateMoneyText();

        if (globalScene.money > this.gameStats.highestMoney) {
          this.gameStats.highestMoney = globalScene.money;
        }

        globalScene.score = fromSession.score;
        globalScene.updateScoreText();

        globalScene.mysteryEncounterSaveData = new MysteryEncounterSaveData(fromSession.mysteryEncounterSaveData);

        globalScene.newArena(fromSession.arena.biome, fromSession.playerFaints);

        const battleType = fromSession.battleType || 0;
        const trainerConfig = fromSession.trainer ? trainerConfigs[fromSession.trainer.trainerType] : null;
        const mysteryEncounterType =
          fromSession.mysteryEncounterType !== -1 ? fromSession.mysteryEncounterType : undefined;
        const battle = globalScene.newBattle(
          fromSession.waveIndex,
          battleType,
          fromSession.trainer,
          battleType === BattleType.TRAINER
            ? trainerConfig?.doubleOnly || fromSession.trainer?.variant === TrainerVariant.DOUBLE
            : fromSession.enemyParty.length > 1,
          mysteryEncounterType,
        );
        battle.enemyLevels = fromSession.enemyParty.map(p => p.level);

        globalScene.arena.init();

        fromSession.enemyParty.forEach((enemyData, e) => {
          const enemyPokemon = enemyData.toPokemon(
            battleType,
            e,
            fromSession.trainer?.variant === TrainerVariant.DOUBLE,
          ) as EnemyPokemon;
          battle.enemyParty[e] = enemyPokemon;
          if (battleType === BattleType.WILD) {
            battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
          }

          loadPokemonAssets.push(enemyPokemon.loadAssets());
        });

        globalScene.arena.weather = fromSession.arena.weather;
        globalScene.arena.eventTarget.dispatchEvent(
          new WeatherChangedEvent(
            WeatherType.NONE,
            globalScene.arena.weather?.weatherType!,
            globalScene.arena.weather?.turnsLeft!,
          ),
        ); // TODO: is this bang correct?

        globalScene.arena.terrain = fromSession.arena.terrain;
        globalScene.arena.eventTarget.dispatchEvent(
          new TerrainChangedEvent(
            TerrainType.NONE,
            globalScene.arena.terrain?.terrainType!,
            globalScene.arena.terrain?.turnsLeft!,
          ),
        ); // TODO: is this bang correct?

        globalScene.arena.playerTerasUsed = fromSession.arena.playerTerasUsed;

        globalScene.arena.tags = fromSession.arena.tags;
        if (globalScene.arena.tags) {
          for (const tag of globalScene.arena.tags) {
            if (tag instanceof EntryHazardTag) {
              const { tagType, side, turnCount, layers, maxLayers } = tag as EntryHazardTag;
              globalScene.arena.eventTarget.dispatchEvent(
                new TagAddedEvent(tagType, side, turnCount, layers, maxLayers),
              );
            } else {
              globalScene.arena.eventTarget.dispatchEvent(new TagAddedEvent(tag.tagType, tag.side, tag.turnCount));
            }
          }
        }

        globalScene.arena.positionalTagManager.tags = fromSession.arena.positionalTags.map(tag =>
          loadPositionalTag(tag),
        );

        if (globalScene.modifiers.length > 0) {
          console.warn("Existing modifiers not cleared on session load, deleting...");
          globalScene.modifiers = [];
        }
        for (const modifierData of fromSession.modifiers) {
          const modifier = modifierData.toModifier(Modifier[modifierData.className]);
          if (modifier) {
            globalScene.addModifier(modifier, true);
          }
        }
        globalScene.updateModifiers(true);

        for (const enemyModifierData of fromSession.enemyModifiers) {
          const modifier = enemyModifierData.toModifier(Modifier[enemyModifierData.className]);
          if (modifier) {
            globalScene.addEnemyModifier(modifier, true);
          }
        }

        globalScene.updateModifiers(false);

        Promise.all(loadPokemonAssets).then(() => resolve(true));
      };
      if (sessionData) {
        initSessionFromData(sessionData);
      } else {
        this.getSession(slotId)
          .then(data => {
            return data && initSessionFromData(data);
          })
          .catch(err => {
            reject(err);
            return;
          });
      }
    } catch (err) {
      reject(err);
    }

    return promise;
  }

  /**
   * Delete the session data at the given slot when overwriting a save file
   * For deleting the session of a finished run, use {@linkcode tryClearSession}
   * @param slotId the slot to clear
   * @returns Promise with result `true` if the session was deleted successfully, `false` otherwise
   */
  deleteSession(slotId: number): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (bypassLogin) {
        localStorage.removeItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`);
        return resolve(true);
      }

      updateUserInfo().then(success => {
        if (success !== null && !success) {
          return resolve(false);
        }
        pokerogueApi.savedata.session.delete({ slot: slotId, clientSessionId }).then(error => {
          if (error) {
            if (error.startsWith("session out of date")) {
              globalScene.phaseManager.clearPhaseQueue();
              globalScene.phaseManager.unshiftNew("ReloadSessionPhase");
            }
            console.error(error);
            resolve(false);
          } else {
            if (loggedInUser) {
              loggedInUser.lastSessionSlot = -1;
            }

            localStorage.removeItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`);
            resolve(true);
          }
        });
      });
    });
  }

  /* Defines a localStorage item 'daily' to check on clears, offline implementation of savedata/newclear API
  If a GameModes clear other than Daily is checked, newClear = true as usual
  If a Daily mode is cleared, checks if it was already cleared before, based on seed, and returns true only to new daily clear runs */
  offlineNewClear(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const sessionData = this.getSessionSaveData();
      const seed = sessionData.seed;
      let daily: string[] = [];

      if (sessionData.gameMode === GameModes.DAILY) {
        if (localStorage.hasOwnProperty("daily")) {
          daily = JSON.parse(atob(localStorage.getItem("daily")!)); // TODO: is this bang correct?
          if (daily.includes(seed)) {
            return resolve(false);
          }
          daily.push(seed);
          localStorage.setItem("daily", btoa(JSON.stringify(daily)));
          return resolve(true);
        }
        daily.push(seed);
        localStorage.setItem("daily", btoa(JSON.stringify(daily)));
        return resolve(true);
      }
      return resolve(true);
    });
  }

  /**
   * Attempt to clear session data after the end of a run
   * After session data is removed, attempt to update user info so the menu updates
   * To delete an unfinished run instead, use {@linkcode deleteSession}
   */
  async tryClearSession(slotId: number): Promise<[success: boolean, newClear: boolean]> {
    let result: [boolean, boolean] = [false, false];

    if (bypassLogin) {
      localStorage.removeItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`);
      result = [true, true];
    } else {
      const sessionData = this.getSessionSaveData();
      const { trainerId } = this;
      const jsonResponse = await pokerogueApi.savedata.session.clear(
        { slot: slotId, trainerId, clientSessionId },
        sessionData,
      );

      if (!jsonResponse?.error) {
        result = [true, jsonResponse?.success ?? false];
        if (loggedInUser) {
          loggedInUser!.lastSessionSlot = -1;
        }
        localStorage.removeItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`);
      } else {
        if (jsonResponse?.error?.startsWith("session out of date")) {
          globalScene.phaseManager.clearPhaseQueue();
          globalScene.phaseManager.unshiftNew("ReloadSessionPhase");
        }

        console.error(jsonResponse);
        result = [false, false];
      }
    }

    await updateUserInfo();

    return result;
  }

  parseSessionData(dataStr: string): SessionSaveData {
    // TODO: Add `null`/`undefined` to the corresponding type signatures for this
    // (or prevent them from being null)
    // If the value is able to *not exist*, it should say so in the code
    const sessionData = JSON.parse(dataStr, (k: string, v: any) => {
      // TODO: Move this to occur _after_ migrate scripts (and refactor all non-assignment duties into migrate scripts)
      // This should ideally be just a giant assign block
      switch (k) {
        case "party":
        case "enemyParty": {
          const ret: PokemonData[] = [];
          for (const pd of v ?? []) {
            ret.push(new PokemonData(pd));
          }
          return ret;
        }

        case "trainer":
          return v ? new TrainerData(v) : null;

        case "modifiers":
        case "enemyModifiers": {
          const ret: PersistentModifierData[] = [];
          for (const md of v ?? []) {
            if (md?.className === "ExpBalanceModifier") {
              // Temporarily limit EXP Balance until it gets reworked
              md.stackCount = Math.min(md.stackCount, 4);
            }

            if (
              md instanceof Modifier.EnemyAttackStatusEffectChanceModifier
              && (md.effect === StatusEffect.FREEZE || md.effect === StatusEffect.SLEEP)
            ) {
              // Discard any old "sleep/freeze chance tokens".
              // TODO: make this migrate script
              continue;
            }

            ret.push(new PersistentModifierData(md, k === "modifiers"));
          }
          return ret;
        }

        case "arena":
          return new ArenaData(v as SerializedArenaData);

        case "challenges": {
          const ret: ChallengeData[] = [];
          for (const c of v ?? []) {
            ret.push(new ChallengeData(c));
          }
          return ret;
        }

        case "mysteryEncounterType":
          return v as MysteryEncounterType;

        case "mysteryEncounterSaveData":
          return new MysteryEncounterSaveData(v);

        default:
          return v;
      }
    }) as SessionSaveData;

    applySessionVersionMigration(sessionData);

    return sessionData;
  }

  saveAll(skipVerification = false, sync = false, useCachedSession = false, useCachedSystem = false): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      executeIf(!skipVerification, updateUserInfo).then(success => {
        if (success !== null && !success) {
          return resolve(false);
        }
        if (sync) {
          globalScene.ui.savingIcon.show();
        }
        const sessionData = useCachedSession
          ? this.parseSessionData(
              decrypt(
                localStorage.getItem(
                  `sessionData${globalScene.sessionSlotId ? globalScene.sessionSlotId : ""}_${loggedInUser?.username}`,
                )!,
                bypassLogin,
              ),
            ) // TODO: is this bang correct?
          : this.getSessionSaveData();
        const maxIntAttrValue = 0x80000000;
        const systemData = useCachedSystem
          ? this.parseSystemData(decrypt(localStorage.getItem(`data_${loggedInUser?.username}`)!, bypassLogin))
          : this.getSystemSaveData(); // TODO: is this bang correct?

        const request = {
          system: systemData,
          session: sessionData,
          sessionSlotId: globalScene.sessionSlotId,
          clientSessionId,
        };

        localStorage.setItem(
          `data_${loggedInUser?.username}`,
          encrypt(
            JSON.stringify(systemData, (_k: any, v: any) =>
              typeof v === "bigint" ? (v <= maxIntAttrValue ? Number(v) : v.toString()) : v,
            ),
            bypassLogin,
          ),
        );
        localStorage.setItem(
          `sessionData${globalScene.sessionSlotId ? globalScene.sessionSlotId : ""}_${loggedInUser?.username}`,
          encrypt(JSON.stringify(sessionData), bypassLogin),
        );

        console.debug("Session data saved!");

        if (!bypassLogin && sync) {
          pokerogueApi.savedata.updateAll(request).then(error => {
            if (sync) {
              globalScene.lastSavePlayTime = 0;
              globalScene.ui.savingIcon.hide();
            }
            if (error) {
              if (error.startsWith("session out of date")) {
                globalScene.phaseManager.clearPhaseQueue();
                globalScene.phaseManager.unshiftNew("ReloadSessionPhase");
              }
              console.error(error);
              return resolve(false);
            }
            resolve(true);
          });
        } else {
          this.verify().then(success => {
            globalScene.ui.savingIcon.hide();
            resolve(success);
          });
        }
      });
    });
  }

  public tryExportData(dataType: GameDataType, slotId = 0): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const dataKey: string = `${getDataTypeKey(dataType, slotId)}_${loggedInUser?.username}`;
      const handleData = (dataStr: string) => {
        switch (dataType) {
          case GameDataType.SYSTEM:
            dataStr = this.convertSystemDataStr(dataStr, true);
            break;
        }
        const encryptedData = AES.encrypt(dataStr, saveKey);
        const blob = new Blob([encryptedData.toString()], {
          type: "text/json",
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `${dataKey}.prsv`;
        link.click();
        link.remove();
      };
      if (!bypassLogin && dataType < GameDataType.SETTINGS) {
        let promise: Promise<string | null | number> = Promise.resolve(null);

        if (dataType === GameDataType.SYSTEM) {
          promise = pokerogueApi.savedata.system.get({ clientSessionId });
        } else if (dataType === GameDataType.SESSION) {
          promise = pokerogueApi.savedata.session.get({
            slot: slotId,
            clientSessionId,
          });
        }

        // TODO: this is a really shit way of checking JSON validity
        promise.then(response => {
          if (typeof response !== "string" || response.length === 0 || response.charAt(0) !== "{") {
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

  public importData(dataType: GameDataType, slotId = 0): void {
    const dataKey = `${getDataTypeKey(dataType, slotId)}_${loggedInUser?.username}`;

    let saveFile: any = document.getElementById("saveFile");
    if (saveFile) {
      saveFile.remove();
    }

    saveFile = document.createElement("input");
    saveFile.id = "saveFile";
    saveFile.type = "file";
    saveFile.accept = ".prsv";
    saveFile.style.display = "none";
    saveFile.addEventListener("change", e => {
      const reader = new FileReader();

      reader.onload = (_ => {
        return e => {
          let dataName = GameDataType[dataType].toLowerCase();
          let dataStr = AES.decrypt(e.target?.result?.toString()!, saveKey).toString(enc.Utf8); // TODO: is this bang correct?
          let valid = false;
          try {
            switch (dataType) {
              case GameDataType.SYSTEM: {
                dataStr = this.convertSystemDataStr(dataStr);
                dataStr = dataStr.replace(/"playTime":\d+/, `"playTime":${this.gameStats.playTime + 60}`);
                const systemData = this.parseSystemData(dataStr);
                valid = !!systemData.dexData && !!systemData.timestamp;
                break;
              }
              case GameDataType.SESSION: {
                const sessionData = this.parseSessionData(dataStr);
                valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
                break;
              }
              case GameDataType.RUN_HISTORY: {
                const data = JSON.parse(dataStr);
                const keys = Object.keys(data);
                dataName = i18next.t("menuUiHandler:RUN_HISTORY").toLowerCase();
                keys.forEach(key => {
                  const entryKeys = Object.keys(data[key]);
                  valid =
                    ["isFavorite", "isVictory", "entry"].every(v => entryKeys.includes(v)) && entryKeys.length === 3;
                });
                break;
              }
              case GameDataType.SETTINGS:
              case GameDataType.TUTORIALS:
                valid = true;
                break;
            }
          } catch (ex) {
            console.error(ex);
          }

          const displayError = (error: string) =>
            globalScene.ui.showText(error, null, () => globalScene.ui.showText("", 0), fixedInt(1500));

          if (!valid) {
            return globalScene.ui.showText(
              `Your ${dataName} data could not be loaded. It may be corrupted.`,
              null,
              () => globalScene.ui.showText("", 0),
              fixedInt(1500),
            );
          }

          globalScene.ui.showText(
            `Your ${dataName} data will be overridden and the page will reload. Proceed?`,
            null,
            () => {
              globalScene.ui.setOverlayMode(
                UiMode.CONFIRM,
                () => {
                  localStorage.setItem(dataKey, encrypt(dataStr, bypassLogin));

                  if (!bypassLogin && dataType < GameDataType.SETTINGS) {
                    updateUserInfo().then(success => {
                      if (!success[0]) {
                        return displayError(
                          `Could not contact the server. Your ${dataName} data could not be imported.`,
                        );
                      }
                      const { trainerId, secretId } = this;
                      let updatePromise: Promise<string | null>;
                      if (dataType === GameDataType.SESSION) {
                        updatePromise = pokerogueApi.savedata.session.update(
                          {
                            slot: slotId,
                            trainerId,
                            secretId,
                            clientSessionId,
                          },
                          dataStr,
                        );
                      } else {
                        updatePromise = pokerogueApi.savedata.system.update(
                          { trainerId, secretId, clientSessionId },
                          dataStr,
                        );
                      }
                      updatePromise.then(error => {
                        if (error) {
                          console.error(error);
                          return displayError(
                            `An error occurred while updating ${dataName} data. Please contact the administrator.`,
                          );
                        }
                        window.location.reload();
                      });
                    });
                  } else {
                    window.location.reload();
                  }
                },
                () => {
                  globalScene.ui.revertMode();
                  globalScene.ui.showText("", 0);
                },
                false,
                -98,
              );
            },
          );
        };
      })((e.target as any).files[0]);

      reader.readAsText((e.target as any).files[0]);
    });
    saveFile.click();
  }

  private initDexData(): void {
    const data: DexData = {};

    for (const species of allSpecies) {
      data[species.speciesId] = {
        seenAttr: 0n,
        caughtAttr: 0n,
        natureAttr: 0,
        seenCount: 0,
        caughtCount: 0,
        hatchedCount: 0,
        ivs: [0, 0, 0, 0, 0, 0],
        ribbons: new RibbonData(0),
      };
    }

    const defaultStarterAttr =
      DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.FEMALE | DexAttr.DEFAULT_VARIANT | DexAttr.DEFAULT_FORM;

    const defaultStarterNatures: Nature[] = [];

    globalScene.executeWithSeedOffset(
      () => {
        const neutralNatures = [Nature.HARDY, Nature.DOCILE, Nature.SERIOUS, Nature.BASHFUL, Nature.QUIRKY];
        for (const _ of defaultStarterSpecies) {
          defaultStarterNatures.push(randSeedItem(neutralNatures));
        }
      },
      0,
      "default",
    );

    for (let ds = 0; ds < defaultStarterSpecies.length; ds++) {
      const entry = data[defaultStarterSpecies[ds]] as DexEntry;
      entry.seenAttr = defaultStarterAttr;
      entry.caughtAttr = defaultStarterAttr;
      entry.natureAttr = 1 << (defaultStarterNatures[ds] + 1);
      for (const i in entry.ivs) {
        entry.ivs[i] = 15;
      }
    }

    this.defaultDexData = { ...data };
    this.dexData = data;
  }

  private initStarterData(): void {
    const starterData: StarterData = {};

    const starterSpeciesIds = Object.keys(speciesStarterCosts).map(k => Number.parseInt(k) as SpeciesId);

    for (const speciesId of starterSpeciesIds) {
      starterData[speciesId] = {
        moveset: null,
        eggMoves: 0,
        candyCount: 0,
        friendship: 0,
        abilityAttr: defaultStarterSpecies.includes(speciesId) ? AbilityAttr.ABILITY_1 : 0,
        passiveAttr: 0,
        valueReduction: 0,
        classicWinCount: 0,
      };
    }

    this.starterData = starterData;
  }

  setPokemonSeen(pokemon: Pokemon, incrementCount = true, trainer = false): void {
    // Some Mystery Encounters block updates to these stats
    if (
      globalScene.currentBattle?.isBattleMysteryEncounter()
      && globalScene.currentBattle.mysteryEncounter?.preventGameStatsUpdates
    ) {
      return;
    }
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

  /**
   *
   * @param pokemon
   * @param incrementCount
   * @param fromEgg
   * @param showMessage
   * @returns `true` if Pokemon catch unlocked a new starter, `false` if Pokemon catch did not unlock a starter
   */
  setPokemonCaught(pokemon: Pokemon, incrementCount = true, fromEgg = false, showMessage = true): Promise<boolean> {
    // If incrementCount === false (not a catch scenario), only update the pokemon's dex data if the Pokemon has already been marked as caught in dex
    // Prevents form changes, nature changes, etc. from unintentionally updating the dex data of a "rental" pokemon
    const speciesRootForm = pokemon.species.getRootSpeciesId();
    if (!incrementCount && !globalScene.gameData.dexData[speciesRootForm].caughtAttr) {
      return Promise.resolve(false);
    }
    return this.setPokemonSpeciesCaught(pokemon, pokemon.species, incrementCount, fromEgg, showMessage);
  }

  /**
   *
   * @param pokemon
   * @param species
   * @param incrementCount
   * @param fromEgg
   * @param showMessage
   * @returns `true` if Pokemon catch unlocked a new starter, `false` if Pokemon catch did not unlock a starter
   */
  setPokemonSpeciesCaught(
    pokemon: Pokemon,
    species: PokemonSpecies,
    incrementCount = true,
    fromEgg = false,
    showMessage = true,
  ): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const dexEntry = this.dexData[species.speciesId];
      const caughtAttr = dexEntry.caughtAttr;
      const formIndex = pokemon.formIndex;

      // This makes sure that we do not try to unlock data which cannot be unlocked
      const dexAttr = pokemon.getDexAttr() & species.getFullUnlocksData();

      // Mark as caught
      dexEntry.caughtAttr |= dexAttr;

      // If the caught form is a battleform, we want to also mark the base form as caught.
      // This snippet assumes that the base form has formIndex equal to 0, which should be
      // always true except for the case of Urshifu.
      const formKey = pokemon.getFormKey();
      if (formIndex > 0) {
        // In case a Pikachu with formIndex > 0 was unlocked, base form Pichu is also unlocked
        if (pokemon.species.speciesId === SpeciesId.PIKACHU && species.speciesId === SpeciesId.PICHU) {
          dexEntry.caughtAttr |= globalScene.gameData.getFormAttr(0);
        }
        if (pokemon.species.speciesId === SpeciesId.URSHIFU) {
          if (formIndex === 2) {
            dexEntry.caughtAttr |= globalScene.gameData.getFormAttr(0);
          } else if (formIndex === 3) {
            dexEntry.caughtAttr |= globalScene.gameData.getFormAttr(1);
          }
        } else if (pokemon.species.speciesId === SpeciesId.ZYGARDE) {
          if (formIndex === 4) {
            dexEntry.caughtAttr |= globalScene.gameData.getFormAttr(2);
          } else if (formIndex === 5) {
            dexEntry.caughtAttr |= globalScene.gameData.getFormAttr(3);
          }
        } else {
          const allFormChanges = pokemonFormChanges.hasOwnProperty(species.speciesId)
            ? pokemonFormChanges[species.speciesId]
            : [];
          const toCurrentFormChanges = allFormChanges.filter(f => f.formKey === formKey);
          if (toCurrentFormChanges.length > 0) {
            // Needs to do this or Castform can unlock the wrong form, etc.
            dexEntry.caughtAttr |= globalScene.gameData.getFormAttr(0);
          }
        }
      }

      // Unlock ability
      if (speciesStarterCosts.hasOwnProperty(species.speciesId)) {
        this.starterData[species.speciesId].abilityAttr |=
          pokemon.abilityIndex !== 1 || pokemon.species.ability2
            ? 1 << pokemon.abilityIndex
            : AbilityAttr.ABILITY_HIDDEN;
      }

      // Unlock nature
      dexEntry.natureAttr |= 1 << (pokemon.nature + 1);

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

        if (!hasPrevolution && (!globalScene.gameMode.isDaily || hasNewAttr || fromEgg)) {
          this.addStarterCandy(
            species,
            1 * (pokemon.isShiny() ? 5 * (1 << (pokemon.variant ?? 0)) : 1) * (fromEgg || pokemon.isBoss() ? 2 : 1),
          );
        }
      }

      const checkPrevolution = (newStarter: boolean) => {
        if (hasPrevolution) {
          const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
          this.setPokemonSpeciesCaught(
            pokemon,
            getPokemonSpecies(prevolutionSpecies),
            incrementCount,
            fromEgg,
            showMessage,
          ).then(result => resolve(result));
        } else {
          resolve(newStarter);
        }
      };

      if (newCatch && speciesStarterCosts.hasOwnProperty(species.speciesId)) {
        if (!showMessage) {
          resolve(true);
          return;
        }
        globalScene.playSound("level_up_fanfare");
        globalScene.ui.showText(
          i18next.t("battle:addedAsAStarter", { pokemonName: species.name }),
          null,
          () => checkPrevolution(true),
          null,
          true,
        );
      } else {
        checkPrevolution(false);
      }
    });
  }

  /**
   * Increase the number of classic ribbons won with this species.
   * @param species - The species to increment the ribbon count for
   * @param forStarter - If true, will increment the ribbon count for the root species of the given species
   * @returns The number of classic wins after incrementing.
   */
  incrementRibbonCount(species: PokemonSpecies, forStarter = false): number {
    const speciesIdToIncrement: SpeciesId = species.getRootSpeciesId(forStarter);

    if (!this.starterData[speciesIdToIncrement].classicWinCount) {
      this.starterData[speciesIdToIncrement].classicWinCount = 0;
    }

    if (!this.starterData[speciesIdToIncrement].classicWinCount) {
      globalScene.gameData.gameStats.ribbonsOwned++;
    }

    const ribbonsInStats: number = globalScene.gameData.gameStats.ribbonsOwned;

    if (ribbonsInStats >= 100) {
      globalScene.validateAchv(achvs._100_RIBBONS);
    }
    if (ribbonsInStats >= 75) {
      globalScene.validateAchv(achvs._75_RIBBONS);
    }
    if (ribbonsInStats >= 50) {
      globalScene.validateAchv(achvs._50_RIBBONS);
    }
    if (ribbonsInStats >= 25) {
      globalScene.validateAchv(achvs._25_RIBBONS);
    }
    if (ribbonsInStats >= 10) {
      globalScene.validateAchv(achvs._10_RIBBONS);
    }

    return ++this.starterData[speciesIdToIncrement].classicWinCount;
  }

  /**
   * Adds a candy to the player's game data for a given {@linkcode PokemonSpecies}.
   * Will do nothing if the player does not have the Pokemon owned in their system save data.
   * @param species
   * @param count
   */
  addStarterCandy(species: PokemonSpecies, count: number): void {
    // Only gain candies if the Pokemon has already been marked as caught in dex (ignore "rental" pokemon)
    const speciesRootForm = species.getRootSpeciesId();
    if (globalScene.gameData.dexData[speciesRootForm].caughtAttr) {
      globalScene.candyBar.showStarterSpeciesCandy(species.speciesId, count);
      this.starterData[species.speciesId].candyCount += count;
    }
  }

  /**
   *
   * @param species
   * @param eggMoveIndex
   * @param showMessage Default true. If true, will display message for unlocked egg move
   * @param prependSpeciesToMessage Default false. If true, will change message from "X Egg Move Unlocked!" to "Bulbasaur X Egg Move Unlocked!"
   */
  setEggMoveUnlocked(
    species: PokemonSpecies,
    eggMoveIndex: number,
    showMessage = true,
    prependSpeciesToMessage = false,
  ): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const speciesId = species.speciesId;
      if (!speciesEggMoves.hasOwnProperty(speciesId) || !speciesEggMoves[speciesId][eggMoveIndex]) {
        resolve(false);
        return;
      }

      if (!this.starterData[speciesId].eggMoves) {
        this.starterData[speciesId].eggMoves = 0;
      }

      const value = 1 << eggMoveIndex;

      if (this.starterData[speciesId].eggMoves & value) {
        resolve(false);
        return;
      }

      this.starterData[speciesId].eggMoves |= value;
      if (!showMessage) {
        resolve(true);
        return;
      }
      globalScene.playSound("level_up_fanfare");
      const moveName = allMoves[speciesEggMoves[speciesId][eggMoveIndex]].name;
      let message = prependSpeciesToMessage ? species.getName() + " " : "";
      message +=
        eggMoveIndex === 3
          ? i18next.t("egg:rareEggMoveUnlock", { moveName })
          : i18next.t("egg:eggMoveUnlock", { moveName });

      globalScene.ui.showText(message, null, () => resolve(true), null, true);
    });
  }

  /**
   * Checks whether the root species of a given {@PokemonSpecies} has been unlocked in the dex
   */
  isRootSpeciesUnlocked(species: PokemonSpecies): boolean {
    return !!this.dexData[species.getRootSpeciesId()]?.caughtAttr;
  }

  /**
   * Unlocks the given {@linkcode Nature} for a {@linkcode PokemonSpecies} and its prevolutions.
   * Will fail silently if root species has not been unlocked
   */
  unlockSpeciesNature(species: PokemonSpecies, nature: Nature): void {
    if (!this.isRootSpeciesUnlocked(species)) {
      return;
    }

    //recursively unlock nature for species and prevolutions
    const _unlockSpeciesNature = (speciesId: SpeciesId) => {
      this.dexData[speciesId].natureAttr |= 1 << (nature + 1);
      if (pokemonPrevolutions.hasOwnProperty(speciesId)) {
        _unlockSpeciesNature(pokemonPrevolutions[speciesId]);
      }
    };
    _unlockSpeciesNature(species.speciesId);
  }

  updateSpeciesDexIvs(speciesId: SpeciesId, ivs: number[]): void {
    let dexEntry: DexEntry;
    do {
      dexEntry = globalScene.gameData.dexData[speciesId];
      const dexIvs = dexEntry.ivs;
      for (let i = 0; i < dexIvs.length; i++) {
        if (dexIvs[i] < ivs[i]) {
          dexIvs[i] = ivs[i];
        }
      }
      if (dexIvs.filter(iv => iv === 31).length === 6) {
        globalScene.validateAchv(achvs.PERFECT_IVS);
      }
    } while (pokemonPrevolutions.hasOwnProperty(speciesId) && (speciesId = pokemonPrevolutions[speciesId]));
  }

  getSpeciesCount(dexEntryPredicate: (entry: DexEntry) => boolean): number {
    const dexKeys = Object.keys(this.dexData);
    let speciesCount = 0;
    for (const s of dexKeys) {
      if (dexEntryPredicate(this.dexData[s])) {
        speciesCount++;
      }
    }
    return speciesCount;
  }

  getStarterCount(dexEntryPredicate: (entry: DexEntry) => boolean): number {
    const starterKeys = Object.keys(speciesStarterCosts);
    let starterCount = 0;
    for (const s of starterKeys) {
      const starterDexEntry = this.dexData[s];
      if (dexEntryPredicate(starterDexEntry)) {
        starterCount++;
      }
    }
    return starterCount;
  }

  getSpeciesDefaultDexAttr(species: PokemonSpecies, _forSeen = false, optimistic = false): bigint {
    let ret = 0n;
    const dexEntry = this.dexData[species.speciesId];
    const attr = dexEntry.caughtAttr;
    if (optimistic) {
      if (attr & DexAttr.SHINY) {
        ret |= DexAttr.SHINY;

        if (attr & DexAttr.VARIANT_3) {
          ret |= DexAttr.VARIANT_3;
        } else if (attr & DexAttr.VARIANT_2) {
          ret |= DexAttr.VARIANT_2;
        } else {
          ret |= DexAttr.DEFAULT_VARIANT;
        }
      } else {
        ret |= DexAttr.NON_SHINY;
        ret |= DexAttr.DEFAULT_VARIANT;
      }
    } else {
      // Default to non shiny. Fallback to shiny if it's the only thing that's unlocked
      ret |= attr & DexAttr.NON_SHINY || !(attr & DexAttr.SHINY) ? DexAttr.NON_SHINY : DexAttr.SHINY;

      if (attr & DexAttr.DEFAULT_VARIANT) {
        ret |= DexAttr.DEFAULT_VARIANT;
      } else if (attr & DexAttr.VARIANT_2) {
        ret |= DexAttr.VARIANT_2;
      } else if (attr & DexAttr.VARIANT_3) {
        ret |= DexAttr.VARIANT_3;
      } else {
        ret |= DexAttr.DEFAULT_VARIANT;
      }
    }
    ret |= attr & DexAttr.MALE || !(attr & DexAttr.FEMALE) ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= this.getFormAttr(this.getFormIndex(attr));
    return ret;
  }

  getSpeciesDexAttrProps(_species: PokemonSpecies, dexAttr: bigint): DexAttrProps {
    const shiny = !(dexAttr & DexAttr.NON_SHINY);
    const female = !(dexAttr & DexAttr.MALE);
    let variant: Variant = 0;
    if (dexAttr & DexAttr.DEFAULT_VARIANT) {
      variant = 0;
    } else if (dexAttr & DexAttr.VARIANT_2) {
      variant = 1;
    } else if (dexAttr & DexAttr.VARIANT_3) {
      variant = 2;
    }
    const formIndex = this.getFormIndex(dexAttr);

    return {
      shiny,
      female,
      variant,
      formIndex,
    };
  }

  getStarterSpeciesDefaultAbilityIndex(species: PokemonSpecies, abilityAttr?: number): number {
    abilityAttr ??= this.starterData[species.speciesId].abilityAttr;
    return abilityAttr & AbilityAttr.ABILITY_1 ? 0 : !species.ability2 || abilityAttr & AbilityAttr.ABILITY_2 ? 1 : 2;
  }

  getSpeciesDefaultNature(species: PokemonSpecies, dexEntry?: DexEntry): Nature {
    dexEntry ??= this.dexData[species.speciesId];
    for (let n = 0; n < 25; n++) {
      if (dexEntry.natureAttr & (1 << (n + 1))) {
        return n as Nature;
      }
    }
    return 0 as Nature;
  }

  getSpeciesDefaultNatureAttr(species: PokemonSpecies): number {
    return 1 << this.getSpeciesDefaultNature(species);
  }

  getDexAttrLuck(dexAttr: bigint): number {
    return dexAttr & DexAttr.SHINY ? (dexAttr & DexAttr.VARIANT_3 ? 3 : dexAttr & DexAttr.VARIANT_2 ? 2 : 1) : 0;
  }

  getNaturesForAttr(natureAttr = 0): Nature[] {
    const ret: Nature[] = [];
    for (let n = 0; n < 25; n++) {
      if (natureAttr & (1 << (n + 1))) {
        ret.push(n);
      }
    }
    return ret;
  }

  getSpeciesStarterValue(speciesId: SpeciesId): number {
    const baseValue = speciesStarterCosts[speciesId];
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

    const cost = new NumberHolder(value);
    applyChallenges(ChallengeType.STARTER_COST, speciesId, cost);

    return cost.value;
  }

  getFormIndex(attr: bigint): number {
    if (!attr || attr < DexAttr.DEFAULT_FORM) {
      return 0;
    }
    let f = 0;
    while (!(attr & this.getFormAttr(f))) {
      f++;
    }
    return f;
  }

  getFormAttr(formIndex: number): bigint {
    return BigInt(1) << BigInt(7 + formIndex);
  }

  consolidateDexData(dexData: DexData): void {
    for (const k of Object.keys(dexData)) {
      const entry = dexData[k] as DexEntry;
      if (!entry.hasOwnProperty("hatchedCount")) {
        entry.hatchedCount = 0;
      }
      if (!entry.hasOwnProperty("natureAttr") || (entry.caughtAttr && !entry.natureAttr)) {
        entry.natureAttr = this.defaultDexData?.[k].natureAttr || 1 << randInt(25, 1);
      }
      if (!entry.hasOwnProperty("ribbons")) {
        entry.ribbons = new RibbonData(0);
      }
    }
  }

  migrateStarterAbilities(systemData: SystemSaveData, initialStarterData?: StarterData): void {
    const starterIds = Object.keys(this.starterData).map(s => Number.parseInt(s) as SpeciesId);
    const starterData = initialStarterData || systemData.starterData;
    const dexData = systemData.dexData;
    for (const s of starterIds) {
      const dexAttr = dexData[s].caughtAttr;
      starterData[s].abilityAttr =
        (dexAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
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
}
