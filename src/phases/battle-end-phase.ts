import { applyPostBattleAbAttrs, PostBattleAbAttr } from "#app/data/ability";
import { LapsingPersistentModifier, LapsingPokemonHeldItemModifier } from "#app/modifier/modifier";
import { BattlePhase } from "./battle-phase";
import { GameOverPhase } from "./game-over-phase";
import * as LoggerTools from "../logger";

export class BattleEndPhase extends BattlePhase {
  start() {
    super.start();

    this.scene.currentBattle.addBattleScore(this.scene);

    this.scene.gameData.gameStats.battles++;
    if (this.scene.currentBattle.trainer) {
      this.scene.gameData.gameStats.trainersDefeated++;
    }
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex + 1 > this.scene.gameData.gameStats.highestEndlessWave) {
      this.scene.gameData.gameStats.highestEndlessWave = this.scene.currentBattle.waveIndex + 1;
    }

    // Endless graceful end
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex >= 5850) {
      this.scene.clearPhaseQueue();
      this.scene.unshiftPhase(new GameOverPhase(this.scene, true));
    }

    for (const pokemon of this.scene.getParty().filter(p => p.isAllowedInBattle())) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon);
    }

    if (this.scene.currentBattle.moneyScattered) {
      this.scene.currentBattle.pickUpScatteredMoney(this.scene);
    }

    this.scene.clearEnemyHeldItemModifiers();

    const lapsingModifiers = this.scene.findModifiers(m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier) as (LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(this.scene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(args)) {
        this.scene.removeModifier(m);
      }
    }

    // Format this wave's logs
    var drpd: LoggerTools.DRPD = LoggerTools.getDRPD(this.scene)
    var wv: LoggerTools.Wave = LoggerTools.getWave(drpd, this.scene.currentBattle.waveIndex, this.scene)
    var lastcount = 0;
    var lastval;
    var tempActions: string[] = wv.actions.slice();
    var prevWaveActions: string[] = []
    wv.actions = []
    // Loop through each action
    for (var i = 0; i < tempActions.length; i++) {
      if (tempActions[i].substring(0, 10) == "[MOVEBACK]") {
        prevWaveActions.push(tempActions[i].substring(10))
      } else if (tempActions[i] != lastval) {
        if (lastcount > 0) {
          wv.actions.push(lastval + (lastcount == 1 ? "" : " x" + lastcount))
        }
        lastval = tempActions[i]
        lastcount = 1
      } else {
        lastcount++
      }
    }
    if (lastcount > 0) {
      wv.actions.push(lastval + (lastcount == 1 ? "" : " x" + lastcount))
    }
    console.log(tempActions, wv.actions)
    var wv2: LoggerTools.Wave = LoggerTools.getWave(drpd, this.scene.currentBattle.waveIndex - 1, this.scene)
    wv2.actions = wv2.actions.concat(prevWaveActions)
    console.log(drpd)
    LoggerTools.save(this.scene, drpd)

    this.scene.updateModifiers().then(() => this.end());
  }
}
