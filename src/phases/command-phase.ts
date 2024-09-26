import BattleScene from "#app/battle-scene";
import { TurnCommand, BattleType, BattlerIndex } from "#app/battle";
import { TrappedTag, EncoreTag } from "#app/data/battler-tags";
import { MoveTargetSet, getMoveTargets } from "#app/data/move";
import { speciesStarters } from "#app/data/pokemon-species";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { PokeballType } from "#app/enums/pokeball";
import { FieldPosition, PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { SelectTargetPhase } from "./select-target-phase";
import * as LoggerTools from "../logger";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { getEnumKeys, isNullOrUndefined } from "#app/utils";

export const targIDs: string[] = ["Self", "Self", "Ally", "L", "R", "Self", "Ally"]

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
          if (this.fieldIndex == 0) {
            LoggerTools.Actions[1] = ""; // Remove the second Pokémon's action, as we will not be attacking this turn
          } else {
            LoggerTools.Actions[0] = "" // Remove the first Pokémon's action, as their turn is now being skipped]
          }
          this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: allyCommand?.command, skip: true };
        }
      }
    }

    if (this.scene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];

    const moveQueue = playerPokemon.getMoveQueue();

    // Remove queued moves the Pokemon no longer has access to or can't use this turn
    while (moveQueue.length && moveQueue[0]
      && moveQueue[0].move && (!playerPokemon.getMoveset().find(m => m?.moveId === moveQueue[0].move)
        || !playerPokemon.getMoveset()[playerPokemon.getMoveset().findIndex(m => m?.moveId === moveQueue[0].move)]!.isUsable(playerPokemon, moveQueue[0].ignorePP))) { // TODO: is the bang correct?
      moveQueue.shift();
    }

    if (moveQueue.length) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move) {
        // Struggle
        this.handleCommand(Command.FIGHT, false, -1, false);
      } else {
        // Locate the queued move in our moveset
        const moveIndex = playerPokemon.getMoveset().findIndex(m => m?.moveId === queuedMove.move);
        if (moveIndex > -1 && playerPokemon.getMoveset()[moveIndex]!.isUsable(playerPokemon, queuedMove.ignorePP)) { // TODO: is the bang correct?
          // Use the queued move
          this.handleCommand(Command.FIGHT, false, moveIndex, queuedMove.ignorePP, { targets: queuedMove.targets, multiple: queuedMove.targets.length > 1 });
        } else {
          // The move is no longer in our moveset or is unuseable; allow the player to choose an action
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      if (this.scene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER && this.scene.currentBattle.mysteryEncounter?.skipToFightInput) {
        this.scene.ui.clearText();
        this.scene.ui.setMode(Mode.FIGHT, this.fieldIndex);
      } else {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
      }
    }
  }

  handleCommand(command: Command, logCommand: boolean = true, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
    let success: boolean;

    if (!logCommand) {
      LoggerTools.Actions[this.fieldIndex] = "%SKIP"
    }

    switch (command) {
    case Command.FIGHT:
      let useStruggle = false;
      if (cursor === -1 ||
          playerPokemon.trySelectMove(cursor, args[0] as boolean) ||
          (useStruggle = cursor > -1 && !playerPokemon.getMoveset().filter(m => m?.isUsable(playerPokemon)).length)) {
        const moveId = !useStruggle ? cursor > -1 ? playerPokemon.getMoveset()[cursor]!.moveId : Moves.NONE : Moves.STRUGGLE; // TODO: is the bang correct?
        const turnCommand: TurnCommand = { command: Command.FIGHT, cursor: cursor, move: { move: moveId, targets: [], ignorePP: args[0] }, args: args };
        const moveTargets: MoveTargetSet = args.length < 3 ? getMoveTargets(playerPokemon, moveId) : args[2];
        let moveData: PokemonMove | undefined;
        if (!moveId) {
          turnCommand.targets = [this.fieldIndex];
        } else {
          moveData = new PokemonMove(moveId, 0, 0, true);
        }
        console.log(moveTargets, getPokemonNameWithAffix(playerPokemon));
        if (moveTargets.targets.length > 1 && moveTargets.multiple) {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
          // No need to log the move, as SelectTargetPhase will call another CommandPhase with the correct data
        }
        if (moveTargets.targets.length <= 1 || moveTargets.multiple) {
          turnCommand.move!.targets = moveTargets.targets; //TODO: is the bang correct here?
          LoggerTools.Actions[this.fieldIndex] = (moveData ? moveData!.getName() : "[???]") + " " + this.formatTargets([], this.fieldIndex)
        } else if (playerPokemon.getTag(BattlerTagType.CHARGING) && playerPokemon.getMoveQueue().length >= 1) {
          // A charging move will be executed this turn, so we do not need to log ourselves using it (we already selected the move last turn)
          turnCommand.move!.targets = playerPokemon.getMoveQueue()[0].targets; //TODO: is the bang correct here?
        } else {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
          // No need to log the move, as SelectTargetPhase will call another CommandPhase with the correct data
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
      } else if (this.scene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER && !this.scene.currentBattle.mysteryEncounter!.catchAllowed) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballMysteryEncounter"), null, () => {
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
            LoggerTools.Actions[this.fieldIndex] = "Ball"
            if (this.fieldIndex) {
              LoggerTools.Actions.shift()
              this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
            }
            success = true;
          }
        }
      }
      break;
    case Command.POKEMON:
    case Command.RUN:
      // We are attempting to switch Pokémon or run from battle
      /** Are we attempting to switch (`true`) or run away (`false`)? */
      const isSwitch = command === Command.POKEMON;
      /** Pulls data from the `BattleScene` */
      const { currentBattle, arena } = this.scene;
      /** Whether the player can flee from this Mystery Encounter */
      const mysteryEncounterFleeAllowed = currentBattle.mysteryEncounter?.fleeAllowed;
      if (!isSwitch && (arena.biomeType === Biome.END || (!isNullOrUndefined(mysteryEncounterFleeAllowed) && !mysteryEncounterFleeAllowed))) {
        // We are attempting to run away, and we are either in ???, or in a Mystery Encounter we're not allowed to flee from
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeForce"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (!isSwitch && (currentBattle.battleType === BattleType.TRAINER || currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE)) {
        // We are attempting to run away from a Trainer Battle
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeTrainer"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        // We are attempting to switch, or are attempting to run away and the game isn't preventing it
        /**
         * Whether we are attempting to Baton Pass.
         * 
         * If we are running away, not switching, this value is `false`. */
        const batonPass = isSwitch && args[0] as boolean;
        /** Stores reasons why you cannot run away or switch your Trapped Pokémon. */
        const trappedAbMessages: string[] = [];
        if (batonPass || !playerPokemon.isTrapped(trappedAbMessages)) { // We are attempting to Baton Pass
          currentBattle.turnCommands[this.fieldIndex] = isSwitch
            ? { command: Command.POKEMON, cursor: cursor, args: args }
            : { command: Command.RUN };
          success = true;
          LoggerTools.Actions[this.fieldIndex] = isSwitch ? `Switch to ${this.scene.getParty()[cursor].name}` : "Run from battle"
          if (!isSwitch && this.fieldIndex) {
            // If we're trying to run away, and we are in the second field slot, skip the first Pokémon's turn
            currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
          }
        } else if (trappedAbMessages.length > 0) { // We are attempting to Baton Pass, but we were trapped during the turn and can't do so anymore
          // This is actually genius wow
          // If batonPass was true, playerPokemon.isTrapped() will run
          // If this function also returns true, the top block is skipped, and this block runs
          // If batonPass is false, playerPokemon.isTrapped() will not run, which means trappedAbMessages.length is 0, and this block is skipped, too
          if (!isSwitch) {
            this.scene.ui.setMode(Mode.MESSAGE);
          }
          this.scene.ui.showText(trappedAbMessages[0], null, () => {
            this.scene.ui.showText("", 0);
            if (!isSwitch) {
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }
          }, null, true);
        } else { // We are not attempting to Baton Pass
          const trapTag = playerPokemon.getTag(TrappedTag);

          // trapTag should be defined at this point, but just in case...
          if (!trapTag) {
            // If the Pokémon is not trapped, break from this block and set the action
            currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor, args: args }
              : { command: Command.RUN };
            LoggerTools.Actions[this.fieldIndex] = isSwitch ? `Switch to ${this.scene.getParty()[cursor].name}` : "Run from battle"
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
      LoggerTools.Actions[0] = ""
      this.scene.unshiftPhase(new CommandPhase(this.scene, 0));
      LoggerTools.Actions[1] = ""
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

    // Select the forced move (it is not logged since the player cannot make a choice here)
    this.handleCommand(Command.FIGHT, false, moveIndex, false);

    return true;
  }

  /**
   * Formats an attack's targets.
   * @param indices The `BattlerIndex` of all targets
   * @param fieldIndex The `BattlerIndex` of the user
   */
  formatTargets(indices: BattlerIndex[], fieldIndex: BattlerIndex) {
    var output: string[] = [];
    for (var i = 0; i < indices.length; i++) {
      var selection = "";
      if (fieldIndex < 2) {
        // Player
        selection = targIDs[indices[i] + 1];
      } else {
        // Enemy
        selection = targIDs[indices[i] + 3];
      }
      // If this Pokémon is on the right side of the field, flip the terms 'self' and 'ally'
      if (selection == "Self" && fieldIndex % 2 == 1) {
        selection = "Ally"
      }
      if (selection == "Ally" && fieldIndex % 2 == 1) {
        selection = "Self"
      }
    }
    return "→ " + output.join(", ");
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
