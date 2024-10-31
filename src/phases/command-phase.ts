import { gScene } from "#app/battle-scene";
import { TurnCommand, BattleType } from "#app/battle";
import { TrappedTag, EncoreTag } from "#app/data/battler-tags";
import { MoveTargetSet, getMoveTargets } from "#app/data/move";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { PokeballType } from "#app/enums/pokeball";
import { FieldPosition, PlayerPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { SelectTargetPhase } from "./select-target-phase";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { isNullOrUndefined } from "#app/utils";

export class CommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(fieldIndex: integer) {
    super();

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const commandUiHandler = gScene.ui.handlers[Mode.COMMAND];
    if (commandUiHandler) {
      if (gScene.currentBattle.turn === 1 || commandUiHandler.getCursor() === Command.POKEMON) {
        commandUiHandler.setCursor(Command.FIGHT);
      } else {
        commandUiHandler.setCursor(commandUiHandler.getCursor());
      }
    }

    if (this.fieldIndex) {
      // If we somehow are attempting to check the right pokemon but there's only one pokemon out
      // Switch back to the center pokemon. This can happen rarely in double battles with mid turn switching
      if (gScene.getPlayerField().filter(p => p.isActive()).length === 1) {
        this.fieldIndex = FieldPosition.CENTER;
      } else {
        const allyCommand = gScene.currentBattle.turnCommands[this.fieldIndex - 1];
        if (allyCommand?.command === Command.BALL || allyCommand?.command === Command.RUN) {
          gScene.currentBattle.turnCommands[this.fieldIndex] = { command: allyCommand?.command, skip: true };
        }
      }
    }

    if (gScene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = gScene.getPlayerField()[this.fieldIndex];

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
          gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      if (gScene.currentBattle.isBattleMysteryEncounter() && gScene.currentBattle.mysteryEncounter?.skipToFightInput) {
        gScene.ui.clearText();
        gScene.ui.setMode(Mode.FIGHT, this.fieldIndex);
      } else {
        gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
      }
    }
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = gScene.getPlayerField()[this.fieldIndex];
    let success: boolean;

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
            gScene.unshiftPhase(new SelectTargetPhase(this.fieldIndex));
          }
          if (moveTargets.targets.length <= 1 || moveTargets.multiple) {
            turnCommand.move!.targets = moveTargets.targets; //TODO: is the bang correct here?
          } else if (playerPokemon.getTag(BattlerTagType.CHARGING) && playerPokemon.getMoveQueue().length >= 1) {
            turnCommand.move!.targets = playerPokemon.getMoveQueue()[0].targets; //TODO: is the bang correct here?
          } else {
            gScene.unshiftPhase(new SelectTargetPhase(this.fieldIndex));
          }
          gScene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;
          success = true;
        } else if (cursor < playerPokemon.getMoveset().length) {
          const move = playerPokemon.getMoveset()[cursor]!; //TODO: is this bang correct?
          gScene.ui.setMode(Mode.MESSAGE);

          // Decides between a Disabled, Not Implemented, or No PP translation message
          const errorMessage =
          playerPokemon.isMoveRestricted(move.moveId, playerPokemon)
            ? playerPokemon.getRestrictingTag(move.moveId, playerPokemon)!.selectionDeniedText(playerPokemon, move.moveId)
            : move.getName().endsWith(" (N)") ? "battle:moveNotImplemented" : "battle:moveNoPP";
          const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

          gScene.ui.showText(i18next.t(errorMessage, { moveName: moveName }), null, () => {
            gScene.ui.clearText();
            gScene.ui.setMode(Mode.FIGHT, this.fieldIndex);
          }, null, true);
        }
        break;
      case Command.BALL:
        const notInDex = (gScene.getEnemyField().filter(p => p.isActive(true)).some(p => !gScene.gameData.dexData[p.species.speciesId].caughtAttr) && gScene.gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarterCosts).length - 1);
        if (gScene.arena.biomeType === Biome.END && (!gScene.gameMode.isClassic || gScene.gameMode.isFreshStartChallenge() || notInDex )) {
          gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.showText(i18next.t("battle:noPokeballForce"), null, () => {
            gScene.ui.showText("", 0);
            gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (gScene.currentBattle.battleType === BattleType.TRAINER) {
          gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.showText(i18next.t("battle:noPokeballTrainer"), null, () => {
            gScene.ui.showText("", 0);
            gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (gScene.currentBattle.isBattleMysteryEncounter() && !gScene.currentBattle.mysteryEncounter!.catchAllowed) {
          gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.showText(i18next.t("battle:noPokeballMysteryEncounter"), null, () => {
            gScene.ui.showText("", 0);
            gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else {
          const targets = gScene.getEnemyField().filter(p => p.isActive(true)).map(p => p.getBattlerIndex());
          if (targets.length > 1) {
            gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            gScene.ui.setMode(Mode.MESSAGE);
            gScene.ui.showText(i18next.t("battle:noPokeballMulti"), null, () => {
              gScene.ui.showText("", 0);
              gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }, null, true);
          } else if (cursor < 5) {
            const targetPokemon = gScene.getEnemyField().find(p => p.isActive(true));
            if (targetPokemon?.isBoss() && targetPokemon?.bossSegmentIndex >= 1 && !targetPokemon?.hasAbility(Abilities.WONDER_GUARD, false, true) && cursor < PokeballType.MASTER_BALL) {
              gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              gScene.ui.setMode(Mode.MESSAGE);
              gScene.ui.showText(i18next.t("battle:noPokeballStrong"), null, () => {
                gScene.ui.showText("", 0);
                gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              }, null, true);
            } else {
              gScene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
              gScene.currentBattle.turnCommands[this.fieldIndex]!.targets = targets;
              if (this.fieldIndex) {
                gScene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
              }
              success = true;
            }
          }
        }
        break;
      case Command.POKEMON:
      case Command.RUN:
        const isSwitch = command === Command.POKEMON;
        const { currentBattle, arena } = gScene;
        const mysteryEncounterFleeAllowed = currentBattle.mysteryEncounter?.fleeAllowed;
        if (!isSwitch && (arena.biomeType === Biome.END || (!isNullOrUndefined(mysteryEncounterFleeAllowed) && !mysteryEncounterFleeAllowed))) {
          gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.showText(i18next.t("battle:noEscapeForce"), null, () => {
            gScene.ui.showText("", 0);
            gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (!isSwitch && (currentBattle.battleType === BattleType.TRAINER || currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE)) {
          gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.showText(i18next.t("battle:noEscapeTrainer"), null, () => {
            gScene.ui.showText("", 0);
            gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
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
              gScene.ui.setMode(Mode.MESSAGE);
            }
            gScene.ui.showText(trappedAbMessages[0], null, () => {
              gScene.ui.showText("", 0);
              if (!isSwitch) {
                gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              }
            }, null, true);
          } else {
            const trapTag = playerPokemon.getTag(TrappedTag);

            // trapTag should be defined at this point, but just in case...
            if (!trapTag) {
              currentBattle.turnCommands[this.fieldIndex] = isSwitch
                ? { command: Command.POKEMON, cursor: cursor, args: args }
                : { command: Command.RUN };
              break;
            }

            if (!isSwitch) {
              gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              gScene.ui.setMode(Mode.MESSAGE);
            }
            gScene.ui.showText(
              i18next.t("battle:noEscapePokemon", {
                pokemonName:  trapTag.sourceId && gScene.getPokemonById(trapTag.sourceId) ? getPokemonNameWithAffix(gScene.getPokemonById(trapTag.sourceId)!) : "",
                moveName: trapTag.getMoveName(),
                escapeVerb: isSwitch ? i18next.t("battle:escapeVerbSwitch") : i18next.t("battle:escapeVerbFlee")
              }),
              null,
              () => {
                gScene.ui.showText("", 0);
                if (!isSwitch) {
                  gScene.ui.setMode(Mode.COMMAND, this.fieldIndex);
                }
              }, null, true);
          }
        }
        break;
    }

    if (success!) { // TODO: is the bang correct?
      this.end();
    }

    return success!; // TODO: is the bang correct?
  }

  cancel() {
    if (this.fieldIndex) {
      gScene.unshiftPhase(new CommandPhase(0));
      gScene.unshiftPhase(new CommandPhase(1));
      this.end();
    }
  }

  checkFightOverride(): boolean {
    const pokemon = this.getPokemon();

    const encoreTag = pokemon.getTag(EncoreTag) as EncoreTag;

    if (!encoreTag) {
      return false;
    }

    const moveIndex = pokemon.getMoveset().findIndex(m => m?.moveId === encoreTag.moveId);

    if (moveIndex === -1 || !pokemon.getMoveset()[moveIndex]!.isUsable(pokemon)) { // TODO: is this bang correct?
      return false;
    }

    this.handleCommand(Command.FIGHT, moveIndex, false);

    return true;
  }

  getFieldIndex(): integer {
    return this.fieldIndex;
  }

  getPokemon(): PlayerPokemon {
    return gScene.getPlayerField()[this.fieldIndex];
  }

  end() {
    gScene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}
