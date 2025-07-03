import { PokemonMove } from "#app/data/moves/pokemon-move";
import { Command } from "#enums/command";
import { FieldPhase } from "./field-phase";
import type { BattlerIndex } from "#enums/battler-index";
import { SwitchType } from "#enums/switch-type";
import { globalScene } from "#app/global-scene";
import { applyInSpeedOrder } from "#app/utils/speed-order";
import type Pokemon from "#app/field/pokemon";
import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { BypassSpeedChanceModifier } from "#app/modifier/modifier";

export class TurnStartPhase extends FieldPhase {
  public readonly phaseName = "TurnStartPhase";
  /**
   * Returns an ordering of the current field based on command priority
   * @returns {@linkcode BattlerIndex[]} the sequence of commands for this turn
   */
  getCommandOrder(): BattlerIndex[] {
    const playerField = globalScene
      .getPlayerField()
      .filter(p => p.isActive())
      .map(p => p.getBattlerIndex());
    const enemyField = globalScene
      .getEnemyField()
      .filter(p => p.isActive())
      .map(p => p.getBattlerIndex());
    const orderedTargets: BattlerIndex[] = playerField.concat(enemyField);

    // The function begins sorting orderedTargets based on command priority, move priority, and possible speed bypasses.
    // Non-FIGHT commands (SWITCH, BALL, RUN) have a higher command priority and will always occur before any FIGHT commands.
    orderedTargets.sort((a, b) => {
      const aCommand = globalScene.currentBattle.turnCommands[a];
      const bCommand = globalScene.currentBattle.turnCommands[b];

      if (aCommand?.command !== bCommand?.command) {
        if (aCommand?.command === Command.FIGHT) {
          return 1;
        }
        if (bCommand?.command === Command.FIGHT) {
          return -1;
        }
      }

      const aIndex = orderedTargets.indexOf(a);
      const bIndex = orderedTargets.indexOf(b);

      return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
    });
    return orderedTargets;
  }

  // TODO: Refactor this alongside `CommandPhase.handleCommand` to use SEPARATE METHODS
  // Also need a clearer distinction between "turn command" and queued moves
  start() {
    super.start();

    const field = globalScene.getField();
    const activeField = globalScene.getField(true);
    const moveOrder = this.getCommandOrder();

    applyInSpeedOrder(activeField, (p: Pokemon) => {
      const preTurnCommand = globalScene.currentBattle.preTurnCommands[p.getBattlerIndex()];

      if (preTurnCommand?.skip) {
        return;
      }

      switch (preTurnCommand?.command) {
        case Command.TERA:
          globalScene.phaseManager.pushNew("TeraPhase", p);
      }
    });

    const phaseManager = globalScene.phaseManager;
    applyInSpeedOrder(activeField, (p: Pokemon) => {
      applyAbAttrs("BypassSpeedChanceAbAttr", { pokemon: p });
      globalScene.applyModifiers(BypassSpeedChanceModifier, p.isPlayer(), p);
    });

    for (const o of moveOrder) {
      const pokemon = field[o];
      const turnCommand = globalScene.currentBattle.turnCommands[o];

      if (turnCommand?.skip) {
        continue;
      }

      switch (turnCommand?.command) {
        case Command.FIGHT: {
          const queuedMove = turnCommand.move;
          if (!queuedMove) {
            continue;
          }
          const move =
            pokemon.getMoveset().find(m => m.moveId === queuedMove.move && m.ppUsed < m.getMovePp()) ??
            new PokemonMove(queuedMove.move);
          if (move.getMove().hasAttr("MoveHeaderAttr")) {
            phaseManager.pushNew("MoveHeaderPhase", pokemon.getBattlerIndex(), move);
          }

          if (pokemon.isPlayer() && turnCommand.cursor === -1) {
            phaseManager.pushNew(
              "MovePhase",
              pokemon,
              turnCommand.targets || turnCommand.move!.targets,
              move,
              turnCommand.move!.useMode,
            ); //TODO: is the bang correct here?
          } else {
            phaseManager.pushNew(
              "MovePhase",
              pokemon,
              turnCommand.targets || turnCommand.move!.targets,
              move,
              queuedMove.useMode,
            ); // TODO: is the bang correct here?
          }
          break;
        }
        case Command.BALL:
          phaseManager.unshiftNew("AttemptCapturePhase", turnCommand.targets![0] % 2, turnCommand.cursor!); //TODO: is the bang correct here?
          break;
        case Command.POKEMON:
          {
            const switchType = turnCommand.args?.[0] ? SwitchType.BATON_PASS : SwitchType.SWITCH;
            phaseManager.pushNew(
              "SwitchSummonPhase",
              switchType,
              pokemon.getFieldIndex(),
              turnCommand.cursor!,
              true,
              pokemon.isPlayer(),
            );
          }
          break;
        case Command.RUN:
          {
            // Running (like ball throwing) is a team action taking up both Pokemon's turns.
            phaseManager.unshiftNew("AttemptRunPhase");
          }
          break;
      }
    }

    /**
     * this.end() will call shiftPhase(), which dumps everything from PrependQueue (aka everything that is unshifted()) to the front
     * of the queue and dequeues to start the next phase
     * this is important since stuff like SwitchSummon, AttemptRun, AttemptCapture Phases break the "flow" and should take precedence
     */
    this.end();
  }
}
