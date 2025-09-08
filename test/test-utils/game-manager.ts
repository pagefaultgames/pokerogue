import { updateUserInfo } from "#app/account";
import { BattleScene } from "#app/battle-scene";
import { getGameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import overrides from "#app/overrides";
import { modifierTypes } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { Button } from "#enums/buttons";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import { GameModes } from "#enums/game-modes";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PlayerGender } from "#enums/player-gender";
import type { PokeballType } from "#enums/pokeball";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { Trainer } from "#field/trainer";
import { ModifierTypeOption } from "#modifiers/modifier-type";
import { CheckSwitchPhase } from "#phases/check-switch-phase";
import { CommandPhase } from "#phases/command-phase";
import { EncounterPhase } from "#phases/encounter-phase";
import { MovePhase } from "#phases/move-phase";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import { NewBattlePhase } from "#phases/new-battle-phase";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import type { SelectTargetPhase } from "#phases/select-target-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { TurnStartPhase } from "#phases/turn-start-phase";
import { ErrorInterceptor } from "#test/test-utils/error-interceptor";
import { generateStarter } from "#test/test-utils/game-manager-utils";
import { GameWrapper } from "#test/test-utils/game-wrapper";
import { ChallengeModeHelper } from "#test/test-utils/helpers/challenge-mode-helper";
import { ClassicModeHelper } from "#test/test-utils/helpers/classic-mode-helper";
import { DailyModeHelper } from "#test/test-utils/helpers/daily-mode-helper";
import { FieldHelper } from "#test/test-utils/helpers/field-helper";
import { ModifierHelper } from "#test/test-utils/helpers/modifiers-helper";
import { MoveHelper } from "#test/test-utils/helpers/move-helper";
import { OverridesHelper } from "#test/test-utils/helpers/overrides-helper";
import { ReloadHelper } from "#test/test-utils/helpers/reload-helper";
import { SettingsHelper } from "#test/test-utils/helpers/settings-helper";
import type { InputsHandler } from "#test/test-utils/inputs-handler";
import { MockFetch } from "#test/test-utils/mocks/mock-fetch";
import { PhaseInterceptor } from "#test/test-utils/phase-interceptor";
import { TextInterceptor } from "#test/test-utils/text-interceptor";
import type { PhaseClass, PhaseString } from "#types/phase-types";
import type { BallUiHandler } from "#ui/handlers/ball-ui-handler";
import type { BattleMessageUiHandler } from "#ui/handlers/battle-message-ui-handler";
import type { CommandUiHandler } from "#ui/handlers/command-ui-handler";
import type { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import type { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import type { StarterSelectUiHandler } from "#ui/handlers/starter-select-ui-handler";
import type { TargetSelectUiHandler } from "#ui/handlers/target-select-ui-handler";
import { isNullOrUndefined } from "#utils/common";
import fs from "node:fs";
import { AES, enc } from "crypto-js";
import { expect, vi } from "vitest";

/**
 * Class to manage the game state and transitions between phases.
 */
export class GameManager {
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
  public readonly field: FieldHelper;

  /**
   * Creates an instance of GameManager.
   * @param phaserGame - The Phaser game instance.
   * @param bypassLogin - Whether to bypass the login phase.
   */
  constructor(phaserGame: Phaser.Game, bypassLogin = true) {
    localStorage.clear();
    ErrorInterceptor.getInstance().clear();
    // Simulate max rolls on RNG functions
    // TODO: Create helpers for disabling/enabling battle RNG
    BattleScene.prototype.randBattleSeedInt = (range, min = 0) => min + range - 1;
    this.gameWrapper = new GameWrapper(phaserGame, bypassLogin);

    // TODO: Figure out a way to optimize and re-use the same game manager for each test

    // Re-use an existing `globalScene` if present, or else create a new scene from scratch.
    if (globalScene) {
      this.scene = globalScene;
      this.phaseInterceptor = new PhaseInterceptor(this.scene);
      this.resetScene();
    } else {
      this.scene = new BattleScene();
      this.phaseInterceptor = new PhaseInterceptor(this.scene);
      this.gameWrapper.setScene(this.scene);
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
    this.field = new FieldHelper(this);

    this.initDefaultOverrides();

    // TODO: remove `any` assertion
    global.fetch = vi.fn(MockFetch) as any;
  }

  /** Reset a prior `BattleScene` instance to the proper initial state. */
  private resetScene(): void {
    this.scene.reset(false, true);
    (this.scene.ui.handlers[UiMode.STARTER_SELECT] as StarterSelectUiHandler).clearStarterPreferences();

    this.gameWrapper.scene = this.scene;

    this.scene.phaseManager.toTitleScreen(true);
    this.scene.phaseManager.shiftPhase();
  }

  /**
   * Initialize various default overrides for starting tests, typically to alleviate randomness.
   */
  // TODO: This should not be here
  private initDefaultOverrides(): void {
    // Disables Mystery Encounters on all tests (can be overridden at test level)
    this.override.mysteryEncounterChance(0);
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
  // TODO: This is unused
  async waitMode(mode: UiMode): Promise<void> {
    await vi.waitUntil(() => this.scene.ui?.getMode() === mode);
  }

  /**
   * End the currently running phase immediately.
   */
  endPhase() {
    this.scene.phaseManager.getCurrentPhase().end();
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
    // Go to login phase and skip past it
    await this.phaseInterceptor.to("LoginPhase", false);
    this.phaseInterceptor.shiftPhase(true);
    await this.phaseInterceptor.to("TitlePhase");

    // TODO: This should be moved to a separate initialization method
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
   * @param species - Array of {@linkcode SpeciesId}s to start the final battle with.
   * @param mode - The {@linkcode GameModes} to spawn the final boss encounter in.
   */
  async runToFinalBossEncounter(species: SpeciesId[], mode: GameModes) {
    await this.runToTitle();

    this.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      this.scene.gameMode = getGameMode(mode);
      const starters = generateStarter(this.scene, species);
      const selectStarterPhase = new SelectStarterPhase();
      this.scene.phaseManager.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });

    // This will consider all battle entry dialog as seens and skip them
    vi.spyOn(this.scene.ui, "shouldSkipDialogue").mockReturnValue(true);

    if (overrides.ENEMY_HELD_ITEMS_OVERRIDE.length === 0) {
      this.removeEnemyHeldItems();
    }

    await this.phaseInterceptor.to("CommandPhase", false);
    console.log("==================[Final Boss Encounter]==================");
  }

  /**
   * Runs the game to a mystery encounter phase.
   * @param encounterType - If specified, will expect encounter to be the given type.
   * @param species - Optional array of species for party to start with.
   * @returns A Promise that resolves when the EncounterPhase ends.
   */
  async runToMysteryEncounter(encounterType?: MysteryEncounterType, species?: SpeciesId[]) {
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
        this.scene.phaseManager.pushPhase(new EncounterPhase(false));
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

    await this.phaseInterceptor.to("EncounterPhase");
    if (!isNullOrUndefined(encounterType)) {
      expect(this.scene.currentBattle?.mysteryEncounter?.encounterType).toBe(encounterType);
    }
  }

  /**
   * Emulate a player's target selection after a move is chosen, usually called automatically by {@linkcode MoveHelper.select}.
   * Will trigger during the next {@linkcode SelectTargetPhase}
   * @param targetIndex - The {@linkcode BattlerIndex} of the attack target, or `undefined` for multi-target attacks
   * @param movePosition - The 0-indexed position of the move in the pokemon's moveset array
   * @throws Immediately fails tests
   */
  selectTarget(movePosition: number, targetIndex?: BattlerIndex) {
    this.onNextPrompt(
      "SelectTargetPhase",
      UiMode.TARGET_SELECT,
      () => {
        const handler = this.scene.ui.getHandler() as TargetSelectUiHandler;
        const move = (this.scene.phaseManager.getCurrentPhase() as SelectTargetPhase)
          .getPokemon()
          .getMoveset()
          [movePosition].getMove();

        // Multi target attacks do not select a target
        if (move.isMultiTarget()) {
          if (targetIndex !== undefined) {
            expect.fail(`targetIndex was passed to selectMove() but move ("${move.name}") is not targeted`);
          }
        } else {
          handler.setCursor(targetIndex ?? BattlerIndex.ENEMY);
        }
        handler.processInput(Button.ACTION);
      },
      () =>
        this.isCurrentPhase(CommandPhase)
        || this.isCurrentPhase(MovePhase)
        || this.isCurrentPhase(TurnStartPhase)
        || this.isCurrentPhase(TurnEndPhase),
    );
  }

  /** Faint all opponents currently on the field */
  async doKillOpponents() {
    await this.killPokemon(this.scene.currentBattle.enemyParty[0]);
    if (this.scene.currentBattle.double) {
      await this.killPokemon(this.scene.currentBattle.enemyParty[1]);
    }
  }

  /** Queue up button presses to skip taking an item on the next {@linkcode SelectModifierPhase} */
  doSelectModifier() {
    this.onNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        const handler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
        handler.processInput(Button.CANCEL);
      },
      () =>
        this.isCurrentPhase(CommandPhase)
        || this.isCurrentPhase(NewBattlePhase)
        || this.isCurrentPhase(CheckSwitchPhase),
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
        this.isCurrentPhase(CommandPhase)
        || this.isCurrentPhase(NewBattlePhase)
        || this.isCurrentPhase(CheckSwitchPhase),
    );
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

  /**
   * Transition to the first {@linkcode CommandPhase} of the next turn.
   * @returns A promise that resolves once the next {@linkcode CommandPhase} has been reached.
   */
  async toNextTurn() {
    await this.phaseInterceptor.to("TurnInitPhase");
    await this.phaseInterceptor.to("CommandPhase");
    console.log("==================[New Turn]==================");
  }

  /** Transition to the {@linkcode TurnEndPhase | end of the current turn}. */
  async toEndOfTurn() {
    await this.phaseInterceptor.to("TurnEndPhase");
    console.log("==================[End of Turn]==================");
  }

  /**
   * Queue up button presses to skip taking an item on the next {@linkcode SelectModifierPhase},
   * and then transition to the next {@linkcode CommandPhase}.
   */
  async toNextWave() {
    this.doSelectModifier();

    // forcibly end the message box for switching pokemon
    this.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        this.setMode(UiMode.MESSAGE);
        this.endPhase();
      },
      () => this.isCurrentPhase(TurnInitPhase),
    );

    await this.phaseInterceptor.to("TurnInitPhase");
    await this.phaseInterceptor.to("CommandPhase");
    console.log("==================[New Wave]==================");
  }

  /**
   * Check if the player has won the battle.
   * @returns whether the player has won the battle (all opposing Pokemon have been fainted)
   */
  isVictory() {
    return this.scene.currentBattle.enemyParty.every(pokemon => pokemon.isFainted());
  }

  /**
   * Checks if the current phase matches the target phase.
   * @param phaseTarget - The target phase.
   * @returns Whether the current phase matches the target phase
   * @todo Remove `phaseClass` from signature
   */
  isCurrentPhase(phaseTarget: PhaseClass | PhaseString) {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    return this.scene.phaseManager.getCurrentPhase().phaseName === targetName;
  }

  /**
   * Checks if the current mode matches the target mode.
   * @param mode - The target {@linkcode UiMode} to check.
   * @returns Whether the current mode matches the target mode.
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
   * Faint a player or enemy pokemon instantly by setting their HP to 0.
   * @param pokemon - The player/enemy pokemon being fainted
   * @returns A Promise that resolves once the fainted pokemon's FaintPhase finishes running.
   */
  async killPokemon(pokemon: PlayerPokemon | EnemyPokemon) {
    pokemon.hp = 0;
    this.scene.phaseManager.pushNew("FaintPhase", pokemon.getBattlerIndex(), true);
    await this.phaseInterceptor.to("FaintPhase");
  }

  /**
   * Command an in-battle switch to another {@linkcode Pokemon} via the main battle menu.
   * @param pokemonIndex - The 0-indexed position of the party pokemon to switch to.
   * Should never be called with 0 as that will select the currently active pokemon and freeze.
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
   * @param pokemonIndex - The 0-indexed position of the pokemon in your party to revive
   */
  doRevivePokemon(pokemonIndex: number) {
    const party = this.scene.getPlayerParty();
    const candidate = new ModifierTypeOption(modifierTypes.MAX_REVIVE(), 0);
    const modifier = candidate.type!.newModifier(party[pokemonIndex]);
    this.scene.addModifier(modifier, false);
  }

  /**
   * Select a pokemon from the party menu during the given phase.
   * Only really handles the basic case of "navigate to party slot and press Action twice" -
   * any menus that come up afterwards are ignored and must be handled separately by the caller.
   * @param slot - The 0-indexed position of the pokemon in your party to switch to
   * @param inPhase - Which phase to expect the selection to occur in. Defaults to `SwitchPhase`
   * (which is where the majority of non-command switch operations occur).
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
   * @param ballIndex - The {@linkcode PokeballType} to throw
   */
  public doThrowPokeball(ballIndex: PokeballType) {
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
   * Note: This *DOES NOT* account for priority.
   * @param order - The turn order to set as an array of {@linkcode BattlerIndex}es.
   * @example
   * ```ts
   * await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
   * ```
   */
  async setTurnOrder(order: BattlerIndex[]): Promise<void> {
    await this.phaseInterceptor.to("TurnStartPhase", false);

    vi.spyOn(this.scene.phaseManager.getCurrentPhase() as TurnStartPhase, "getSpeedOrder").mockReturnValue(order);
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
