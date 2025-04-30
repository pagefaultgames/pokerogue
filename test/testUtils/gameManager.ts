import { updateUserInfo } from "#app/account";
import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { getMoveTargets } from "#app/data/moves/move";
import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import Trainer from "#app/field/trainer";
import { GameModes, getGameMode } from "#app/game-mode";
import { ModifierTypeOption, modifierTypes } from "#app/modifier/modifier-type";
import overrides from "#app/overrides";
import { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { FaintPhase } from "#app/phases/faint-phase";
import { LoginPhase } from "#app/phases/login-phase";
import { MovePhase } from "#app/phases/move-phase";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import type { SelectTargetPhase } from "#app/phases/select-target-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import ErrorInterceptor from "#test/testUtils/errorInterceptor";
import type InputsHandler from "#test/testUtils/inputsHandler";
import type BallUiHandler from "#app/ui/ball-ui-handler";
import type BattleMessageUiHandler from "#app/ui/battle-message-ui-handler";
import type CommandUiHandler from "#app/ui/command-ui-handler";
import type ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import type PartyUiHandler from "#app/ui/party-ui-handler";
import type TargetSelectUiHandler from "#app/ui/target-select-ui-handler";
import { UiMode } from "#enums/ui-mode";
import { isNullOrUndefined } from "#app/utils/common";
import { BattleStyle } from "#enums/battle-style";
import { Button } from "#enums/buttons";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import type { Moves } from "#enums/moves";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PlayerGender } from "#enums/player-gender";
import type { Species } from "#enums/species";
import { generateStarter, waitUntil } from "#test/testUtils/gameManagerUtils";
import GameWrapper from "#test/testUtils/gameWrapper";
import { ChallengeModeHelper } from "#test/testUtils/helpers/challengeModeHelper";
import { ClassicModeHelper } from "#test/testUtils/helpers/classicModeHelper";
import { DailyModeHelper } from "#test/testUtils/helpers/dailyModeHelper";
import { ModifierHelper } from "#test/testUtils/helpers/modifiersHelper";
import { MoveHelper } from "#test/testUtils/helpers/moveHelper";
import { OverridesHelper } from "#test/testUtils/helpers/overridesHelper";
import { ReloadHelper } from "#test/testUtils/helpers/reloadHelper";
import { SettingsHelper } from "#test/testUtils/helpers/settingsHelper";
import PhaseInterceptor from "#test/testUtils/phaseInterceptor";
import TextInterceptor from "#test/testUtils/TextInterceptor";
import { AES, enc } from "crypto-js";
import fs from "node:fs";
import { expect, vi } from "vitest";
import { globalScene } from "#app/global-scene";
import type StarterSelectUiHandler from "#app/ui/starter-select-ui-handler";
import { MockFetch } from "#test/testUtils/mocks/mockFetch";

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
  public readonly challengeMode: ChallengeModeHelper;
  public readonly settings: SettingsHelper;
  public readonly reload: ReloadHelper;
  public readonly modifiers: ModifierHelper;

  /**
   * Creates an instance of GameManager.
   * @param phaserGame - The Phaser game instance.
   * @param bypassLogin - Whether to bypass the login phase.
   */
  constructor(phaserGame: Phaser.Game, bypassLogin = true) {
    localStorage.clear();
    ErrorInterceptor.getInstance().clear();
    BattleScene.prototype.randBattleSeedInt = (range, min = 0) => min + range - 1; // This simulates a max roll
    this.gameWrapper = new GameWrapper(phaserGame, bypassLogin);

    let firstTimeScene = false;

    if (globalScene) {
      this.scene = globalScene;
    } else {
      this.scene = new BattleScene();
      this.gameWrapper.setScene(this.scene);
      firstTimeScene = true;
    }

    this.phaseInterceptor = new PhaseInterceptor(this.scene);

    if (!firstTimeScene) {
      this.scene.reset(false, true);
      (this.scene.ui.handlers[UiMode.STARTER_SELECT] as StarterSelectUiHandler).clearStarterPreferences();
      this.scene.clearAllPhases();

      // Must be run after phase interceptor has been initialized.

      this.scene.pushPhase(new LoginPhase());
      this.scene.pushPhase(new TitlePhase());
      this.scene.shiftPhase();

      this.gameWrapper.scene = this.scene;
    }

    this.textInterceptor = new TextInterceptor(this.scene);
    this.override = new OverridesHelper(this);
    this.move = new MoveHelper(this);
    this.classicMode = new ClassicModeHelper(this);
    this.dailyMode = new DailyModeHelper(this);
    this.challengeMode = new ChallengeModeHelper(this);
    this.settings = new SettingsHelper(this);
    this.reload = new ReloadHelper(this);
    this.modifiers = new ModifierHelper(this);
    this.override.sanitizeOverrides();

    // Disables Mystery Encounters on all tests (can be overridden at test level)
    this.override.mysteryEncounterChance(0);

    global.fetch = vi.fn(MockFetch) as any;
  }

  /**
   * Sets the game mode.
   * @param mode - The mode to set.
   */
  setMode(mode: UiMode) {
    this.scene.ui?.setMode(mode);
  }

  /**
   * Waits until the specified mode is set.
   * @param mode - The mode to wait for.
   * @returns A promise that resolves when the mode is set.
   */
  waitMode(mode: UiMode): Promise<void> {
    return new Promise(async resolve => {
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
   * This can be used to (among other things) simulate inputs or run functions mid-phase.
   * @param phaseTarget - The target phase.
   * @param mode - The mode to wait for.
   * @param callback - The callback function to execute on next prompt.
   * @param expireFn - Optional function to determine if the prompt has expired.
   */
  onNextPrompt(
    phaseTarget: string,
    mode: UiMode,
    callback: () => void,
    expireFn?: () => void,
    awaitingActionInput = false,
  ) {
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
    this.scene.expGainsSpeed = ExpGainsSpeed.SKIP;
    this.scene.expParty = ExpNotification.SKIP;
    this.scene.hpBarSpeed = 3;
    this.scene.enableTutorials = false;
    this.scene.gameData.gender = PlayerGender.MALE; // set initial player gender
    this.scene.battleStyle = this.settings.battleStyle;
    this.scene.fieldVolume = 0;
  }

  /**
   * Helper function to run to the final boss encounter as it's a bit tricky due to extra dialogue
   * Also handles Major/Minor bosses from endless modes
   * @param game - The game manager
   * @param species
   * @param mode
   */
  async runToFinalBossEncounter(species: Species[], mode: GameModes) {
    console.log("===to final boss encounter===");
    await this.runToTitle();

    this.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      this.scene.gameMode = getGameMode(mode);
      const starters = generateStarter(this.scene, species);
      const selectStarterPhase = new SelectStarterPhase();
      this.scene.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });

    // This will consider all battle entry dialog as seens and skip them
    vi.spyOn(this.scene.ui, "shouldSkipDialogue").mockReturnValue(true);

    if (overrides.OPP_HELD_ITEMS_OVERRIDE.length === 0) {
      this.removeEnemyHeldItems();
    }

    await this.phaseInterceptor.to(EncounterPhase);
    console.log("===finished run to final boss encounter===");
  }

  /**
   * Runs the game to a mystery encounter phase.
   * @param encounterType if specified, will expect encounter to have been spawned
   * @param species Optional array of species for party.
   * @returns A promise that resolves when the EncounterPhase ends.
   */
  async runToMysteryEncounter(encounterType?: MysteryEncounterType, species?: Species[]) {
    if (!isNullOrUndefined(encounterType)) {
      this.override.disableTrainerWaves();
      this.override.mysteryEncounter(encounterType);
    }

    await this.runToTitle();

    this.onNextPrompt(
      "TitlePhase",
      UiMode.TITLE,
      () => {
        this.scene.gameMode = getGameMode(GameModes.CLASSIC);
        const starters = generateStarter(this.scene, species);
        const selectStarterPhase = new SelectStarterPhase();
        this.scene.pushPhase(new EncounterPhase(false));
        selectStarterPhase.initBattle(starters);
      },
      () => this.isCurrentPhase(EncounterPhase),
    );

    this.onNextPrompt(
      "EncounterPhase",
      UiMode.MESSAGE,
      () => {
        const handler = this.scene.ui.getHandler() as BattleMessageUiHandler;
        handler.processInput(Button.ACTION);
      },
      () => this.isCurrentPhase(MysteryEncounterPhase),
      true,
    );

    await this.phaseInterceptor.run(EncounterPhase);
    if (!isNullOrUndefined(encounterType)) {
      expect(this.scene.currentBattle?.mysteryEncounter?.encounterType).toBe(encounterType);
    }
  }

  /**
   * @deprecated Use `game.classicMode.startBattle()` or `game.dailyMode.startBattle()` instead
   *
   * Transitions to the start of a battle.
   * @param species - Optional array of species to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  async startBattle(species?: Species[]) {
    await this.classicMode.runToSummon(species);

    if (this.scene.battleStyle === BattleStyle.SWITCH) {
      this.onNextPrompt(
        "CheckSwitchPhase",
        UiMode.CONFIRM,
        () => {
          this.setMode(UiMode.MESSAGE);
          this.endPhase();
        },
        () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(TurnInitPhase),
      );

      this.onNextPrompt(
        "CheckSwitchPhase",
        UiMode.CONFIRM,
        () => {
          this.setMode(UiMode.MESSAGE);
          this.endPhase();
        },
        () => this.isCurrentPhase(CommandPhase) || this.isCurrentPhase(TurnInitPhase),
      );
    }

    await this.phaseInterceptor.to(CommandPhase);
    console.log("==================[New Turn]==================");
  }

  /**
   * Emulate a player's target selection after a move is chosen, usually called automatically by {@linkcode MoveHelper.select}.
   * Will trigger during the next {@linkcode SelectTargetPhase}
   * @param {BattlerIndex} targetIndex The index of the attack target, or `undefined` for multi-target attacks
   * @param movePosition The index of the move in the pokemon's moveset array
   */
  selectTarget(movePosition: number, targetIndex?: BattlerIndex) {
    this.onNextPrompt(
      "SelectTargetPhase",
      UiMode.TARGET_SELECT,
      () => {
        const handler = this.scene.ui.getHandler() as TargetSelectUiHandler;
        const move = (this.scene.getCurrentPhase() as SelectTargetPhase)
          .getPokemon()
          .getMoveset()
          [movePosition].getMove();
        if (!move.isMultiTarget()) {
          handler.setCursor(targetIndex !== undefined ? targetIndex : BattlerIndex.ENEMY);
        }
        if (move.isMultiTarget() && targetIndex !== undefined) {
          throw new Error(`targetIndex was passed to selectMove() but move ("${move.name}") is not targetted`);
        }
        handler.processInput(Button.ACTION);
      },
      () =>
        this.isCurrentPhase(CommandPhase) ||
        this.isCurrentPhase(MovePhase) ||
        this.isCurrentPhase(TurnStartPhase) ||
        this.isCurrentPhase(TurnEndPhase),
    );
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
    this.onNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        const handler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
        handler.processInput(Button.CANCEL);
      },
      () =>
        this.isCurrentPhase(CommandPhase) ||
        this.isCurrentPhase(NewBattlePhase) ||
        this.isCurrentPhase(CheckSwitchPhase),
      true,
    );

    this.onNextPrompt(
      "SelectModifierPhase",
      UiMode.CONFIRM,
      () => {
        const handler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
        handler.processInput(Button.ACTION);
      },
      () =>
        this.isCurrentPhase(CommandPhase) ||
        this.isCurrentPhase(NewBattlePhase) ||
        this.isCurrentPhase(CheckSwitchPhase),
    );
  }

  /**
   * Forces the next enemy selecting a move to use the given move in its moveset against the
   * given target (if applicable).
   * @param moveId {@linkcode Moves} the move the enemy will use
   * @param target {@linkcode BattlerIndex} the target on which the enemy will use the given move
   */
  async forceEnemyMove(moveId: Moves, target?: BattlerIndex) {
    // Wait for the next EnemyCommandPhase to start
    await this.phaseInterceptor.to(EnemyCommandPhase, false);
    const enemy = this.scene.getEnemyField()[(this.scene.getCurrentPhase() as EnemyCommandPhase).getFieldIndex()];
    const legalTargets = getMoveTargets(enemy, moveId);

    vi.spyOn(enemy, "getNextMove").mockReturnValueOnce({
      move: moveId,
      targets:
        target !== undefined && !legalTargets.multiple && legalTargets.targets.includes(target)
          ? [target]
          : enemy.getNextTargets(moveId),
    });

    /**
     * Run the EnemyCommandPhase to completion.
     * This allows this function to be called consecutively to
     * force a move for each enemy in a double battle.
     */
    await this.phaseInterceptor.to(EnemyCommandPhase);
  }

  forceEnemyToSwitch() {
    const originalMatchupScore = Trainer.prototype.getPartyMemberMatchupScores;
    Trainer.prototype.getPartyMemberMatchupScores = () => {
      Trainer.prototype.getPartyMemberMatchupScores = originalMatchupScore;
      return [
        [1, 100],
        [1, 100],
      ];
    };
  }

  /** Transition to the next upcoming {@linkcode CommandPhase} */
  async toNextTurn() {
    await this.phaseInterceptor.to(CommandPhase);
  }

  /** Emulate selecting a modifier (item) and transition to the next upcoming {@linkcode CommandPhase} */
  async toNextWave() {
    this.doSelectModifier();

    this.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        this.setMode(UiMode.MESSAGE);
        this.endPhase();
      },
      () => this.isCurrentPhase(TurnInitPhase),
    );

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
  isCurrentMode(mode: UiMode) {
    return this.scene.ui?.getMode() === mode;
  }

  /**
   * Exports the save data to import it in a test game.
   * @returns A promise that resolves with the exported save data.
   */
  exportSaveToTest(): Promise<string> {
    const saveKey = "x0i2O7WRiANTqPmZ";
    return new Promise(async resolve => {
      const sessionSaveData = this.scene.gameData.getSessionSaveData();
      const encryptedSaveData = AES.encrypt(JSON.stringify(sessionSaveData), saveKey).toString();
      resolve(encryptedSaveData);
    });
  }

  /**
   * Imports game data from a file.
   * @param path - The path to the data file.
   * @returns A promise that resolves with a tuple containing a boolean indicating success and an integer status code.
   */
  async importData(path): Promise<[boolean, number]> {
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

  /**
   * Faints a player or enemy pokemon instantly by setting their HP to 0.
   * @param pokemon The player/enemy pokemon being fainted
   * @returns A promise that resolves once the fainted pokemon's FaintPhase finishes running.
   */
  async killPokemon(pokemon: PlayerPokemon | EnemyPokemon) {
    return new Promise<void>(async (resolve, reject) => {
      pokemon.hp = 0;
      this.scene.pushPhase(new FaintPhase(pokemon.getBattlerIndex(), true));
      await this.phaseInterceptor.to(FaintPhase).catch(e => reject(e));
      resolve();
    });
  }

  /**
   * Command an in-battle switch to another Pokemon via the main battle menu.
   * @param pokemonIndex the index of the pokemon in your party to switch to
   */
  doSwitchPokemon(pokemonIndex: number) {
    this.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
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
    const party = this.scene.getPlayerParty();
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
    this.onNextPrompt(inPhase, UiMode.PARTY, () => {
      const partyHandler = this.scene.ui.getHandler() as PartyUiHandler;

      partyHandler.setCursor(slot);
      partyHandler.processInput(Button.ACTION); // select party slot
      partyHandler.processInput(Button.ACTION); // send out (or whatever option is at the top)
    });
  }

  /**
   * Select the BALL option from the command menu, then press Action; in the BALL
   * menu, select a pokéball type and press Action again to throw it.
   * @param ballIndex the index of the pokeball to throw
   */
  public doThrowPokeball(ballIndex: number) {
    this.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      (this.scene.ui.getHandler() as CommandUiHandler).setCursor(1);
      (this.scene.ui.getHandler() as CommandUiHandler).processInput(Button.ACTION);
    });

    this.onNextPrompt("CommandPhase", UiMode.BALL, () => {
      const ballHandler = this.scene.ui.getHandler() as BallUiHandler;
      ballHandler.setCursor(ballIndex);
      ballHandler.processInput(Button.ACTION); // select ball and throw
    });
  }

  /**
   * Intercepts `TurnStartPhase` and mocks {@linkcode TurnStartPhase.getSpeedOrder}'s return value.
   * Used to manually modify Pokemon turn order.
   * Note: This *DOES NOT* account for priority, only speed.
   * @param {BattlerIndex[]} order The turn order to set
   * @example
   * ```ts
   * await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
   * ```
   */
  async setTurnOrder(order: BattlerIndex[]): Promise<void> {
    await this.phaseInterceptor.to(TurnStartPhase, false);

    vi.spyOn(this.scene.getCurrentPhase() as TurnStartPhase, "getSpeedOrder").mockReturnValue(order);
  }

  /**
   * Removes all held items from enemy pokemon.
   */
  removeEnemyHeldItems(): void {
    this.scene.clearEnemyHeldItemModifiers();
    this.scene.clearEnemyModifiers();
    console.log("Enemy held items removed");
  }
}
