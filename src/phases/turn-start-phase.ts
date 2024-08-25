import BattleScene from "#app/battle-scene.js";
import { applyAbAttrs, BypassSpeedChanceAbAttr, PreventBypassSpeedChanceAbAttr, ChangeMovePriorityAbAttr } from "#app/data/ability.js";
import { allMoves, applyMoveAttrs, IncrementMovePriorityAttr, MoveHeaderAttr } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { Stat } from "#app/enums/stat.js";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";
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
import * as LoggerTools from "../logger";
import { BattlerIndex } from "#app/battle.js";

export class TurnStartPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  generateTargString(t: BattlerIndex[]) {
    var targets = ['Self']
    for (var i = 0; i < this.scene.getField().length; i++) {
      if (this.scene.getField()[i] != null)
      targets[this.scene.getField()[i].getBattlerIndex() + 1] = this.scene.getField()[i].name
    }
    for (var i = 0; i < this.scene.getEnemyField().length; i++) {
      if (this.scene.getEnemyField()[i] != null)
      targets[this.scene.getEnemyField()[i].getBattlerIndex() + 1] = this.scene.getEnemyField()[i].name
    }
    var targetFull: string[] = []
    for (var i = 0; i < t.length; i++) {
      targetFull.push(targets[t[i] + 1])
    }
    if (targetFull.join(", ") == targets.join(", ")) return ""
    return " → " + targetFull.join(", ")
  }

  getBattlers(user: Pokemon): Pokemon[] {
    var battlers: Pokemon[] = []
    battlers[0] = this.scene.getField()[0]
    battlers[1] = this.scene.getField()[1]
    battlers[2] = this.scene.getEnemyField()[0]
    battlers[3] = this.scene.getEnemyField()[1]
    battlers.unshift(user)
    return battlers;
  }

  start() {
    super.start();

    const field = this.scene.getField();
    const order = this.getOrder();

    const battlerBypassSpeed = {};

    const playerActions: string[] = []

    const moveOrder = order.slice(0);

    while (LoggerTools.Actions.length > 0) {
      LoggerTools.Actions.pop()
    }

    for (const o of moveOrder) {

      const pokemon = field[o];
      const turnCommand = this.scene.currentBattle.turnCommands[o];

      if (turnCommand?.skip || !pokemon.isPlayer()) {
        continue;
      }

      switch (turnCommand?.command) {
      case Command.FIGHT:
        const queuedMove = turnCommand.move;
        if (!queuedMove) {
          continue;
        }
        LoggerTools.Actions[pokemon.getBattlerIndex()] = `[[ ${new PokemonMove(queuedMove.move).getName()} unknown target ]]`
        break;
      case Command.BALL:
        var ballNames = [
          "Poké Ball",
          "Great Ball",
          "Ultra Ball",
          "Rogue Ball",
          "Master Ball",
          "Luxury Ball"
        ]
        LoggerTools.Actions[pokemon.getBattlerIndex()] = ballNames[turnCommand.cursor!]
        playerActions.push(ballNames[turnCommand.cursor!])
        //this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets[0] % 2, turnCommand.cursor));
        break;
      case Command.POKEMON:
        break;
      case Command.RUN:
        LoggerTools.Actions[pokemon.getBattlerIndex()] = "Run"
        playerActions.push("Run")
        break;
      }
    }
    //LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, playerActions.join(" | "))

    this.scene.getField(true).filter(p => p.summonData).map(p => {
      const bypassSpeed = new Utils.BooleanHolder(false);
      const canCheckHeldItems = new Utils.BooleanHolder(true);
      applyAbAttrs(BypassSpeedChanceAbAttr, p, null, false, bypassSpeed);
      applyAbAttrs(PreventBypassSpeedChanceAbAttr, p, null, false, bypassSpeed, canCheckHeldItems);
      if (canCheckHeldItems.value) {
        this.scene.applyModifiers(BypassSpeedChanceModifier, p.isPlayer(), p, bypassSpeed);
      }
      battlerBypassSpeed[p.getBattlerIndex()] = bypassSpeed;
    });

    moveOrder.sort((a, b) => {
      const aCommand = this.scene.currentBattle.turnCommands[a];
      const bCommand = this.scene.currentBattle.turnCommands[b];

      if (aCommand?.command !== bCommand?.command) {
        if (aCommand?.command === Command.FIGHT) {
          return 1;
        } else if (bCommand?.command === Command.FIGHT) {
          return -1;
        }
      } else if (aCommand?.command === Command.FIGHT) {
        const aMove = allMoves[aCommand.move!.move];//TODO: is the bang correct here?
        const bMove = allMoves[bCommand!.move!.move];//TODO: is the bang correct here?

        const aPriority = new Utils.IntegerHolder(aMove.priority);
        const bPriority = new Utils.IntegerHolder(bMove.priority);

        applyMoveAttrs(IncrementMovePriorityAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a)!, null, aMove, aPriority); //TODO: is the bang correct here?
        applyMoveAttrs(IncrementMovePriorityAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b)!, null, bMove, bPriority); //TODO: is the bang correct here?

        applyAbAttrs(ChangeMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a)!, null, false, aMove, aPriority); //TODO: is the bang correct here?
        applyAbAttrs(ChangeMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b)!, null, false, bMove, bPriority); //TODO: is the bang correct here?

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
        if (pokemon.isPlayer()) {
          if (turnCommand.cursor === -1) {
            //console.log("turncommand cursor was -1 -- running TOP block")
            this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move!.targets, move));//TODO: is the bang correct here?
            var targets = turnCommand.targets || turnCommand.move!.targets
            var mv = move
            if (pokemon.isPlayer()) {
              console.log(turnCommand.targets, turnCommand.move!.targets)
              LoggerTools.Actions[pokemon.getBattlerIndex()] = mv.getName()
              if (this.scene.currentBattle.double) {
                var targIDs = ["Self", "Self", "Ally", "L", "R"]
                if (pokemon.getBattlerIndex() == 1) targIDs = ["Self", "Ally", "Self", "L", "R"]
                LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
              } else {
                var targIDs = ["Self", "", "", "", ""]
                var myField = this.scene.getField()
                if (myField[0])
                  targIDs[1] = myField[0].name
                if (myField[1])
                  targIDs[2] = myField[1].name
                var eField = this.scene.getEnemyField()
                if (eField[0])
                  targIDs[3] = eField[0].name
                if (eField[1])
                  targIDs[4] = eField[1].name
                //LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
              }
              console.log(mv.getName(), targets)
            }
          } else {
            //console.log("turncommand = ", turnCommand, " -- running BOTTOM block")
            const playerPhase = new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move!.targets, move, false, queuedMove.ignorePP);//TODO: is the bang correct here?
            var targets = turnCommand.targets || turnCommand.move!.targets
            var mv = move
            if (pokemon.isPlayer()) {
              console.log(turnCommand.targets, turnCommand.move!.targets)
              if (turnCommand.args && turnCommand.args[1] && turnCommand.args[1].isContinuing != undefined) {
                console.log(mv.getName(), targets)
              } else {
                LoggerTools.Actions[pokemon.getBattlerIndex()] = mv.getName()
                if (this.scene.currentBattle.double) {
                  var targIDs = ["Self", "Self", "Ally", "L", "R"]
                  if (pokemon.getBattlerIndex() == 1) targIDs = ["Self", "Ally", "Self", "L", "R"]
                  LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
                } else {
                  var targIDs = ["Self", "", "", "", ""]
                  var myField = this.scene.getField()
                  if (myField[0])
                    targIDs[1] = myField[0].name
                  if (myField[1])
                    targIDs[2] = myField[1].name
                  var eField = this.scene.getEnemyField()
                  if (eField[0])
                    targIDs[3] = eField[0].name
                  if (eField[1])
                    targIDs[4] = eField[1].name
                  //LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
                }
                console.log(mv.getName(), targets)
              }
            }
            this.scene.pushPhase(playerPhase);
          }
        } else {
          this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move!.targets, move, false, queuedMove.ignorePP));//TODO: is the bang correct here?
          var targets = turnCommand.targets || turnCommand.move!.targets
          var mv = new PokemonMove(queuedMove.move)
        }
        break;
      case Command.BALL:
        this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets![0] % 2, turnCommand.cursor!));//TODO: is the bang correct here?
        break;
      case Command.POKEMON:
        if (pokemon.isPlayer()) {
          //  " " + LoggerTools.playerPokeName(this.scene, pokemon) + 
          LoggerTools.Actions[pokemon.getBattlerIndex()] = ((turnCommand.args![0] as boolean) ? "Baton" : "Switch") + " to " + LoggerTools.playerPokeName(this.scene, turnCommand.cursor!)
        }
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, pokemon.getFieldIndex(), turnCommand.cursor!, true, turnCommand.args![0] as boolean, pokemon.isPlayer()));//TODO: is the bang correct here?
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

    this.scene.arenaFlyout.updateFieldText()
    
    if (LoggerTools.Actions.length > 1 && !this.scene.currentBattle.double) {
      LoggerTools.Actions.pop() // If this is a single battle, but we somehow have two actions, delete the second
    }
    if (LoggerTools.Actions.length > 1 && (LoggerTools.Actions[0] == "" || LoggerTools.Actions[0] == undefined || LoggerTools.Actions[0] == null))
      LoggerTools.Actions.shift() // If the left slot isn't doing anything, delete its entry
    LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, LoggerTools.Actions.join(" & "))

    /**
     * this.end() will call shiftPhase(), which dumps everything from PrependQueue (aka everything that is unshifted()) to the front
     * of the queue and dequeues to start the next phase
     * this is important since stuff like SwitchSummon, AttemptRun, AttemptCapture Phases break the "flow" and should take precedence
     */
    this.end();
  }
}
