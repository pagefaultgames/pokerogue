import GameWrapper from "#app/test/utils/gameWrapper";
import {Mode} from "#app/ui/ui";
import {generateStarter, waitUntil} from "#app/test/utils/gameManagerUtils";
import {
  CheckSwitchPhase,
  CommandPhase,
  EncounterPhase,
  LoginPhase,
  PostSummonPhase,
  SelectGenderPhase,
  SelectStarterPhase,
  SummonPhase,
  TitlePhase,
  ToggleDoublePositionPhase,
} from "#app/phases";
import BattleScene from "#app/battle-scene.js";
import PhaseInterceptor from "#app/test/utils/phaseInterceptor";
import TextInterceptor from "#app/test/utils/TextInterceptor";
import {expect} from "vitest";
import {GameModes, getGameMode} from "#app/game-mode";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {updateUserInfo} from "#app/account";
import {Species} from "#app/data/enums/species";
import {PlayerGender} from "#app/data/enums/player-gender";
import {GameDataType} from "#app/data/enums/game-data-type";
import InputsHandler from "#app/test/utils/inputsHandler";
import {ExpNotification} from "#app/enums/exp-notification";

/**
 * Class to manage the game state and transitions between phases.
 */
export default class GameManager {
  public gameWrapper: GameWrapper;
  public scene: BattleScene;
  public phaseInterceptor: PhaseInterceptor;
  public textInterceptor: TextInterceptor;
  public inputsHandler: InputsHandler;

  /**
   * Creates an instance of GameManager.
   * @param phaserGame - The Phaser game instance.
   * @param bypassLogin - Whether to bypass the login phase.
   */
  constructor(phaserGame: Phaser.Game, bypassLogin: boolean = true) {
    BattleScene.prototype.randBattleSeedInt = (arg) => arg-1;
    this.gameWrapper = new GameWrapper(phaserGame, bypassLogin);
    this.scene = new BattleScene();
    this.phaseInterceptor = new PhaseInterceptor(this.scene);
    this.textInterceptor = new TextInterceptor(this.scene);
    this.gameWrapper.setScene(this.scene);
  }

  /**
   * Sets the game mode.
   * @param mode - The mode to set.
   */
  setMode(mode: Mode) {
    this.scene.ui?.setMode(mode);
  }

  /**
   * Waits until the specified mode is set.
   * @param mode - The mode to wait for.
   * @returns A promise that resolves when the mode is set.
   */
  waitMode(mode: Mode): Promise<void> {
    return new Promise(async (resolve) => {
      await waitUntil(() => this.scene.ui?.getMode() === mode);
      return resolve();
    });
  }

  /**
   * Ends the current phase.
   */
  endPhase() {
    this.scene.getCurrentPhase().end();
  }

  /**
   * Adds an action to be executed on the next prompt.
   * @param phaseTarget - The target phase.
   * @param mode - The mode to wait for.
   * @param callback - The callback to execute.
   * @param expireFn - Optional function to determine if the prompt has expired.
   */
  onNextPrompt(phaseTarget: string, mode: Mode, callback: () => void, expireFn?: () => void) {
    this.phaseInterceptor.addToNextPrompt(phaseTarget, mode, callback, expireFn);
  }

  /**
   * Runs the game to the title phase.
   * @returns A promise that resolves when the title phase is reached.
   */
  runToTitle(): Promise<void> {
    return new Promise(async(resolve) => {
      await this.phaseInterceptor.run(LoginPhase);
      this.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
        this.scene.gameData.gender = PlayerGender.MALE;
        this.endPhase();
      }, () => this.isCurrentPhase(TitlePhase));
      await this.phaseInterceptor.run(SelectGenderPhase, () => this.isCurrentPhase(TitlePhase));
      await this.phaseInterceptor.run(TitlePhase);
      this.scene.gameSpeed = 5;
      this.scene.moveAnimations = false;
      this.scene.showLevelUpStats = false;
      this.scene.expGainsSpeed = 3;
      this.scene.expParty = ExpNotification.SKIP;
      this.scene.hpBarSpeed = 3;
      resolve();
    });
  }

  /**
   * Runs the game to the summon phase.
   * @param species - Optional array of species to summon.
   * @returns A promise that resolves when the summon phase is reached.
   */
  runToSummon(species?: Species[]): Promise<void> {
    return new Promise(async(resolve) => {
      await this.runToTitle();
      this.onNextPrompt("TitlePhase", Mode.TITLE, () => {
        this.scene.gameMode = getGameMode(GameModes.CLASSIC);
        const starters = generateStarter(this.scene, species);
        const selectStarterPhase = new SelectStarterPhase(this.scene);
        this.scene.pushPhase(new EncounterPhase(this.scene, false));
        selectStarterPhase.initBattle(starters);
      });
      await this.phaseInterceptor.run(EncounterPhase);
      resolve();
    });
  }

  /**
   * Starts a battle.
   * @param species - Optional array of species to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  startBattle(species?: Species[]): Promise<void> {
    return new Promise(async(resolve) => {
      await this.runToSummon(species);
      await this.phaseInterceptor.runFrom(PostSummonPhase).to(ToggleDoublePositionPhase);
      await this.phaseInterceptor.run(SummonPhase, () => this.isCurrentPhase(CheckSwitchPhase) || this.isCurrentPhase(PostSummonPhase));
      this.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
        this.setMode(Mode.MESSAGE);
        this.endPhase();
      }, () => this.isCurrentPhase(PostSummonPhase));
      this.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
        this.setMode(Mode.MESSAGE);
        this.endPhase();
      }, () => this.isCurrentPhase(PostSummonPhase));
      await this.phaseInterceptor.run(CheckSwitchPhase, () => this.isCurrentPhase(PostSummonPhase));
      await this.phaseInterceptor.run(CheckSwitchPhase, () => this.isCurrentPhase(PostSummonPhase));
      await this.phaseInterceptor.runFrom(PostSummonPhase).to(CommandPhase);
      await waitUntil(() => this.scene.ui?.getMode() === Mode.COMMAND);
      console.log("==================[New Turn]==================");
      expect(this.scene.ui?.getMode()).toBe(Mode.COMMAND);
      expect(this.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
      return resolve();
    });
  }

  /**
   * Checks if the player has won the battle.
   * @returns True if the player has won, otherwise false.
   */
  isVictory() {
    return this.scene.currentBattle.enemyParty.every(pokemon => pokemon.isFainted());
  }

  /**
   * Checks if the current phase matches the target phase.
   * @param phaseTarget - The target phase.
   * @returns True if the current phase matches the target phase, otherwise false.
   */
  isCurrentPhase(phaseTarget) {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    return this.scene.getCurrentPhase().constructor.name === targetName;
  }

  /**
   * Checks if the current mode matches the target mode.
   * @param mode - The target mode.
   * @returns True if the current mode matches the target mode, otherwise false.
   */
  isCurrentMode(mode: Mode) {
    return this.scene.ui?.getMode() === mode;
  }

  /**
   * Exports the save data to import it in a test game.
   * @returns A promise that resolves with the exported save data.
   */
  exportSaveToTest(): Promise<string> {
    return new Promise(async (resolve) => {
      await this.scene.gameData.saveAll(this.scene, true, true, true, true);
      this.scene.reset(true);
      await waitUntil(() => this.scene.ui?.getMode() === Mode.TITLE);
      await this.scene.gameData.tryExportData(GameDataType.SESSION, 0);
      await waitUntil(() => localStorage.hasOwnProperty("toExport"));
      return resolve(localStorage.getItem("toExport"));
    });
  }

  /**
   * Imports game data from a file.
   * @param path - The path to the data file.
   * @returns A promise that resolves with a tuple containing a boolean indicating success and an integer status code.
   */
  async importData(path): Promise<[boolean, integer]> {
    const saveKey = "x0i2O7WRiANTqPmZ";
    const dataRaw = fs.readFileSync(path, {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(dataRaw, saveKey).toString(enc.Utf8);
    dataStr = this.scene.gameData.convertSystemDataStr(dataStr);
    const systemData = this.scene.gameData.parseSystemData(dataStr);
    const valid = !!systemData.dexData && !!systemData.timestamp;
    if (valid) {
      await updateUserInfo();
      await this.scene.gameData.initSystem(dataStr);
    }
    return updateUserInfo();
  }
}
