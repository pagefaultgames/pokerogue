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
import { FieldPhase } from "#phases/field-phase";
import type { TurnMove } from "#types/turn-move";
import { isNullOrUndefined } from "#utils/common";
import i18next from "i18next";

export class CommandPhase extends FieldPhase {
  public readonly phaseName = "CommandPhase";
  protected fieldIndex: number;

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
   * @param cursor -
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
  handleBallCommand(cursor: number): boolean {
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

  handleCommand(command: Command, cursor: number, useMode: MoveUseMode = MoveUseMode.NORMAL, move?: TurnMove): boolean {
    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];
    let success = false;

    switch (command) {
      case Command.TERA:
      case Command.FIGHT:
        return this.handleFightCommand(command, cursor, useMode, move);
      case Command.BALL:
        return this.handleBallCommand(cursor);
      case Command.POKEMON:
      case Command.RUN: {
        const isSwitch = command === Command.POKEMON;
        const { currentBattle, arena } = globalScene;
        const mysteryEncounterFleeAllowed = currentBattle.mysteryEncounter?.fleeAllowed;
        if (
          !isSwitch &&
          (arena.biomeType === BiomeId.END ||
            (!isNullOrUndefined(mysteryEncounterFleeAllowed) && !mysteryEncounterFleeAllowed))
        ) {
          globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(UiMode.MESSAGE);
          globalScene.ui.showText(
            i18next.t("battle:noEscapeForce"),
            null,
            () => {
              globalScene.ui.showText("", 0);
              globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
            },
            null,
            true,
          );
        } else if (
          !isSwitch &&
          (currentBattle.battleType === BattleType.TRAINER ||
            currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE)
        ) {
          globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(UiMode.MESSAGE);
          globalScene.ui.showText(
            i18next.t("battle:noEscapeTrainer"),
            null,
            () => {
              globalScene.ui.showText("", 0);
              globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
            },
            null,
            true,
          );
        } else {
          const batonPass = isSwitch && useMode;
          const trappedAbMessages: string[] = [];
          if (batonPass || !playerPokemon.isTrapped(trappedAbMessages)) {
            currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor }
              : { command: Command.RUN };
            success = true;
            if (!isSwitch && this.fieldIndex) {
              currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
            }
          } else if (trappedAbMessages.length > 0) {
            if (!isSwitch) {
              globalScene.ui.setMode(UiMode.MESSAGE);
            }
            globalScene.ui.showText(
              trappedAbMessages[0],
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
          } else {
            const trapTag = playerPokemon.getTag(TrappedTag);
            const fairyLockTag = globalScene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER);

            if (!trapTag && !fairyLockTag) {
              i18next.t(`battle:noEscape${isSwitch ? "Switch" : "Flee"}`);
              break;
            }
            if (!isSwitch) {
              globalScene.ui.setMode(UiMode.COMMAND, this.fieldIndex);
              globalScene.ui.setMode(UiMode.MESSAGE);
            }
            const showNoEscapeText = (tag: any) => {
              globalScene.ui.showText(
                i18next.t("battle:noEscapePokemon", {
                  pokemonName:
                    tag.sourceId && globalScene.getPokemonById(tag.sourceId)
                      ? getPokemonNameWithAffix(globalScene.getPokemonById(tag.sourceId)!)
                      : "",
                  moveName: tag.getMoveName(),
                  escapeVerb: isSwitch ? i18next.t("battle:escapeVerbSwitch") : i18next.t("battle:escapeVerbFlee"),
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
            };

            if (trapTag) {
              showNoEscapeText(trapTag);
            } else if (fairyLockTag) {
              showNoEscapeText(fairyLockTag);
            }
          }
        }
        break;
      }
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
