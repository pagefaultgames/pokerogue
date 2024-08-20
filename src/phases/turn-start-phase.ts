import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { applyAbAttrs, BypassSpeedChanceAbAttr, PreventBypassSpeedChanceAbAttr, ChangeMovePriorityAbAttr } from "#app/data/ability.js";
import { allMoves, applyMoveAttrs, IncrementMovePriorityAttr, MoveHeaderAttr } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Moves } from "#app/enums/moves.js";
import { Stat } from "#app/enums/stat.js";
import { PokemonMove } from "#app/field/pokemon.js";
import { BypassSpeedChanceModifier } from "#app/modifier/modifier.js";
import { Command } from "#app/ui/command-ui-handler.js";
import * as Utils from "#app/utils.js";
import { AttemptCapturePhase } from "./attempt-capture-phase";
import { AttemptRunPhase } from "./attempt-run-phase";
import { BerryPhase } from "./berry-phase";
import { FieldPhase } from "./field-phase";
import { MoveHeaderPhase } from "./move-header-phase";
import { MovePhase } from "./move-phase";
import { PostTurnStatusEffectPhase } from "./post-turn-status-effect-phase";
import { SwitchSummonPhase } from "./switch-summon-phase";
import { TurnEndPhase } from "./turn-end-phase";
import { WeatherEffectPhase } from "./weather-effect-phase";

export class TurnStartPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const field = this.scene.getField();
    const order = this.getOrder();

    const battlerBypassSpeed = {};

    this.scene.getField(true).filter(p => p.summonData).map(p => {
      const bypassSpeed = new Utils.BooleanHolder(false);
      const canCheckHeldItems = new Utils.BooleanHolder(true);
      applyAbAttrs(BypassSpeedChanceAbAttr, p, null, bypassSpeed);
      applyAbAttrs(PreventBypassSpeedChanceAbAttr, p, null, bypassSpeed, canCheckHeldItems);
      if (canCheckHeldItems.value) {
        this.scene.applyModifiers(BypassSpeedChanceModifier, p.isPlayer(), p, bypassSpeed);
      }
      battlerBypassSpeed[p.getBattlerIndex()] = bypassSpeed;
    });

    const moveOrder = order.slice(0);

    moveOrder.sort((a, b) => {
      const aCommand = this.scene.currentBattle.turnCommands[a]!;
      const bCommand = this.scene.currentBattle.turnCommands[b]!;

      if (aCommand.command !== bCommand.command) {
        if (aCommand.command === Command.FIGHT) {
          if (aCommand.move?.move === Moves.PURSUIT && bCommand.command === Command.POKEMON) {
            return -1;
          } else {
            return 1;
          }
        } else if (bCommand.command === Command.FIGHT) {
          if (bCommand.move?.move === Moves.PURSUIT && aCommand.command === Command.POKEMON) {
            return 1;
          } else {
            return -1;
          }
        }
      } else if (aCommand?.command === Command.FIGHT) {
        const aMove = allMoves[aCommand.move!.move];//TODO: is the bang correct here?
        const bMove = allMoves[bCommand!.move!.move];//TODO: is the bang correct here?

        const aPriority = new Utils.IntegerHolder(aMove.priority);
        const bPriority = new Utils.IntegerHolder(bMove.priority);

        applyMoveAttrs(IncrementMovePriorityAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a)!, null, aMove, aPriority); //TODO: is the bang correct here?
        applyMoveAttrs(IncrementMovePriorityAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b)!, null, bMove, bPriority); //TODO: is the bang correct here?

        applyAbAttrs(ChangeMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a)!, null, aMove, aPriority); //TODO: is the bang correct here?
        applyAbAttrs(ChangeMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b)!, null, bMove, bPriority); //TODO: is the bang correct here?

        if (aPriority.value !== bPriority.value) {
          const bracketDifference = Math.ceil(aPriority.value) - Math.ceil(bPriority.value);
          const hasSpeedDifference = battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value;
          if (bracketDifference === 0 && hasSpeedDifference) {
            return battlerBypassSpeed[a].value ? -1 : 1;
          }
          return aPriority.value < bPriority.value ? 1 : -1;
        }
      }

      if (battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value) {
        return battlerBypassSpeed[a].value ? -1 : 1;
      }

      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);

      return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
    });

    let orderIndex = 0;

    for (const o of moveOrder) {

      const pokemon = field[o];
      const turnCommand = this.scene.currentBattle.turnCommands[o];

      if (turnCommand?.skip) {
        continue;
      }

      switch (turnCommand?.command) {
      case Command.FIGHT:
        const queuedMove = turnCommand.move;
        pokemon.turnData.order = orderIndex++;
        if (!queuedMove) {
          continue;
        }
        const move = pokemon.getMoveset().find(m => m?.moveId === queuedMove.move) || new PokemonMove(queuedMove.move);
        if (move.getMove().hasAttr(MoveHeaderAttr)) {
          this.scene.unshiftPhase(new MoveHeaderPhase(this.scene, pokemon, move));
        }
        // even though pursuit is ordered before Pokemon commands in the move
        // order, the SwitchSummonPhase is unshifted onto the phase list, which
        // would cause it to run before pursuit if pursuit was pushed normally.
        // the SwitchSummonPhase can't be changed to a push either, because then
        // the MoveHeaderPhase for all moves would run prior to the switch-out,
        // which is not correct (eg, when focus punching a switching opponent,
        // the correct order is switch -> tightening focus message -> attack
        // fires, not focus -> switch -> attack). so, we have to specifically
        // unshift pursuit when there are other pokemon commands after it, as
        // well as order it before any Pokemon commands, otherwise it won't go first.
        const remainingMoves = moveOrder.slice(moveOrder.findIndex(mo => mo === o) + 1);
        const pendingOpposingPokemonCommands = remainingMoves.filter(o =>
          this.scene.currentBattle.turnCommands[o]!.command === Command.POKEMON
            && (pokemon.isPlayer() ? o >= BattlerIndex.ENEMY : o < BattlerIndex.ENEMY)
        );
        const arePokemonCommandsLeftInQueue = Boolean(pendingOpposingPokemonCommands.length);
        const addPhase = (
          queuedMove.move === Moves.PURSUIT && arePokemonCommandsLeftInQueue
            ? this.scene.unshiftPhase
            : this.scene.pushPhase
        ).bind(this.scene);

        // pursuit also hits the first pokemon to switch out in doubles,
        // regardless of original target
        const targets = queuedMove.move === Moves.PURSUIT && arePokemonCommandsLeftInQueue
          ? [pendingOpposingPokemonCommands[0]]
          : turnCommand.targets || turnCommand.move!.targets;
        if (pokemon.isPlayer()) {
          if (turnCommand.cursor === -1) {
            addPhase(new MovePhase(this.scene, pokemon, targets, move));
          } else {
            const playerPhase = new MovePhase(this.scene, pokemon, targets, move, false, queuedMove.ignorePP);
            addPhase(playerPhase);
          }
        } else {
          addPhase(new MovePhase(this.scene, pokemon, targets, move, false, queuedMove.ignorePP));
        }
        break;
      case Command.BALL:
        this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets![0] % 2, turnCommand.cursor!));//TODO: is the bang correct here?
        break;
      case Command.POKEMON:
        pokemon.addTag(BattlerTagType.ESCAPING);
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, pokemon.getFieldIndex(), turnCommand.cursor!, true, turnCommand.args![0] as boolean, pokemon.isPlayer()));
        break;
      case Command.RUN:
        let runningPokemon = pokemon;
        if (this.scene.currentBattle.double) {
          const playerActivePokemon = field.filter(pokemon => {
            if (!!pokemon) {
              return pokemon.isPlayer() && pokemon.isActive();
            } else {
              return;
            }
          });
          // if only one pokemon is alive, use that one
          if (playerActivePokemon.length > 1) {
            // find which active pokemon has faster speed
            const fasterPokemon = playerActivePokemon[0].getStat(Stat.SPD) > playerActivePokemon[1].getStat(Stat.SPD) ? playerActivePokemon[0] : playerActivePokemon[1];
            // check if either active pokemon has the ability "Run Away"
            const hasRunAway = playerActivePokemon.find(p => p.hasAbility(Abilities.RUN_AWAY));
            runningPokemon = hasRunAway !== undefined ? hasRunAway : fasterPokemon;
          }
        }
        this.scene.unshiftPhase(new AttemptRunPhase(this.scene, runningPokemon.getFieldIndex()));
        break;
      }
    }


    this.scene.pushPhase(new WeatherEffectPhase(this.scene));

    for (const o of order) {
      if (field[o].status && field[o].status.isPostTurn()) {
        this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, o));
      }
    }

    this.scene.pushPhase(new BerryPhase(this.scene));
    this.scene.pushPhase(new TurnEndPhase(this.scene));

    /**
       * this.end() will call shiftPhase(), which dumps everything from PrependQueue (aka everything that is unshifted()) to the front
       * of the queue and dequeues to start the next phase
       * this is important since stuff like SwitchSummon, AttemptRun, AttemptCapture Phases break the "flow" and should take precedence
       */
    this.end();
  }
}
