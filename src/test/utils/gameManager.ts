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
import {GameModes} from "#app/game-mode";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {updateUserInfo} from "#app/account";
import {Species} from "#app/data/enums/species";
import {PlayerGender} from "#app/data/enums/player-gender";
import {GameDataType} from "#app/data/enums/game-data-type";
import InputsHandler from "#app/test/utils/inputsHandler";

export default class GameManager {
  public gameWrapper: GameWrapper;
  public scene: BattleScene;
  public phaseInterceptor: PhaseInterceptor;
  public textInterceptor: TextInterceptor;
  public inputsHandler: InputsHandler;

  constructor(phaserGame: Phaser.Game, bypassLogin: boolean = true) {
    BattleScene.prototype.randBattleSeedInt = (arg) => arg-1;
    this.gameWrapper = new GameWrapper(phaserGame, bypassLogin);
    this.scene = new BattleScene();
    this.phaseInterceptor = new PhaseInterceptor(this.scene);
    this.textInterceptor = new TextInterceptor(this.scene);
    this.gameWrapper.setScene(this.scene);
    this.inputsHandler = new InputsHandler(this.scene);
  }

  setMode(mode: Mode) {
    this.scene.ui?.setMode(mode);
  }

  waitMode(mode: Mode): Promise<void> {
    return new Promise(async (resolve) => {
      await waitUntil(() => this.scene.ui?.getMode() === mode);
      return resolve();
    });
  }

  endPhase() {
    this.scene.getCurrentPhase().end();
  }

  onNextPrompt(phaseTarget: string, mode: Mode, callback: () => void, expireFn?: () => void) {
    this.phaseInterceptor.addToNextPrompt(phaseTarget, mode, callback, expireFn);
  }

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
      this.scene.expParty = 3;
      this.scene.hpBarSpeed = 3;
      resolve();
    });
  }

  runToSummon(species?: Species[]): Promise<void> {
    return new Promise(async(resolve) => {
      await this.runToTitle();
      this.onNextPrompt("TitlePhase", Mode.TITLE, () => {
        const starters = generateStarter(this.scene, species);
        const selectStarterPhase = new SelectStarterPhase(this.scene, GameModes.CLASSIC);
        this.scene.pushPhase(new EncounterPhase(this.scene, false));
        selectStarterPhase.initBattle(starters);
      });
      await this.phaseInterceptor.run(EncounterPhase);
      resolve();
    });
  }

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

  // doAttack(moveIndex, pokemonIndex= 0, target= 0): Promise<void> {
  //   const mode = this.scene.ui?.getMode();
  //   return new Promise(async (resolve, reject) => {
  //     if (mode !== Mode.COMMAND) {
  //       return reject("Invalid mode");
  //     }
  //     this.scene.ui.setMode(Mode.FIGHT, (this.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
  //     await waitUntil(() => this.scene.ui.getMode() === Mode.FIGHT);
  //     const movePosition = await this.getMovePosition(this.scene, pokemonIndex, moveIndex);
  //     (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
  //
  //     //Message if opp is KO, Command if waiting for player to choose next action
  //     await waitUntil(() => (this.isVictory() && this.scene.ui?.getMode() === Mode.MESSAGE) || this.scene.ui?.getMode() === Mode.COMMAND);
  //     return resolve();
  //   });
  // }
  //
  // doAttackDouble(moveIndex, moveIndex2, target= 0, target2): Promise<void> {
  //   const mode = this.scene.ui?.getMode();
  //   return new Promise(async (resolve, reject) => {
  //     if (mode !== Mode.COMMAND) {
  //       return reject("Invalid mode");
  //     }
  //     this.scene.ui.setMode(Mode.FIGHT, (this.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
  //     await waitUntil(() => this.scene.ui.getMode() === Mode.FIGHT);
  //     const movePosition = await getMovePosition(this.scene, 0, moveIndex);
  //     const movePosition2 = await getMovePosition(this.scene, 1, moveIndex2);
  //     (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
  //     if (this.scene.currentBattle.double) {
  //       await waitUntil(() => this.scene.ui?.getMode() === Mode.TARGET_SELECT);
  //       let targetHandler = this.scene.ui.getHandler() as TargetSelectUiHandler;
  //       targetHandler.processInput(Button.ACTION);
  //       await waitUntil(() => this.scene.ui.getMode() === Mode.COMMAND);
  //       this.scene.ui.setMode(Mode.FIGHT, (this.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
  //       await waitUntil(() => this.scene.ui.getMode() === Mode.FIGHT);
  //       (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition2, false);
  //       await waitUntil(() => this.scene.ui?.getMode() === Mode.TARGET_SELECT);
  //       targetHandler = this.scene.ui.getHandler() as TargetSelectUiHandler;
  //       targetHandler.processInput(Button.ACTION);
  //     }
  //
  //
  //     //Message if opp is KO, Command if waiting for player to choose next action
  //     await waitUntil(() => (this.isVictory() && this.scene.ui?.getMode() === Mode.MESSAGE) || this.scene.ui?.getMode() === Mode.COMMAND);
  //     return resolve();
  //   });
  // }

  isVictory() {
    return this.scene.currentBattle.enemyParty.every(pokemon => pokemon.isFainted());
  }

  isCurrentPhase(phaseTarget) {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    return this.scene.getCurrentPhase().constructor.name === targetName;
  }

  isCurrentMode(mode: Mode) {
    return this.scene.ui?.getMode() === mode;
  }

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
