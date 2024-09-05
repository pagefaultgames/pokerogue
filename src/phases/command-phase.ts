import BattleScene from "#app/battle-scene";
import { TurnCommand, BattleType } from "#app/battle";
import { TrappedTag, EncoreTag } from "#app/data/battler-tags";
import { MoveTargetSet, getMoveTargets } from "#app/data/move";
import { speciesStarters } from "#app/data/pokemon-species";
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

export class CommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    if (this.fieldIndex) {
      // If we somehow are attempting to check the right pokemon but there's only one pokemon out
      // Switch back to the center pokemon. This can happen rarely in double battles with mid turn switching
      if (this.scene.getPlayerField().filter(p => p.isActive()).length === 1) {
        this.fieldIndex = FieldPosition.CENTER;
      } else {
        const allyCommand = this.scene.currentBattle.turnCommands[this.fieldIndex - 1];
        if (allyCommand?.command === Command.BALL || allyCommand?.command === Command.RUN) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: allyCommand?.command, skip: true };
        }
      }
    }

    if (this.scene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];

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
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
    }
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
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
          turnCommand.targets = [this.fieldIndex];
        }
        console.log(moveTargets, getPokemonNameWithAffix(playerPokemon));
        if (moveTargets.targets.length > 1 && moveTargets.multiple) {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
        }
        if (moveTargets.targets.length <= 1 || moveTargets.multiple) {
            turnCommand.move!.targets = moveTargets.targets; //TODO: is the bang correct here?
        } else if (playerPokemon.getTag(BattlerTagType.CHARGING) && playerPokemon.getMoveQueue().length >= 1) {
            turnCommand.move!.targets = playerPokemon.getMoveQueue()[0].targets; //TODO: is the bang correct here?
        } else {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
        }
        this.scene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;
        success = true;
      } else if (cursor < playerPokemon.getMoveset().length) {
        const move = playerPokemon.getMoveset()[cursor]!; //TODO: is this bang correct?
        this.scene.ui.setMode(Mode.MESSAGE);

        // Decides between a Disabled, Not Implemented, or No PP translation message
        const errorMessage =
          playerPokemon.isMoveRestricted(move.moveId)
            ? playerPokemon.getRestrictingTag(move.moveId)!.selectionDeniedText(playerPokemon, move.moveId)
            : move.getName().endsWith(" (N)") ? "battle:moveNotImplemented" : "battle:moveNoPP";
        const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

        this.scene.ui.showText(i18next.t(errorMessage, { moveName: moveName }), null, () => {
          this.scene.ui.clearText();
          this.scene.ui.setMode(Mode.FIGHT, this.fieldIndex);
        }, null, true);
      }
      break;
    case Command.BALL:
      const notInDex = (this.scene.getEnemyField().filter(p => p.isActive(true)).some(p => !p.scene.gameData.dexData[p.species.speciesId].caughtAttr) && this.scene.gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarters).length - 1);
      if (this.scene.arena.biomeType === Biome.END && (!this.scene.gameMode.isClassic || this.scene.gameMode.isFreshStartChallenge() || notInDex )) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballForce"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballTrainer"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        const targets = this.scene.getEnemyField().filter(p => p.isActive(true)).map(p => p.getBattlerIndex());
        if (targets.length > 1) {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(i18next.t("battle:noPokeballMulti"), null, () => {
            this.scene.ui.showText("", 0);
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (cursor < 5) {
          const targetPokemon = this.scene.getEnemyField().find(p => p.isActive(true));
          if (targetPokemon?.isBoss() && targetPokemon?.bossSegmentIndex >= 1 && !targetPokemon?.hasAbility(Abilities.WONDER_GUARD, false, true) && cursor < PokeballType.MASTER_BALL) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(i18next.t("battle:noPokeballStrong"), null, () => {
              this.scene.ui.showText("", 0);
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }, null, true);
          } else {
            this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
              this.scene.currentBattle.turnCommands[this.fieldIndex]!.targets = targets;
              if (this.fieldIndex) {
                this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
              }
              success = true;
          }
        }
      }
      break;
    case Command.POKEMON:
    case Command.RUN:
      const isSwitch = command === Command.POKEMON;
      if (!isSwitch && this.scene.arena.biomeType === Biome.END) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeForce"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (!isSwitch && this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeTrainer"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        const batonPass = isSwitch && args[0] as boolean;
        const trappedAbMessages: string[] = [];
        if (batonPass || !playerPokemon.isTrapped(trappedAbMessages)) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
            ? { command: Command.POKEMON, cursor: cursor, args: args }
            : { command: Command.RUN };
          success = true;
          if (!isSwitch && this.fieldIndex) {
              this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
          }
        } else if (trappedAbMessages.length > 0) {
          if (!isSwitch) {
            this.scene.ui.setMode(Mode.MESSAGE);
          }
          this.scene.ui.showText(trappedAbMessages[0], null, () => {
            this.scene.ui.showText("", 0);
            if (!isSwitch) {
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }
          }, null, true);
        } else {
          const trapTag = playerPokemon.getTag(TrappedTag);

          // trapTag should be defined at this point, but just in case...
          if (!trapTag) {
            this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor, args: args }
              : { command: Command.RUN };
            break;
          }

          if (!isSwitch) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
          }
          this.scene.ui.showText(
            i18next.t("battle:noEscapePokemon", {
              pokemonName:  trapTag.sourceId && this.scene.getPokemonById(trapTag.sourceId) ? getPokemonNameWithAffix(this.scene.getPokemonById(trapTag.sourceId)!) : "",
              moveName: trapTag.getMoveName(),
              escapeVerb: isSwitch ? i18next.t("battle:escapeVerbSwitch") : i18next.t("battle:escapeVerbFlee")
            }),
            null,
            () => {
              this.scene.ui.showText("", 0);
              if (!isSwitch) {
                this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
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
      this.scene.unshiftPhase(new CommandPhase(this.scene, 0));
      this.scene.unshiftPhase(new CommandPhase(this.scene, 1));
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
    return this.scene.getPlayerField()[this.fieldIndex];
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}
