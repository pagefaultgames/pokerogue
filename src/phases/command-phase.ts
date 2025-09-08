import type { TurnCommand } from "#app/battle";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { speciesStarterCosts } from "#balance/starters";
import { TrappedTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { ChallengeType } from "#enums/challenge-type";
import { Command } from "#enums/command";
import { FieldPosition } from "#enums/field-position";
import { MoveId } from "#enums/move-id";
import { isIgnorePP, isVirtual, MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PokeballType } from "#enums/pokeball";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import type { MoveTargetSet } from "#moves/move";
import { getMoveTargets } from "#moves/move-utils";
import type { PokemonMove } from "#moves/pokemon-move";
import { FieldPhase } from "#phases/field-phase";
import type { TurnMove } from "#types/turn-move";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder } from "#utils/common";
import i18next from "i18next";

export class CommandPhase extends FieldPhase {
  public readonly phaseName = "CommandPhase";
  protected fieldIndex: number;

  /**
   * Whether the command phase is handling a switch command
   */
  private isSwitch = false;

  constructor(fieldIndex: number) {
    super();

    this.fieldIndex = fieldIndex;
  }

  /**
   * Resets the cursor to the position of {@linkcode Command.FIGHT} if any of the following are true
   * - The setting to remember the last action is not enabled
   * - This is the first turn of a mystery encounter, trainer battle, or the END biome
   * - The cursor is currently on the POKEMON command
   */
  private resetCursorIfNeeded(): void {
    const commandUiHandler = globalScene.ui.handlers[UiMode.COMMAND];
    const { arena, commandCursorMemory, currentBattle } = globalScene;
    const { battleType, turn } = currentBattle;
    const { biomeType } = arena;

    // If one of these conditions is true, we always reset the cursor to Command.FIGHT
    const cursorResetEvent =
      battleType === BattleType.MYSTERY_ENCOUNTER || battleType === BattleType.TRAINER || biomeType === BiomeId.END;

    if (!commandUiHandler) {
      return;
    }
    if (
      (turn === 1 && (!commandCursorMemory || cursorResetEvent))
      || commandUiHandler.getCursor() === Command.POKEMON
    ) {
      commandUiHandler.setCursor(Command.FIGHT);
    }
  }

  /**
   * Submethod of {@linkcode start} that validates field index logic for nonzero field indices.
   * Must only be called if the field index is nonzero.
   */
  private handleFieldIndexLogic(): void {
    // If we somehow are attempting to check the right pokemon but there's only one pokemon out
    // Switch back to the center pokemon. This can happen rarely in double battles with mid turn switching
    // TODO: Prevent this from happening in the first place
    if (globalScene.getPlayerField().filter(p => p.isActive()).length === 1) {
      this.fieldIndex = FieldPosition.CENTER;
      return;
    }

    const allyCommand = globalScene.currentBattle.turnCommands[this.fieldIndex - 1];
    if (allyCommand?.command === Command.BALL || allyCommand?.command === Command.RUN) {
      globalScene.currentBattle.turnCommands[this.fieldIndex] = {
        command: allyCommand?.command,
        skip: true,
      };
    }
  }

  /**
   * Submethod of {@linkcode start} that sets the turn command to skip if this pokemon
   * is commanding its ally via {@linkcode AbilityId.COMMANDER}.
   */
  private checkCommander(): void {
    // If the Pokemon has applied Commander's effects to its ally, skip this command
    if (
      globalScene.currentBattle?.double
      && this.getPokemon().getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon() === this.getPokemon()
    ) {
      globalScene.currentBattle.turnCommands[this.fieldIndex] = {
        command: Command.FIGHT,
        move: { move: MoveId.NONE, targets: [], useMode: MoveUseMode.NORMAL },
        skip: true,
      };
    }
  }

  /**
   * Clear out all unusable moves in front of the currently acting pokemon's move queue.
   */
  // TODO: Refactor move queue handling to ensure that this method is not necessary.
  private clearUnusableMoves(): void {
    const playerPokemon = this.getPokemon();
    const moveQueue = playerPokemon.getMoveQueue();
    if (moveQueue.length === 0) {
      return;
    }

    let entriesToDelete = 0;
    const moveset = playerPokemon.getMoveset();
    for (const queuedMove of moveQueue) {
      const movesetQueuedMove = moveset.find(m => m.moveId === queuedMove.move);
      if (
        queuedMove.move !== MoveId.NONE
        && !isVirtual(queuedMove.useMode)
        && !movesetQueuedMove?.isUsable(playerPokemon, isIgnorePP(queuedMove.useMode))
      ) {
        entriesToDelete++;
      } else {
        break;
      }
    }
    if (entriesToDelete) {
      moveQueue.splice(0, entriesToDelete);
    }
  }

  /**
   * Attempt to execute the first usable move in this Pokemon's move queue
   * @returns Whether a queued move was successfully set to be executed.
   */
  private tryExecuteQueuedMove(): boolean {
    this.clearUnusableMoves();
    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];
    const moveQueue = playerPokemon.getMoveQueue();

    if (moveQueue.length === 0) {
      return false;
    }

    const queuedMove = moveQueue[0];
    if (queuedMove.move === MoveId.NONE) {
      this.handleCommand(Command.FIGHT, -1);
      return true;
    }
    const moveIndex = playerPokemon.getMoveset().findIndex(m => m.moveId === queuedMove.move);
    if (!isVirtual(queuedMove.useMode) && moveIndex === -1) {
      globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
    } else {
      this.handleCommand(Command.FIGHT, moveIndex, queuedMove.useMode, queuedMove);
    }

    return true;
  }

  public override start(): void {
    super.start();

    globalScene.updateGameInfo();
    this.resetCursorIfNeeded();

    if (this.fieldIndex) {
      this.handleFieldIndexLogic();
    }

    this.checkCommander();

    const playerPokemon = this.getPokemon();

    // Note: It is OK to call this if the target is not under the effect of encore; it will simply do nothing.
    playerPokemon.lapseTag(BattlerTagType.ENCORE);

    if (globalScene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      this.end();
      return;
    }

    if (this.tryExecuteQueuedMove()) {
      return;
    }

    if (
      globalScene.currentBattle.isBattleMysteryEncounter()
      && globalScene.currentBattle.mysteryEncounter?.skipToFightInput
    ) {
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.FIGHT, this.fieldIndex);
    } else {
      globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
    }
  }

  /**
   * Submethod of {@linkcode handleFightCommand} responsible for queuing the appropriate
   * error message when a move cannot be used.
   * @param user - The pokemon using the move
   * @param move - The move that cannot be used
   */
  private queueFightErrorMessage(user: PlayerPokemon, move: PokemonMove) {
    globalScene.ui.setMode(UiMode.MESSAGE);

    // Set the translation key for why the move cannot be selected
    let cannotSelectKey: string;
    const moveStatus = new BooleanHolder(true);
    applyChallenges(ChallengeType.POKEMON_MOVE, move.moveId, moveStatus);
    if (!moveStatus.value) {
      cannotSelectKey = "battle:moveCannotUseChallenge";
    } else if (move.getPpRatio() === 0) {
      cannotSelectKey = "battle:moveNoPP";
    } else if (move.getName().endsWith(" (N)")) {
      cannotSelectKey = "battle:moveNotImplemented";
    } else if (user.isMoveRestricted(move.moveId, user)) {
      cannotSelectKey = user.getRestrictingTag(move.moveId, user)!.selectionDeniedText(user, move.moveId);
    } else {
      // TODO: Consider a message that signals a being unusable for an unknown reason
      cannotSelectKey = "";
    }

    const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

    globalScene.ui.showText(
      i18next.t(cannotSelectKey, { moveName }),
      null,
      () => {
        globalScene.ui.clearText();
        globalScene.ui.setMode(UiMode.FIGHT, this.fieldIndex);
      },
      null,
      true,
    );
  }

  /**
   * Helper method for {@linkcode handleFightCommand} that returns the moveID for the phase
   * based on the move passed in or the cursor.
   *
   * Does not check if the move is usable or not, that should be handled by the caller.
   */
  private computeMoveId(playerPokemon: PlayerPokemon, cursor: number, move: TurnMove | undefined): MoveId {
    return move?.move ?? (cursor > -1 ? playerPokemon.getMoveset()[cursor]?.moveId : MoveId.NONE);
  }

  /**
   * Process the logic for executing a fight-related command
   *
   * @remarks
   * - Validates whether the move can be used, using struggle if not
   * - Constructs the turn command and inserts it into the battle's turn commands
   *
   * @param command - The command to handle (FIGHT or TERA)
   * @param cursor - The index that the cursor is placed on, or -1 if no move can be selected.
   * @param ignorePP - Whether to ignore PP when checking if the move can be used.
   * @param move - The move to force the command to use, if any.
   */
  private handleFightCommand(
    command: Command.FIGHT | Command.TERA,
    cursor: number,
    useMode: MoveUseMode = MoveUseMode.NORMAL,
    move?: TurnMove,
  ): boolean {
    const playerPokemon = this.getPokemon();
    const ignorePP = isIgnorePP(useMode);

    let canUse = cursor === -1 || playerPokemon.trySelectMove(cursor, ignorePP);

    const moveset = playerPokemon.getMoveset();

    // Ternary here ensures we don't compute struggle conditions unless necessary
    const useStruggle = canUse ? false : cursor > -1 && !moveset.some(m => m.isUsable(playerPokemon));

    canUse ||= useStruggle;

    if (!canUse) {
      // Selected move *may* be undefined if the cursor is over a position that the mon does not have
      const selectedMove: PokemonMove | undefined = moveset[cursor];
      if (selectedMove) {
        this.queueFightErrorMessage(playerPokemon, moveset[cursor]);
      }
      return false;
    }

    const moveId = useStruggle ? MoveId.STRUGGLE : this.computeMoveId(playerPokemon, cursor, move);

    const turnCommand: TurnCommand = {
      command: Command.FIGHT,
      cursor,
      move: { move: moveId, targets: [], useMode },
      args: [useMode, move],
    };
    const preTurnCommand: TurnCommand = {
      command,
      targets: [this.fieldIndex],
      skip: command === Command.FIGHT,
    };

    const moveTargets: MoveTargetSet =
      move === undefined
        ? getMoveTargets(playerPokemon, moveId)
        : {
            targets: move.targets,
            multiple: move.targets.length > 1,
          };

    if (moveId === MoveId.NONE) {
      turnCommand.targets = [this.fieldIndex];
    }

    console.log(
      "Move:",
      MoveId[moveId],
      "Move targets:",
      moveTargets,
      "\nPlayer Pokemon:",
      getPokemonNameWithAffix(playerPokemon),
    );

    if (moveTargets.targets.length > 1 && moveTargets.multiple) {
      globalScene.phaseManager.unshiftNew("SelectTargetPhase", this.fieldIndex);
    }

    if (turnCommand.move && (moveTargets.targets.length <= 1 || moveTargets.multiple)) {
      turnCommand.move.targets = moveTargets.targets;
    } else if (
      turnCommand.move
      && playerPokemon.getTag(BattlerTagType.CHARGING)
      && playerPokemon.getMoveQueue().length > 0
    ) {
      turnCommand.move.targets = playerPokemon.getMoveQueue()[0].targets;
    } else {
      globalScene.phaseManager.unshiftNew("SelectTargetPhase", this.fieldIndex);
    }

    globalScene.currentBattle.preTurnCommands[this.fieldIndex] = preTurnCommand;
    globalScene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;

    return true;
  }

  /**
   * Set the mode in preparation to show the text, and then show the text.
   * Only works for parameterless i18next keys.
   * @param key - The i18next key for the text to show
   */
  private queueShowText(key: string): void {
    globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
    globalScene.ui.setMode(UiMode.MESSAGE);

    globalScene.ui.showText(
      i18next.t(key),
      null,
      () => {
        globalScene.ui.showText("", 0);
        globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
      },
      null,
      true,
    );
  }

  /**
   * Helper method for {@linkcode handleBallCommand} that checks if a pokeball can be thrown
   * and displays the appropriate error message.
   *
   * @remarks
   * The pokeball may not be thrown if any of the following are true:
   * - It is a trainer battle
   * - The player is in the {@linkcode BiomeId.END | End} biome and
   *   - it is not classic mode; or
   *   - the player has not caught the target before and the player is still missing more than one starter
   * - The player is in a mystery encounter that disallows catching the pokemon
   * @returns Whether a pokeball can be thrown
   */
  private checkCanUseBall(): boolean {
    const { arena, currentBattle, gameData, gameMode } = globalScene;
    const { battleType } = currentBattle;
    const { biomeType } = arena;
    const { isClassic, isEndless, isDaily } = gameMode;
    const { dexData } = gameData;

    const isClassicFinalBoss = gameMode.isBattleClassicFinalBoss(globalScene.currentBattle.waveIndex);
    const isEndlessMinorBoss = gameMode.isEndlessMinorBoss(globalScene.currentBattle.waveIndex);
    const isFullFreshStart = gameMode.isFullFreshStartChallenge();
    const someUncaughtSpeciesOnField = globalScene
      .getEnemyField()
      .some(p => p.isActive() && !dexData[p.species.speciesId].caughtAttr);
    const missingMultipleStarters =
      gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarterCosts).length - 1;

    if (biomeType === BiomeId.END && battleType === BattleType.WILD) {
      if (
        (isClassic && !isClassicFinalBoss && someUncaughtSpeciesOnField)
        || (isFullFreshStart && !isClassicFinalBoss)
        || (isEndless && !isEndlessMinorBoss)
      ) {
        // Uncatchable paradox mons in classic and endless
        this.queueShowText("battle:noPokeballForce");
      } else if (
        (isClassic && isClassicFinalBoss && missingMultipleStarters)
        || (isFullFreshStart && isClassicFinalBoss)
        || (isEndless && isEndlessMinorBoss)
        || isDaily
      ) {
        // Uncatchable final boss in classic, endless and daily
        this.queueShowText("battle:noPokeballForceFinalBoss");
      } else {
        return true;
      }
    } else if (battleType === BattleType.TRAINER) {
      this.queueShowText("battle:noPokeballTrainer");
    } else if (currentBattle.isBattleMysteryEncounter() && !currentBattle.mysteryEncounter!.catchAllowed) {
      this.queueShowText("battle:noPokeballMysteryEncounter");
    } else {
      return true;
    }

    return false;
  }

  /**
   * Helper method for {@linkcode handleCommand} that handles the logic when the selected command is to use a pokeball.
   *
   * @param cursor - The index of the pokeball to use
   * @returns Whether the command was successfully initiated
   */
  private handleBallCommand(cursor: number): boolean {
    const targets = globalScene
      .getEnemyField()
      .filter(p => p.isActive(true))
      .map(p => p.getBattlerIndex());

    if (!this.checkCanUseBall()) {
      return false;
    }

    if (targets.length > 1) {
      this.queueShowText("battle:noPokeballMulti");
      return false;
    }

    const isChallengeActive = globalScene.gameMode.hasAnyChallenges();
    const isFinalBoss = globalScene.gameMode.isBattleClassicFinalBoss(globalScene.currentBattle.waveIndex);

    const numBallTypes = 5;
    if (cursor < numBallTypes) {
      const targetPokemon = globalScene.getEnemyPokemon(false);
      if (
        targetPokemon?.isBoss()
        && targetPokemon?.bossSegmentIndex >= 1 // TODO: Decouple this hardcoded exception for wonder guard and just check the target...
        && !targetPokemon?.hasAbility(AbilityId.WONDER_GUARD, false, true)
      ) {
        // When facing the final boss, it must be weakened unless a Master Ball is used AND no challenges are active.
        // The message is customized for the final boss.
        if (
          isFinalBoss
          && (cursor < PokeballType.MASTER_BALL || (cursor === PokeballType.MASTER_BALL && isChallengeActive))
        ) {
          this.queueShowText("battle:noPokeballForceFinalBossCatchable");
          return false;
        }
        // When facing any other boss, Master Ball can always be used, and we use the standard message.
        if (cursor < PokeballType.MASTER_BALL) {
          this.queueShowText("battle:noPokeballStrong");
          return false;
        }
      }

      globalScene.currentBattle.turnCommands[this.fieldIndex] = {
        command: Command.BALL,
        cursor,
      };
      globalScene.currentBattle.turnCommands[this.fieldIndex]!.targets = targets;
      if (this.fieldIndex) {
        globalScene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
      }
      return true;
    }

    return false;
  }

  /**
   * Submethod of {@linkcode tryLeaveField} to handle the logic for effects that prevent the pokemon from leaving the field
   * due to trapping abilities or effects.
   *
   * This method queues the proper messages in the case of trapping abilities or effects.
   *
   * @returns Whether the pokemon is currently trapped
   */
  private handleTrap(): boolean {
    const playerPokemon = this.getPokemon();
    const trappedAbMessages: string[] = [];
    const isSwitch = this.isSwitch;
    if (!playerPokemon.isTrapped(trappedAbMessages)) {
      return false;
    }
    if (trappedAbMessages.length > 0) {
      if (isSwitch) {
        globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
          globalScene.ui.showText(
            trappedAbMessages[0],
            null,
            () => {
              globalScene.ui.showText("", 0);
              if (isSwitch) {
                globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
              }
            },
            null,
            true,
          );
        });
      }
    } else {
      const trapTag = playerPokemon.getTag(TrappedTag);
      const fairyLockTag = globalScene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER);

      if (!isSwitch) {
        globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
        globalScene.ui.setMode(UiMode.MESSAGE);
      }
      if (trapTag) {
        this.showNoEscapeText(trapTag, false);
      } else if (fairyLockTag) {
        this.showNoEscapeText(fairyLockTag, false);
      }
    }

    return true;
  }

  /**
   * Common helper method that attempts to have the pokemon leave the field.
   * Checks for trapping abilities and effects.
   *
   * @param cursor - The index of the option that the cursor is on
   * @returns Whether the pokemon is able to leave the field, indicating the command phase should end
   */
  private tryLeaveField(cursor?: number, isBatonSwitch = false): boolean {
    const currentBattle = globalScene.currentBattle;

    if (isBatonSwitch || !this.handleTrap()) {
      currentBattle.turnCommands[this.fieldIndex] = this.isSwitch
        ? {
            command: Command.POKEMON,
            cursor,
            args: [isBatonSwitch],
          }
        : {
            command: Command.RUN,
          };
      if (!this.isSwitch && this.fieldIndex) {
        currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
      }
      return true;
    }

    return false;
  }

  /**
   * Helper method for {@linkcode handleCommand} that handles the logic when the selected command is RUN.
   *
   * @remarks
   * Checks if the player is allowed to flee, and if not, queues the appropriate message.
   *
   * The player cannot flee if:
   * - The player is in the {@linkcode BiomeId.END | End} biome
   * - The player is in a trainer battle
   * - The player is in a mystery encounter that disallows fleeing
   * - The player's pokemon is trapped by an ability or effect
   * @returns Whether the pokemon is able to leave the field, indicating the command phase should end
   */
  private handleRunCommand(): boolean {
    const { currentBattle, arena } = globalScene;
    const mysteryEncounterFleeAllowed = currentBattle.mysteryEncounter?.fleeAllowed ?? true;
    if (arena.biomeType === BiomeId.END || !mysteryEncounterFleeAllowed) {
      this.queueShowText("battle:noEscapeForce");
      return false;
    }
    if (
      currentBattle.battleType === BattleType.TRAINER
      || currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
    ) {
      this.queueShowText("battle:noEscapeTrainer");
      return false;
    }

    const success = this.tryLeaveField();

    return success;
  }

  /**
   * Show a message indicating that the pokemon cannot escape, and then return to the command phase.
   */
  private showNoEscapeText(tag: any, isSwitch: boolean): void {
    globalScene.ui.showText(
      i18next.t("battle:noEscapePokemon", {
        pokemonName:
          tag.sourceId && globalScene.getPokemonById(tag.sourceId)
            ? getPokemonNameWithAffix(globalScene.getPokemonById(tag.sourceId)!)
            : "",
        moveName: tag.getMoveName(),
        escapeVerb: i18next.t(isSwitch ? "battle:escapeVerbSwitch" : "battle:escapeVerbFlee"),
      }),
      null,
      () => {
        globalScene.ui.showText("", 0);
        if (!isSwitch) {
          globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
        }
      },
      null,
      true,
    );
  }

  // Overloads for handleCommand to provide a more specific signature for the different options
  /**
   * Process the command phase logic based on the selected command
   *
   * @param command - The kind of command to handle
   * @param cursor - The index of option that the cursor is on, or -1 if no option is selected
   * @param useMode - The mode to use for the move, if applicable. For switches, a boolean that specifies whether the switch is a Baton switch.
   * @param move - For {@linkcode Command.FIGHT}, the move to use
   * @returns Whether the command was successful
   */
  handleCommand(command: Command.FIGHT | Command.TERA, cursor: number, useMode?: MoveUseMode, move?: TurnMove): boolean;
  handleCommand(command: Command.POKEMON, cursor: number, useBaton: boolean): boolean;
  handleCommand(command: Command.BALL | Command.RUN, cursor: number): boolean;
  handleCommand(command: Command, cursor: number, useMode?: boolean | MoveUseMode, move?: TurnMove): boolean;

  public handleCommand(
    command: Command,
    cursor: number,
    useMode: boolean | MoveUseMode = false,
    move?: TurnMove,
  ): boolean {
    let success = false;

    switch (command) {
      case Command.TERA:
      case Command.FIGHT:
        success = this.handleFightCommand(command, cursor, typeof useMode === "boolean" ? undefined : useMode, move);
        break;
      case Command.BALL:
        success = this.handleBallCommand(cursor);
        break;
      case Command.POKEMON:
        this.isSwitch = true;
        success = this.tryLeaveField(cursor, typeof useMode === "boolean" ? useMode : undefined);
        this.isSwitch = false;
        break;
      case Command.RUN:
        success = this.handleRunCommand();
    }

    if (success) {
      this.end();
    }

    return success;
  }

  cancel() {
    if (this.fieldIndex) {
      globalScene.phaseManager.unshiftNew("CommandPhase", 0);
      globalScene.phaseManager.unshiftNew("CommandPhase", 1);
      this.end();
    }
  }

  getFieldIndex(): number {
    return this.fieldIndex;
  }

  getPokemon(): PlayerPokemon {
    return globalScene.getPlayerField()[this.fieldIndex];
  }

  end() {
    globalScene.ui.setMode(UiMode.MESSAGE).then(() => super.end());
  }
}
