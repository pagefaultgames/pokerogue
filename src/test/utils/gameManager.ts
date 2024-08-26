import { updateUserInfo } from "#app/account";
import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import Trainer from "#app/field/trainer";
import { GameModes, getGameMode } from "#app/game-mode";
import { ModifierTypeOption, modifierTypes } from "#app/modifier/modifier-type";
import { CommandPhase } from "#app/phases/command-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { LoginPhase } from "#app/phases/login-phase";
import { MovePhase } from "#app/phases/move-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { SelectTargetPhase } from "#app/phases/select-target-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import ErrorInterceptor from "#app/test/utils/errorInterceptor";
import InputsHandler from "#app/test/utils/inputsHandler";
import { MockClock } from "#app/test/utils/mocks/mockClock";
import CommandUiHandler from "#app/ui/command-ui-handler";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler from "#app/ui/party-ui-handler";
import TargetSelectUiHandler from "#app/ui/target-select-ui-handler";
import { Mode } from "#app/ui/ui";
import { Button } from "#enums/buttons";
import { ExpNotification } from "#enums/exp-notification";
import { GameDataType } from "#enums/game-data-type";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import { generateStarter, waitUntil } from "#test/utils/gameManagerUtils";
import GameWrapper from "#test/utils/gameWrapper";
import PhaseInterceptor from "#test/utils/phaseInterceptor";
import TextInterceptor from "#test/utils/TextInterceptor";
import { AES, enc } from "crypto-js";
import fs from "fs";
import { vi } from "vitest";
import { ClassicModeHelper } from "./helpers/classicModeHelper";
import { DailyModeHelper } from "./helpers/dailyModeHelper";
import { MoveHelper } from "./helpers/moveHelper";
import { OverridesHelper } from "./helpers/overridesHelper";
import { SettingsHelper } from "./helpers/settingsHelper";

/**
 * Class to manage the game state and transitions between phases.
 */
export default class GameManager {
  public gameWrapper: GameWrapper;
  public scene: BattleScene;
  public phaseInterceptor: PhaseInterceptor;
  public textInterceptor: TextInterceptor;
  public inputsHandler: InputsHandler;
  public readonly override: OverridesHelper;
  public readonly move: MoveHelper;
  public readonly classicMode: ClassicModeHelper;
  public readonly dailyMode: DailyModeHelper;
  public readonly settings: SettingsHelper;

  /**
   * Creates an instance of GameManager.
   * @param phaserGame - The Phaser game instance.
   * @param bypassLogin - Whether to bypass the login phase.
   */
  constructor(phaserGame: Phaser.Game, bypassLogin: boolean = true) {
    localStorage.clear();
    ErrorInterceptor.getInstance().clear();
    BattleScene.prototype.randBattleSeedInt = (arg) => arg-1;
    this.gameWrapper = new GameWrapper(phaserGame, bypassLogin);
    this.scene = new BattleScene();
    this.phaseInterceptor = new PhaseInterceptor(this.scene);
    this.textInterceptor = new TextInterceptor(this.scene);
    this.gameWrapper.setScene(this.scene);
    this.override = new OverridesHelper(this);
    this.move = new MoveHelper(this);
    this.classicMode = new ClassicModeHelper(this);
    this.dailyMode = new DailyModeHelper(this);
    this.settings = new SettingsHelper(this);
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
    this.scene.getCurrentPhase()?.end();
  }

  /**
   * Adds an action to be executed on the next prompt.
   * @param phaseTarget - The target phase.
   * @param mode - The mode to wait for.
   * @param callback - The callback to execute.
   * @param expireFn - Optional function to determine if the prompt has expired.
   */
  onNextPrompt(phaseTarget: string, mode: Mode, callback: () => void, expireFn?: () => void, awaitingActionInput: boolean = false) {
    this.phaseInterceptor.addToNextPrompt(phaseTarget, mode, callback, expireFn, awaitingActionInput);
  }

  /**
   * Runs the game to the title phase.
   * @returns A promise that resolves when the title phase is reached.
   */
  async runToTitle(): Promise<void> {
    await this.phaseInterceptor.whenAboutToRun(LoginPhase);
    this.phaseInterceptor.pop();
    await this.phaseInterceptor.run(TitlePhase);

    this.scene.gameSpeed = 5;
    this.scene.moveAnimations = false;
    this.scene.showLevelUpStats = false;
    this.scene.expGainsSpeed = 3;
    this.scene.expParty = ExpNotification.SKIP;
    this.scene.hpBarSpeed = 3;
    this.scene.enableTutorials = false;
    this.scene.gameData.gender = PlayerGender.MALE;

  }

  /**
   * Helper function to run to the final boss encounter as it's a bit tricky due to extra dialogue
   * Also handles Major/Minor bosses from endless modes
   * @param game - The game manager
   * @param species
   * @param mode
   */
  async runToFinalBossEncounter(game: GameManager, species: Species[], mode: GameModes) {
    console.log("===to final boss encounter===");
    await game.runToTitle();

    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      game.scene.gameMode = getGameMode(mode);
      const starters = generateStarter(game.scene, species);
      const selectStarterPhase = new SelectStarterPhase(game.scene);
      game.scene.pushPhase(new EncounterPhase(game.scene, false));
      selectStarterPhase.initBattle(starters);
    });

    game.onNextPrompt("EncounterPhase", Mode.MESSAGE, async () => {
      // This will skip all entry dialogue (I can't figure out a way to sequentially handle the 8 chained messages via 1 prompt handler)
      game.setMode(Mode.MESSAGE);
      const encounterPhase = game.scene.getCurrentPhase() as EncounterPhase;

      // No need to end phase, this will do it for you
      encounterPhase.doEncounterCommon(false);
    });

    await game.phaseInterceptor.to(EncounterPhase, true);
    console.log("===finished run to final boss encounter===");
  }

  /**
   * Transitions to the start of a battle.
   * @param species - Optional array of species to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  async startBattle(species?: Species[]) {
    await this.classicMode.runToSummon(species);

    this.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      this.setMode(Mode.MESSAGE);
      this.endPhase();
    }, () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(TurnInitPhase));

    this.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      this.setMode(Mode.MESSAGE);
      this.endPhase();
    }, () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(TurnInitPhase));

    await this.phaseInterceptor.to(CommandPhase);
    console.log("==================[New Turn]==================");
  }

  /**
   * Emulate a player's target selection after a move is chosen, usually called automatically by {@linkcode MoveHelper.select}.
   * Will trigger during the next {@linkcode SelectTargetPhase}
   * @param {BattlerIndex} targetIndex The index of the attack target, or `undefined` for multi-target attacks
   * @param movePosition The index of the move in the pokemon's moveset array
   */
  selectTarget(movePosition: integer, targetIndex?: BattlerIndex) {
    this.onNextPrompt("SelectTargetPhase", Mode.TARGET_SELECT, () => {
      const handler = this.scene.ui.getHandler() as TargetSelectUiHandler;
      const move = (this.scene.getCurrentPhase() as SelectTargetPhase).getPokemon().getMoveset()[movePosition]!.getMove(); // TODO: is the bang correct?
      if (!move.isMultiTarget()) {
        handler.setCursor(targetIndex !== undefined ? targetIndex : BattlerIndex.ENEMY);
      }
      if (move.isMultiTarget() && targetIndex !== undefined) {
        throw new Error(`targetIndex was passed to selectMove() but move ("${move.name}") is not targetted`);
      }
      handler.processInput(Button.ACTION);
    }, () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(MovePhase) || this.isCurrentPhase(TurnStartPhase) || this.isCurrentPhase(TurnEndPhase));
  }

  /** Faint all opponents currently on the field */
  async doKillOpponents() {
    await this.killPokemon(this.scene.currentBattle.enemyParty[0]);
    if (this.scene.currentBattle.double) {
      await this.killPokemon(this.scene.currentBattle.enemyParty[1]);
    }
  }

  /** Emulate selecting a modifier (item) */
  doSelectModifier() {
    this.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      const handler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.processInput(Button.CANCEL);
    }, () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(NewBattlePhase), true);

    this.onNextPrompt("SelectModifierPhase", Mode.CONFIRM, () => {
      const handler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.processInput(Button.ACTION);
    }, () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(NewBattlePhase));
  }

  forceOpponentToSwitch() {
    const originalMatchupScore = Trainer.prototype.getPartyMemberMatchupScores;
    Trainer.prototype.getPartyMemberMatchupScores = () => {
      Trainer.prototype.getPartyMemberMatchupScores = originalMatchupScore;
      return [[1, 100], [1, 100]];
    };
  }

  /** Transition to the next upcoming {@linkcode CommandPhase} */
  async toNextTurn() {
    await this.phaseInterceptor.to(CommandPhase);
  }

  /** Emulate selecting a modifier (item) and transition to the next upcoming {@linkcode CommandPhase} */
  async toNextWave() {
    this.doSelectModifier();

    this.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      this.setMode(Mode.MESSAGE);
      this.endPhase();
    }, () => this.isCurrentPhase(TurnInitPhase));

    await this.toNextTurn();
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
    return this.scene.getCurrentPhase()?.constructor.name === targetName;
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
      return resolve(localStorage.getItem("toExport")!); // TODO: is this bang correct?;
    });
  }

  /**
   * Imports game data from a file.
   * @param path - The path to the data file.
   * @returns A promise that resolves with a tuple containing a boolean indicating success and an integer status code.
   */
  async importData(path): Promise<[boolean, integer]> {
    const saveKey = "x0i2O7WRiANTqPmZ";
    const dataRaw = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
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

  async killPokemon(pokemon: PlayerPokemon | EnemyPokemon) {
    (this.scene.time as MockClock).overrideDelay = 0.01;
    return new Promise<void>(async (resolve, reject) => {
      pokemon.hp = 0;
      this.scene.pushPhase(new FaintPhase(this.scene, pokemon.getBattlerIndex(), true));
      await this.phaseInterceptor.to(FaintPhase).catch((e) => reject(e));
      (this.scene.time as MockClock).overrideDelay = undefined;
      resolve();
    });
  }

  /**
   * Command an in-battle switch to another Pokemon via the main battle menu.
   * @param pokemonIndex the index of the pokemon in your party to switch to
   */
  doSwitchPokemon(pokemonIndex: number) {
    this.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      (this.scene.ui.getHandler() as CommandUiHandler).setCursor(2);
      (this.scene.ui.getHandler() as CommandUiHandler).processInput(Button.ACTION);
    });

    this.doSelectPartyPokemon(pokemonIndex, "CommandPhase");
  }

  /**
   * Revive pokemon, currently players only.
   * @param pokemonIndex the index of the pokemon in your party to revive
   */
  doRevivePokemon(pokemonIndex: number) {
    const party = this.scene.getParty();
    const candidate = new ModifierTypeOption(modifierTypes.MAX_REVIVE(), 0);
    const modifier = candidate.type!.newModifier(party[pokemonIndex]);
    this.scene.addModifier(modifier, false);
  }

  /**
   * Select a pokemon from the party menu. Only really handles the basic cases
   * of the party UI, where you just need to navigate to a party slot and press
   * Action twice - navigating any menus that come up after you select a party member
   * is not supported.
   * @param slot the index of the pokemon in your party to switch to
   * @param inPhase Which phase to expect the selection to occur in. Typically
   * non-command switch actions happen in SwitchPhase.
   */
  doSelectPartyPokemon(slot: number, inPhase = "SwitchPhase") {
    this.onNextPrompt(inPhase, Mode.PARTY, () => {
      const partyHandler = this.scene.ui.getHandler() as PartyUiHandler;

      partyHandler.setCursor(slot);
      partyHandler.processInput(Button.ACTION); // select party slot
      partyHandler.processInput(Button.ACTION); // send out (or whatever option is at the top)
    });
  }

  /**
   * Intercepts `TurnStartPhase` and mocks the getOrder's return value {@linkcode TurnStartPhase.getOrder}
   * Used to modify the turn order.
   * @param {BattlerIndex[]} order The turn order to set
   * @example
   * ```ts
   * await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
   * ```
   */
  async setTurnOrder(order: BattlerIndex[]): Promise<void> {
    await this.phaseInterceptor.to(TurnStartPhase, false);

    vi.spyOn(this.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue(order);
  }

  /**
   * Removes all held items from enemy pokemon
   */
  removeEnemyHeldItems(): void {
    this.scene.clearEnemyHeldItemModifiers();
    this.scene.clearEnemyModifiers();
    console.log("Enemy held items removed");
  }
}
