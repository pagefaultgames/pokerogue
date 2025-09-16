import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import type { TurnCommand } from "#app/battle";
import { globalScene } from "#app/global-scene";
import { TrickRoomTag } from "#data/arena-tag";
import { allMoves } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { Stat } from "#enums/stat";
import { SwitchType } from "#enums/switch-type";
import type { Pokemon } from "#field/pokemon";
import { BypassSpeedChanceModifier } from "#modifiers/modifier";
import { PokemonMove } from "#moves/pokemon-move";
import { FieldPhase } from "#phases/field-phase";
import { BooleanHolder, randSeedShuffle } from "#utils/common";

export class TurnStartPhase extends FieldPhase {
  public readonly phaseName = "TurnStartPhase";

  /**
   * Helper method to retrieve the current speed order of the combattants.
   * It also checks for Trick Room and reverses the array if it is present.
   * @returns The {@linkcode BattlerIndex}es of all on-field Pokemon, sorted in speed order.
   * @todo Make this private
   */
  getSpeedOrder(): BattlerIndex[] {
    const playerField = globalScene.getPlayerField().filter(p => p.isActive());
    const enemyField = globalScene.getEnemyField().filter(p => p.isActive());

    // Shuffle the list before sorting so speed ties produce random results
    // This is seeded with the current turn to prevent turn order varying
    // based on how long since you last reloaded.
    let orderedTargets = (playerField as Pokemon[]).concat(enemyField);
    globalScene.executeWithSeedOffset(
      () => {
        orderedTargets = randSeedShuffle(orderedTargets);
      },
      globalScene.currentBattle.turn,
      globalScene.waveSeed,
    );

    // Check for Trick Room and reverse sort order if active.
    // Notably, Pokerogue does NOT have the "outspeed trick room" glitch at >1809 spd.
    const speedReversed = new BooleanHolder(false);
    globalScene.arena.applyTags(TrickRoomTag, false, speedReversed);

    orderedTargets.sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a.getEffectiveStat(Stat.SPD);
      const bSpeed = b.getEffectiveStat(Stat.SPD);

      return speedReversed.value ? aSpeed - bSpeed : bSpeed - aSpeed;
    });

    return orderedTargets.map(t => t.getFieldIndex() + (t.isEnemy() ? BattlerIndex.ENEMY : BattlerIndex.PLAYER));
  }

  /**
   * This takes the result of {@linkcode getSpeedOrder} and applies priority / bypass speed attributes to it.
   * This also considers the priority levels of various commands and changes the result of `getSpeedOrder` based on such.
   * @returns The `BattlerIndex`es of all on-field Pokemon sorted in action order.
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
      applyAbAttrs("BypassSpeedChanceAbAttr", { pokemon: p, bypass: bypassSpeed });
      applyAbAttrs("PreventBypassSpeedChanceAbAttr", {
        pokemon: p,
        bypass: bypassSpeed,
        canCheckHeldItems,
      });
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

      // If there is no difference between the move's calculated priorities,
      // check for differences in battlerBypassSpeed and returns the result.
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
      // and uses a really jank (and incorrect) implementation
      if (turnCommand.command === Command.FIGHT) {
        pokemon.turnData.order = index;
      }
      this.handleTurnCommand(turnCommand, pokemon);
    });

    // Queue various effects for the end of the turn.
    phaseManager.pushNew("CheckInterludePhase");

    // TODO: Re-order these phases to be consistent with mainline turn order:
    // https://www.smogon.com/forums/threads/sword-shield-battle-mechanics-research.3655528/page-64#post-9244179

    phaseManager.pushNew("WeatherEffectPhase");
    phaseManager.pushNew("PositionalTagPhase");
    phaseManager.pushNew("BerryPhase");

    phaseManager.pushNew("CheckStatusEffectPhase", moveOrder);

    phaseManager.pushNew("TurnEndPhase");

    /*
     * `this.end()` will call `PhaseManager#shiftPhase()`, which dumps everything from `phaseQueuePrepend`
     * (aka everything that is queued via `unshift()`) to the front of the queue and dequeues to start the next phase.
     * This is important since stuff like `SwitchSummonPhase`, `AttemptRunPhase`, and `AttemptCapturePhase` break the "flow" and should take precedence
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
        globalScene.phaseManager.unshiftNew("AttemptRunPhase");
        break;
    }
  }

  private handleFightCommand(turnCommand: TurnCommand, pokemon: Pokemon) {
    const queuedMove = turnCommand.move;
    if (!queuedMove) {
      return;
    }

    // TODO: This seems somewhat dubious
    const move =
      pokemon.getMoveset().find(m => m.moveId === queuedMove.move && m.ppUsed < m.getMovePp())
      ?? new PokemonMove(queuedMove.move);

    if (move.getMove().hasAttr("MoveHeaderAttr")) {
      globalScene.phaseManager.unshiftNew("MoveHeaderPhase", pokemon, move);
    }

    globalScene.phaseManager.pushNew(
      "MovePhase",
      pokemon,
      turnCommand.targets ?? queuedMove.targets,
      move,
      queuedMove.useMode,
    );
  }
}
