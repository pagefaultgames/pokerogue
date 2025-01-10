import { globalScene } from "#app/global-scene";
import { TurnCommand, BattleType } from "#app/battle";
import { TrappedTag, EncoreTag } from "#app/data/battler-tags";
import { MoveTargetSet, getMoveTargets } from "#app/data/move";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { PokeballType } from "#enums/pokeball";
import { FieldPosition, PlayerPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { SelectTargetPhase } from "./select-target-phase";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { isNullOrUndefined } from "#app/utils";
import { ArenaTagSide } from "#app/data/arena-tag";
import { ArenaTagType } from "#app/enums/arena-tag-type";

export class CommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(fieldIndex: integer) {
    super();

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    globalScene.updateGameInfo();

    const commandUiHandler = globalScene.ui.handlers[Mode.COMMAND];

    // If one of these conditions is true, we always reset the cursor to Command.FIGHT
    const cursorResetEvent = globalScene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER ||
                              globalScene.currentBattle.battleType === BattleType.TRAINER ||
                              globalScene.arena.biomeType === Biome.END;

    if (commandUiHandler) {
      if ((globalScene.currentBattle.turn === 1 && (!globalScene.commandCursorMemory || cursorResetEvent)) || commandUiHandler.getCursor() === Command.POKEMON) {
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
          globalScene.currentBattle.turnCommands[this.fieldIndex] = { command: allyCommand?.command, skip: true };
        }
      }
    }

    // If the Pokemon has applied Commander's effects to its ally, skip this command
    if (globalScene.currentBattle?.double && this.getPokemon().getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon() === this.getPokemon()) {
      globalScene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.FIGHT, move: { move: Moves.NONE, targets: []}, skip: true };
    }

    // Checks if the Pokemon is under the effects of Encore. If so, Encore can end early if the encored move has no more PP.
    const encoreTag = this.getPokemon().getTag(BattlerTagType.ENCORE) as EncoreTag;
    if (encoreTag) {
      this.getPokemon().lapseTag(BattlerTagType.ENCORE);
    }

    if (globalScene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];

    const moveQueue = playerPokemon.getMoveQueue();

    while (moveQueue.length && moveQueue[0]
        && moveQueue[0].move && (!playerPokemon.getMoveset().find(m => m?.moveId === moveQueue[0].move)
          || !playerPokemon.getMoveset()[playerPokemon.getMoveset().findIndex(m => m?.moveId === moveQueue[0].move)]!.isUsable(playerPokemon, moveQueue[0].ignorePP))) { // TODO: is the bang correct?
      moveQueue.shift();
    }

    if (moveQueue.length) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move) {
        this.handleCommand(Command.FIGHT, -1, false);
      } else {
        const moveIndex = playerPokemon.getMoveset().findIndex(m => m?.moveId === queuedMove.move);
        if (moveIndex > -1 && playerPokemon.getMoveset()[moveIndex]!.isUsable(playerPokemon, queuedMove.ignorePP)) { // TODO: is the bang correct?
          this.handleCommand(Command.FIGHT, moveIndex, queuedMove.ignorePP, { targets: queuedMove.targets, multiple: queuedMove.targets.length > 1 });
        } else {
          globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      if (globalScene.currentBattle.isBattleMysteryEncounter() && globalScene.currentBattle.mysteryEncounter?.skipToFightInput) {
        globalScene.ui.clearText();
        globalScene.ui.setMode(Mode.FIGHT, this.fieldIndex);
      } else {
        globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
      }
    }
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = globalScene.getPlayerField()[this.fieldIndex];
    let success: boolean = false;

    switch (command) {
      case Command.FIGHT:
        let useStruggle = false;
        if (cursor === -1 ||
            playerPokemon.trySelectMove(cursor, args[0] as boolean) ||
            (useStruggle = cursor > -1 && !playerPokemon.getMoveset().filter(m => m?.isUsable(playerPokemon)).length)) {
          const moveId = !useStruggle ? cursor > -1 ? playerPokemon.getMoveset()[cursor]!.moveId : Moves.NONE : Moves.STRUGGLE; // TODO: is the bang correct?
          const turnCommand: TurnCommand = { command: Command.FIGHT, cursor: cursor, move: { move: moveId, targets: [], ignorePP: args[0] }, args: args };
          const moveTargets: MoveTargetSet = args.length < 3 ? getMoveTargets(playerPokemon, moveId) : args[2];
          if (!moveId) {
            turnCommand.targets = [ this.fieldIndex ];
          }
          console.log(moveTargets, getPokemonNameWithAffix(playerPokemon));
          if (moveTargets.targets.length > 1 && moveTargets.multiple) {
            globalScene.unshiftPhase(new SelectTargetPhase(this.fieldIndex));
          }
          if (moveTargets.targets.length <= 1 || moveTargets.multiple) {
            turnCommand.move!.targets = moveTargets.targets; //TODO: is the bang correct here?
          } else if (playerPokemon.getTag(BattlerTagType.CHARGING) && playerPokemon.getMoveQueue().length >= 1) {
            turnCommand.move!.targets = playerPokemon.getMoveQueue()[0].targets; //TODO: is the bang correct here?
          } else {
            globalScene.unshiftPhase(new SelectTargetPhase(this.fieldIndex));
          }
          globalScene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;
          success = true;
        } else if (cursor < playerPokemon.getMoveset().length) {
          const move = playerPokemon.getMoveset()[cursor]!; //TODO: is this bang correct?
          globalScene.ui.setMode(Mode.MESSAGE);

          // Decides between a Disabled, Not Implemented, or No PP translation message
          const errorMessage =
          playerPokemon.isMoveRestricted(move.moveId, playerPokemon)
            ? playerPokemon.getRestrictingTag(move.moveId, playerPokemon)!.selectionDeniedText(playerPokemon, move.moveId)
            : move.getName().endsWith(" (N)") ? "battle:moveNotImplemented" : "battle:moveNoPP";
          const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

          globalScene.ui.showText(i18next.t(errorMessage, { moveName: moveName }), null, () => {
            globalScene.ui.clearText();
            globalScene.ui.setMode(Mode.FIGHT, this.fieldIndex);
          }, null, true);
        }
        break;
      case Command.BALL:
        const notInDex = (globalScene.getEnemyField().filter(p => p.isActive(true)).some(p => !globalScene.gameData.dexData[p.species.speciesId].caughtAttr) && globalScene.gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarterCosts).length - 1);
        if (globalScene.arena.biomeType === Biome.END && (!globalScene.gameMode.isClassic || globalScene.gameMode.isFreshStartChallenge() || notInDex )) {
          globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(Mode.MESSAGE);
          globalScene.ui.showText(i18next.t("battle:noPokeballForce"), null, () => {
            globalScene.ui.showText("", 0);
            globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
          globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(Mode.MESSAGE);
          globalScene.ui.showText(i18next.t("battle:noPokeballTrainer"), null, () => {
            globalScene.ui.showText("", 0);
            globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (globalScene.currentBattle.isBattleMysteryEncounter() && !globalScene.currentBattle.mysteryEncounter!.catchAllowed) {
          globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(Mode.MESSAGE);
          globalScene.ui.showText(i18next.t("battle:noPokeballMysteryEncounter"), null, () => {
            globalScene.ui.showText("", 0);
            globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else {
          const targets = globalScene.getEnemyField().filter(p => p.isActive(true)).map(p => p.getBattlerIndex());
          if (targets.length > 1) {
            globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            globalScene.ui.setMode(Mode.MESSAGE);
            globalScene.ui.showText(i18next.t("battle:noPokeballMulti"), null, () => {
              globalScene.ui.showText("", 0);
              globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }, null, true);
          } else if (cursor < 5) {
            const targetPokemon = globalScene.getEnemyField().find(p => p.isActive(true));
            if (targetPokemon?.isBoss() && targetPokemon?.bossSegmentIndex >= 1 && !targetPokemon?.hasAbility(Abilities.WONDER_GUARD, false, true) && cursor < PokeballType.MASTER_BALL) {
              globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              globalScene.ui.setMode(Mode.MESSAGE);
              globalScene.ui.showText(i18next.t("battle:noPokeballStrong"), null, () => {
                globalScene.ui.showText("", 0);
                globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              }, null, true);
            } else {
              globalScene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
              globalScene.currentBattle.turnCommands[this.fieldIndex]!.targets = targets;
              if (this.fieldIndex) {
                globalScene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
              }
              success = true;
            }
          }
        }
        break;
      case Command.POKEMON:
      case Command.RUN:
        const isSwitch = command === Command.POKEMON;
        const { currentBattle, arena } = globalScene;
        const mysteryEncounterFleeAllowed = currentBattle.mysteryEncounter?.fleeAllowed;
        if (!isSwitch && (arena.biomeType === Biome.END || (!isNullOrUndefined(mysteryEncounterFleeAllowed) && !mysteryEncounterFleeAllowed))) {
          globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(Mode.MESSAGE);
          globalScene.ui.showText(i18next.t("battle:noEscapeForce"), null, () => {
            globalScene.ui.showText("", 0);
            globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (!isSwitch && (currentBattle.battleType === BattleType.TRAINER || currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE)) {
          globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          globalScene.ui.setMode(Mode.MESSAGE);
          globalScene.ui.showText(i18next.t("battle:noEscapeTrainer"), null, () => {
            globalScene.ui.showText("", 0);
            globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else {
          const batonPass = isSwitch && args[0] as boolean;
          const trappedAbMessages: string[] = [];
          if (batonPass || !playerPokemon.isTrapped(trappedAbMessages)) {
            currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor, args: args }
              : { command: Command.RUN };
            success = true;
            if (!isSwitch && this.fieldIndex) {
            currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
            }
          } else if (trappedAbMessages.length > 0) {
            if (!isSwitch) {
              globalScene.ui.setMode(Mode.MESSAGE);
            }
            globalScene.ui.showText(trappedAbMessages[0], null, () => {
              globalScene.ui.showText("", 0);
              if (!isSwitch) {
                globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              }
            }, null, true);
          } else {
            const trapTag = playerPokemon.getTag(TrappedTag);
            const fairyLockTag = globalScene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER);

            if (!trapTag && !fairyLockTag) {
              i18next.t(`battle:noEscape${isSwitch ? "Switch" : "Flee"}`);
              break;
            }
            if (!isSwitch) {
              globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              globalScene.ui.setMode(Mode.MESSAGE);
            }
            const showNoEscapeText = (tag: any) => {
              globalScene.ui.showText(
                i18next.t("battle:noEscapePokemon", {
                  pokemonName: tag.sourceId && globalScene.getPokemonById(tag.sourceId) ? getPokemonNameWithAffix(globalScene.getPokemonById(tag.sourceId)!) : "",
                  moveName: tag.getMoveName(),
                  escapeVerb: isSwitch ? i18next.t("battle:escapeVerbSwitch") : i18next.t("battle:escapeVerbFlee")
                }),
                null,
                () => {
                  globalScene.ui.showText("", 0);
                  if (!isSwitch) {
                    globalScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
                  }
                },
                null,
                true
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

    if (success) {
      this.end();
    }

    return success;
  }

  cancel() {
    if (this.fieldIndex) {
      globalScene.unshiftPhase(new CommandPhase(0));
      globalScene.unshiftPhase(new CommandPhase(1));
      this.end();
    }
  }

  getFieldIndex(): integer {
    return this.fieldIndex;
  }

  getPokemon(): PlayerPokemon {
    return globalScene.getPlayerField()[this.fieldIndex];
  }

  end() {
    globalScene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}
