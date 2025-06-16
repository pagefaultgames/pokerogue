import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Stat } from "#app/enums/stat";
import type Pokemon from "#app/field/pokemon";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import { BypassSpeedChanceModifier } from "#app/modifier/modifier";
import { Command } from "#enums/command";
import { randSeedShuffle, BooleanHolder } from "#app/utils/common";
import { FieldPhase } from "./field-phase";
import { BattlerIndex } from "#enums/battler-index";
import { TrickRoomTag } from "#app/data/arena-tag";
import { SwitchType } from "#enums/switch-type";
import { globalScene } from "#app/global-scene";
import type { TurnCommand } from "#app/battle";

export class TurnStartPhase extends FieldPhase {
  public readonly phaseName = "TurnStartPhase";

  /**
   * This orders the active Pokemon on the field by speed into an BattlerIndex array and returns that array.
   * It also checks for Trick Room and reverses the array if it is present.
   * @returns {@linkcode BattlerIndex[]} the battle indices of all pokemon on the field ordered by speed
   */
  getSpeedOrder(): BattlerIndex[] {
    const playerField = globalScene.getPlayerField().filter(p => p.isActive()) as Pokemon[];
    const enemyField = globalScene.getEnemyField().filter(p => p.isActive()) as Pokemon[];

    // We shuffle the list before sorting so speed ties produce random results
    let orderedTargets: Pokemon[] = playerField.concat(enemyField);
    // We seed it with the current turn to prevent an inconsistency where it
    // was varying based on how long since you last reloaded
    globalScene.executeWithSeedOffset(
      () => {
        orderedTargets = randSeedShuffle(orderedTargets);
      },
      globalScene.currentBattle.turn,
      globalScene.waveSeed,
    );

    // Next, a check for Trick Room is applied to determine sort order.
    const speedReversed = new BooleanHolder(false);
    globalScene.arena.applyTags(TrickRoomTag, false, speedReversed);

    // Adjust the sort function based on whether Trick Room is active.
    orderedTargets.sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a?.getEffectiveStat(Stat.SPD) ?? 0;
      const bSpeed = b?.getEffectiveStat(Stat.SPD) ?? 0;

      return speedReversed.value ? aSpeed - bSpeed : bSpeed - aSpeed;
    });

    return orderedTargets.map(t => t.getFieldIndex() + (!t.isPlayer() ? BattlerIndex.ENEMY : BattlerIndex.PLAYER));
  }

  /**
   * This takes the result of getSpeedOrder and applies priority / bypass speed attributes to it.
   * This also considers the priority levels of various commands and changes the result of getSpeedOrder based on such.
   * @returns {@linkcode BattlerIndex[]} the final sequence of commands for this turn
   */
  getCommandOrder(): BattlerIndex[] {
    let moveOrder = this.getSpeedOrder();
    // The creation of the battlerBypassSpeed object contains checks for the ability Quick Draw and the held item Quick Claw
    // The ability Mycelium Might disables Quick Claw's activation when using a status move
    // This occurs before the main loop because of battles with more than two Pokemon
    const battlerBypassSpeed = {};

    globalScene.getField(true).forEach(p => {
      const bypassSpeed = new BooleanHolder(false);
      const canCheckHeldItems = new BooleanHolder(true);
      applyAbAttrs("BypassSpeedChanceAbAttr", p, null, false, bypassSpeed);
      applyAbAttrs("PreventBypassSpeedChanceAbAttr", p, null, false, bypassSpeed, canCheckHeldItems);
      if (canCheckHeldItems.value) {
        globalScene.applyModifiers(BypassSpeedChanceModifier, p.isPlayer(), p, bypassSpeed);
      }
      battlerBypassSpeed[p.getBattlerIndex()] = bypassSpeed;
    });

    // The function begins sorting orderedTargets based on command priority, move priority, and possible speed bypasses.
    // Non-FIGHT commands (SWITCH, BALL, RUN) have a higher command priority and will always occur before any FIGHT commands.
    moveOrder = moveOrder.slice(0);
    moveOrder.sort((a, b) => {
      const aCommand = globalScene.currentBattle.turnCommands[a];
      const bCommand = globalScene.currentBattle.turnCommands[b];

      if (aCommand?.command !== bCommand?.command) {
        if (aCommand?.command === Command.FIGHT) {
          return 1;
        }
        if (bCommand?.command === Command.FIGHT) {
          return -1;
        }
      } else if (aCommand?.command === Command.FIGHT) {
        const aMove = allMoves[aCommand.move!.move];
        const bMove = allMoves[bCommand!.move!.move];

        const aUser = globalScene.getField(true).find(p => p.getBattlerIndex() === a)!;
        const bUser = globalScene.getField(true).find(p => p.getBattlerIndex() === b)!;

        const aPriority = aMove.getPriority(aUser, false);
        const bPriority = bMove.getPriority(bUser, false);

        // The game now checks for differences in priority levels.
        // If the moves share the same original priority bracket, it can check for differences in battlerBypassSpeed and return the result.
        // This conditional is used to ensure that Quick Claw can still activate with abilities like Stall and Mycelium Might (attack moves only)
        // Otherwise, the game returns the user of the move with the highest priority.
        const isSameBracket = Math.ceil(aPriority) - Math.ceil(bPriority) === 0;
        if (aPriority !== bPriority) {
          if (isSameBracket && battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value) {
            return battlerBypassSpeed[a].value ? -1 : 1;
          }
          return aPriority < bPriority ? 1 : -1;
        }
      }

      // If there is no difference between the move's calculated priorities, the game checks for differences in battlerBypassSpeed and returns the result.
      if (battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value) {
        return battlerBypassSpeed[a].value ? -1 : 1;
      }

      const aIndex = moveOrder.indexOf(a);
      const bIndex = moveOrder.indexOf(b);

      return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
    });
    return moveOrder;
  }

  // TODO: Refactor this alongside `CommandPhase.handleCommand` to use SEPARATE METHODS
  // Also need a clearer distinction between "turn command" and queued moves
  start() {
    super.start();

    const field = globalScene.getField();
    const moveOrder = this.getCommandOrder();

    for (const o of this.getSpeedOrder()) {
      const pokemon = field[o];
      const preTurnCommand = globalScene.currentBattle.preTurnCommands[o];

      if (preTurnCommand?.skip) {
        continue;
      }

      switch (preTurnCommand?.command) {
        case Command.TERA:
          globalScene.phaseManager.pushNew("TeraPhase", pokemon);
      }
    }

    const phaseManager = globalScene.phaseManager;

    moveOrder.forEach((o, index) => {
      const pokemon = field[o];
      const turnCommand = globalScene.currentBattle.turnCommands[o];

      if (!turnCommand || turnCommand.skip) {
        return;
      }

      // TODO: Remove `turnData.order` - 
      // it is used exclusively for Fusion Flare/Bolt
      // and uses a really jank implementation 
      if (turnCommand.command === Command.FIGHT) {
        pokemon.turnData.order = index;
      }
      this.handleTurnCommand(turnCommand, pokemon);
    });

    phaseManager.pushNew("WeatherEffectPhase");
    phaseManager.pushNew("BerryPhase");

    /** Add a new phase to check who should be taking status damage */
    phaseManager.pushNew("CheckStatusEffectPhase", moveOrder);

    phaseManager.pushNew("TurnEndPhase");

    /**
     * this.end() will call shiftPhase(), which dumps everything from PrependQueue (aka everything that is unshifted()) to the front
     * of the queue and dequeues to start the next phase
     * this is important since stuff like SwitchSummon, AttemptRun, AttemptCapture Phases break the "flow" and should take precedence
     */
    this.end();
  }

  private handleTurnCommand(turnCommand: TurnCommand, pokemon: Pokemon) {
    switch (turnCommand?.command) {
      case Command.FIGHT:
        this.handleFightCommand(turnCommand, pokemon);
        break;
      case Command.BALL:
        globalScene.phaseManager.unshiftNew("AttemptCapturePhase", turnCommand.targets![0] % 2, turnCommand.cursor!); //TODO: is the bang correct here?
        break;
      case Command.POKEMON:
        globalScene.phaseManager.unshiftNew(
          "SwitchSummonPhase",
          turnCommand.args?.[0] ? SwitchType.BATON_PASS : SwitchType.SWITCH,
          pokemon.getFieldIndex(),
          turnCommand.cursor!, // TODO: Is this bang correct?
          true,
          pokemon.isPlayer(),
        );
        break;
      case Command.RUN:
        {
          const playerActivePokemon = globalScene.getPokemonAllowedInBattle();
          if (!globalScene.currentBattle.double || playerActivePokemon.length === 1) {
            // If not in doubles, attempt to run with the currently active Pokemon.
            globalScene.phaseManager.unshiftNew("AttemptRunPhase", pokemon.getFieldIndex());
            return;
          }

          // Use the fastest first pokemon we find with Run Away, or else the faster of the 2 player pokemon.
          // This intentionally does not check for Trick Room.
          // TODO: This phase should not take a pokemon at all
          const sortedPkmn = playerActivePokemon.sort((p1, p2) => p1.getStat(Stat.SPD) - p2.getStat(Stat.SPD));
          const runningPokemon = sortedPkmn.find(p => p.hasAbility(AbilityId.RUN_AWAY)) ?? sortedPkmn[0];

          globalScene.phaseManager.unshiftNew("AttemptRunPhase", runningPokemon.getFieldIndex());
        }
        break;
    }
  }

  private handleFightCommand(turnCommand: TurnCommand, pokemon: Pokemon) {
    if (!turnCommand.move) {
      return;
    }

    const queuedMove = turnCommand.move;

    // TODO: This seems somewhat dubious
    const move =
      pokemon.getMoveset().find(m => m.moveId === queuedMove.move && m.ppUsed < m.getMovePp()) ??
      new PokemonMove(queuedMove.move);

    if (move.getMove().hasAttr("MoveHeaderAttr")) {
      globalScene.phaseManager.unshiftNew("MoveHeaderPhase", pokemon, move);
    }

    // TODO: Review what a `-1` cursor means
    if (pokemon.isPlayer() && turnCommand.cursor === -1) {
      globalScene.phaseManager.pushNew("MovePhase", pokemon, turnCommand.targets ?? queuedMove.targets, move);
    } else {
      globalScene.phaseManager.pushNew(
        "MovePhase",
        pokemon,
        turnCommand.targets ?? turnCommand.move.targets,
        move,
        false,
        queuedMove.useMode,
      );
    }
  }
}
