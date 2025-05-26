import type { TurnCommand } from "#app/battle";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { speciesStarterCosts } from "#balance/starters";
import type { EncoreTag } from "#data/battler-tags";
import { TrappedTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
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
import type { TurnMove } from "#types/turn-move";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";

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

  start() {
    super.start();

    globalScene.updateGameInfo();

    const commandUiHandler = globalScene.ui.handlers[UiMode.COMMAND];

    // If one of these conditions is true, we always reset the cursor to Command.FIGHT
    const cursorResetEvent =
      globalScene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER ||
      globalScene.currentBattle.battleType === BattleType.TRAINER ||
      globalScene.arena.biomeType === BiomeId.END;

    if (commandUiHandler) {
      if (
        (globalScene.currentBattle.turn === 1 && (!globalScene.commandCursorMemory || cursorResetEvent)) ||
        commandUiHandler.getCursor() === Command.POKEMON
      ) {
        commandUiHandler.setCursor(Command.FIGHT);
      } else {
        commandUiHandler.setCursor(commandUiHandler.getCursor());
      }
    }

    if (this.fieldIndex) {
      // If we somehow are attempting to check the right pokemon but there's only one pokemon out
      // Switch back to the center pokemon. This can happen rarely in double battles with mid turn switching
      if (globalScene.getPlayerField().filter(p => p.isActive()).length === 1) {
        this.fieldIndex = FieldPosition.CENTER;
      } else {
        const allyCommand = globalScene.currentBattle.turnCommands[this.fieldIndex - 1];
        if (allyCommand?.command === Command.BALL || allyCommand?.command === Command.RUN) {
          globalScene.currentBattle.turnCommands[this.fieldIndex] = {
            command: allyCommand?.command,
            skip: true,
          };
        }
      }
    }

    // If the Pokemon has applied Commander's effects to its ally, skip this command
    if (
      globalScene.currentBattle?.double &&
      this.getPokemon().getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon() === this.getPokemon()
    ) {
      globalScene.currentBattle.turnCommands[this.fieldIndex] = {
        command: Command.FIGHT,
        move: { move: MoveId.NONE, targets: [], useMode: MoveUseMode.NORMAL },
        skip: true,
      };
    }

    // Checks if the Pokemon is under the effects of Encore. If so, Encore can end early if the encored move has no more PP.
    const encoreTag = this.getPokemon().getTag(BattlerTagType.ENCORE) as EncoreTag | undefined;
    if (encoreTag) {
      this.getPokemon().lapseTag(BattlerTagType.ENCORE);
    }

    if (globalScene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];

    const moveQueue = playerPokemon.getMoveQueue();

    while (
      moveQueue.length &&
      moveQueue[0] &&
      moveQueue[0].move &&
      !isVirtual(moveQueue[0].useMode) &&
      (!playerPokemon.getMoveset().find(m => m.moveId === moveQueue[0].move) ||
        !playerPokemon
          .getMoveset()
          [playerPokemon.getMoveset().findIndex(m => m.moveId === moveQueue[0].move)].isUsable(
            playerPokemon,
            isIgnorePP(moveQueue[0].useMode),
          ))
    ) {
      moveQueue.shift();
    }

    // TODO: Refactor this. I did a few simple find/replace matches but this is just ABHORRENTLY structured
    if (moveQueue.length > 0) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move) {
        this.handleCommand(Command.FIGHT, -1, MoveUseMode.NORMAL);
      } else {
        const moveIndex = playerPokemon.getMoveset().findIndex(m => m.moveId === queuedMove.move);
        if (
          (moveIndex > -1 &&
            playerPokemon.getMoveset()[moveIndex].isUsable(playerPokemon, isIgnorePP(queuedMove.useMode))) ||
          isVirtual(queuedMove.useMode)
        ) {
          this.handleCommand(Command.FIGHT, moveIndex, queuedMove.useMode, queuedMove);
        } else {
          globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      if (
        globalScene.currentBattle.isBattleMysteryEncounter() &&
        globalScene.currentBattle.mysteryEncounter?.skipToFightInput
      ) {
        globalScene.ui.clearText();
        globalScene.ui.setMode(UiMode.FIGHT, this.fieldIndex);
      } else {
        globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
      }
    }
  }

  /**
   *
   * @param user - The pokemon using the move
   * @param cursor - The index of the move in the moveset
   */
  private queueFightErrorMessage(user: PlayerPokemon, cursor: number) {
    const move = user.getMoveset()[cursor];
    globalScene.ui.setMode(UiMode.MESSAGE);

    // Decides between a Disabled, Not Implemented, or No PP translation message
    const errorMessage = user.isMoveRestricted(move.moveId, user)
      ? user.getRestrictingTag(move.moveId, user)!.selectionDeniedText(user, move.moveId)
      : move.getName().endsWith(" (N)")
        ? "battle:moveNotImplemented"
        : "battle:moveNoPP";
    const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

    globalScene.ui.showText(
      i18next.t(errorMessage, { moveName: moveName }),
      null,
      () => {
        globalScene.ui.clearText();
        globalScene.ui.setMode(UiMode.FIGHT, this.fieldIndex);
      },
      null,
      true,
    );
  }

  /** Helper method for {@linkcode handleFightCommand} that returns the moveID for the phase
   * based on the move passed in or the cursor.
   *
   * Does not check if the move is usable or not, that should be handled by the caller.
   */
  private comptueMoveId(playerPokemon: PlayerPokemon, cursor: number, move?: TurnMove): MoveId {
    return move?.move ?? (cursor > -1 ? playerPokemon.getMoveset()[cursor]?.moveId : MoveId.NONE);
  }

  /**
   * Handle fight logic
   * @param command - The command to handle (FIGHT or TERA)
   * @param cursor - The index that the cursor is placed on, or -1 if no move can be selected.
   * @param args - Any additional arguments to pass to the command
   */
  private handleFightCommand(
    command: Command.FIGHT | Command.TERA,
    cursor: number,
    useMode: MoveUseMode = MoveUseMode.NORMAL,
    move?: TurnMove,
  ): boolean {
    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];
    const ignorePP = isIgnorePP(useMode);

    /** Whether or not to display an error message instead of attempting to initiate the command selection process */
    let canUse = cursor !== -1 || !playerPokemon.trySelectMove(cursor, ignorePP);

    const useStruggle = canUse
      ? false
      : cursor > -1 && !playerPokemon.getMoveset().some(m => m.isUsable(playerPokemon));

    canUse = canUse || useStruggle;

    if (!canUse) {
      this.queueFightErrorMessage(playerPokemon, cursor);
      return false;
    }

    const moveId = useStruggle ? MoveId.STRUGGLE : this.comptueMoveId(playerPokemon, cursor, move);

    const turnCommand: TurnCommand = {
      command: Command.FIGHT,
      cursor: cursor,
      move: { move: moveId, targets: [], useMode },
      args: [useMode, move],
    };
    const preTurnCommand: TurnCommand = {
      command: command,
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

    if (!moveId) {
      turnCommand.targets = [this.fieldIndex];
    }

    console.log(moveTargets, getPokemonNameWithAffix(playerPokemon));

    if (moveTargets.multiple) {
      globalScene.phaseManager.unshiftNew("SelectTargetPhase", this.fieldIndex);
    }

    if (turnCommand.move && (moveTargets.targets.length <= 1 || moveTargets.multiple)) {
      turnCommand.move.targets = moveTargets.targets;
    } else if (
      turnCommand.move &&
      playerPokemon.getTag(BattlerTagType.CHARGING) &&
      playerPokemon.getMoveQueue().length >= 1
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
  private queueShowText(key: string) {
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
   * Helper method for {@linkcode handleBallCommand} that checks if the pokeball can be thrown.
   *
   * The pokeball may not be thrown if:
   * - It is a trainer battle
   * - The biome is {@linkcode Biome.END} and it is not classic mode
   * - The biome is {@linkcode Biome.END} and the fresh start challenge is active
   * - The biome is {@linkcode Biome.END} and the player has not either caught the target before or caught all but one starter
   * - The player is in a mystery encounter that disallows catching the pokemon
   * @returns Whether a pokeball can be thrown
   *
   */
  private checkCanUseBall(): boolean {
    if (
      globalScene.arena.biomeType === BiomeId.END &&
      (!globalScene.gameMode.isClassic ||
        globalScene.gameMode.isFreshStartChallenge() ||
        (globalScene
          .getEnemyField()
          .some(p => p.isActive() && !globalScene.gameData.dexData[p.species.speciesId].caughtAttr) &&
          globalScene.gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarterCosts).length - 1))
    ) {
      this.queueShowText("battle:noPokeballForce");
    } else if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
      this.queueShowText("battle:noPokeballTrainer");
    } else if (
      globalScene.currentBattle.isBattleMysteryEncounter() &&
      !globalScene.currentBattle.mysteryEncounter!.catchAllowed
    ) {
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
    if (targets.length > 1) {
      this.queueShowText("battle:noPokeballMulti");
      return false;
    }

    if (!this.checkCanUseBall()) {
      return false;
    }

    if (cursor < 5) {
      const targetPokemon = globalScene.getEnemyPokemon();
      if (
        targetPokemon?.isBoss() &&
        targetPokemon?.bossSegmentIndex >= 1 &&
        // TODO: Decouple this hardcoded exception for wonder guard and just check the target...
        !targetPokemon?.hasAbility(AbilityId.WONDER_GUARD, false, true) &&
        cursor < PokeballType.MASTER_BALL
      ) {
        this.queueShowText("battle:noPokeballStrong");
        return false;
      }

      globalScene.currentBattle.turnCommands[this.fieldIndex] = {
        command: Command.BALL,
        cursor: cursor,
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
   * Common helper method to handle the logic for effects that prevent the pokemon from leaving the field
   * due to trapping abilities or effects.
   *
   * This method queues the proper messages in the case of trapping abilities or effects
   *
   * @returns Whether the pokemon is currently trapped
   */
  private handleTrap(): boolean {
    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];
    const trappedAbMessages: string[] = [];
    const isSwitch = this.isSwitch;
    if (!playerPokemon.isTrapped(trappedAbMessages)) {
      return false;
    }
    if (trappedAbMessages.length > 0) {
      if (isSwitch) {
        globalScene.ui.setMode(UiMode.MESSAGE);
      }
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
   * @param isBatonSwitch - Whether the switch command is switching via the Baton item
   * @returns whether the pokemon is able to leave the field, indicating the command phase should end
   */
  private tryLeaveField(cursor?: number, isBatonSwitch = false): boolean {
    const currentBattle = globalScene.currentBattle;

    if (isBatonSwitch && !this.handleTrap()) {
      currentBattle.turnCommands[this.fieldIndex] = {
        command: this.isSwitch ? Command.POKEMON : Command.RUN,
        cursor: cursor,
      };
      if (!this.isSwitch && this.fieldIndex) {
        currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
      }
      return true;
    }

    return false;
  }

  private handleRunCommand(): boolean {
    const { currentBattle, arena } = globalScene;
    const mysteryEncounterFleeAllowed = currentBattle.mysteryEncounter?.fleeAllowed ?? true;
    if (arena.biomeType === BiomeId.END || !mysteryEncounterFleeAllowed) {
      this.queueShowText("battle:noEscapeForce");
      return false;
    }
    if (
      currentBattle.battleType === BattleType.TRAINER ||
      currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
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

  // Overloads for handleCommand to provide a more specific type signature for the different options
  handleCommand(command: Command.FIGHT | Command.TERA, cursor: number, useMode?: MoveUseMode, move?: TurnMove): boolean;
  handleCommand(command: Command.BALL, cursor: number): boolean;
  handleCommand(command: Command.POKEMON, cursor: number, useBaton: boolean): boolean;
  handleCommand(command: Command.RUN, cursor: number): boolean;
  handleCommand(command: Command, cursor: number, useMode?: boolean | MoveUseMode, move?: TurnMove): boolean;

  /**
   * Process the command phase logic based on the selected command
   *
   * @param command - The kind of command to handle
   * @param cursor - The index of option that the cursor is on, or -1 if no option is selected
   * @param useMode - The mode to use for the move, if applicable. For switches, a boolean that specifies whether the switch is a Baton switch.
   * @param move - For {@linkcode Command.FIGHT}, the move to use
   */
  handleCommand(command: Command, cursor: number, useMode: boolean | MoveUseMode = false, move?: TurnMove): boolean {
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
