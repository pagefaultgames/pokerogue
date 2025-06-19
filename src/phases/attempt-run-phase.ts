import { applyAbAttrs, applyPreLeaveFieldAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { StatusEffect } from "#enums/status-effect";
import i18next from "i18next";
import { NumberHolder, randSeedInt } from "#app/utils/common";
import { globalScene } from "#app/global-scene";
import { calculateEscapeChance } from "#app/utils/run-utils";
import { FieldPhase } from "./field-phase";
export class AttemptRunPhase extends FieldPhase {
  public readonly phaseName = "AttemptRunPhase";
  /** For testing purposes: this is to force the pokemon to fail and escape */
  public forceFailEscape = false;

  private getTeamRNG(range: number, min = 0) {
    return globalScene.currentBattle ? globalScene.randBattleSeedInt(range, min) : randSeedInt(range, min);
  }

  start() {
    super.start();

    //Increment escape attempts count on entry
    const currentAttempts = globalScene.currentBattle.escapeAttempts++;

    const activePlayerField = globalScene.getPlayerField(true);
    const enemyField = globalScene.getEnemyField();

    const escapeRoll = this.getTeamRNG(100);
    const escapeChance = new NumberHolder(0);

    calculateEscapeChance(activePlayerField, enemyField, escapeChance, currentAttempts);

    activePlayerField.forEach(p => {
      applyAbAttrs("RunSuccessAbAttr", p, null, false, escapeChance);
    });

    if (escapeRoll < escapeChance.value && !this.forceFailEscape) {
      enemyField.forEach(enemyPokemon => applyPreLeaveFieldAbAttrs("PreLeaveFieldAbAttr", enemyPokemon));

      globalScene.playSound("se/flee");
      globalScene.phaseManager.queueMessage(i18next.t("battle:runAwaySuccess"), null, true, 500);

      globalScene.tweens.add({
        targets: [globalScene.arenaEnemy, enemyField].flat(),
        alpha: 0,
        duration: 250,
        ease: "Sine.easeIn",
        onComplete: () =>
          // biome-ignore lint/complexity/noForEach: TODO
          enemyField.forEach(enemyPokemon => enemyPokemon.destroy()),
      });

      globalScene.clearEnemyHeldItemModifiers();

      // biome-ignore lint/complexity/noForEach: TODO
      enemyField.forEach(enemyPokemon => {
        enemyPokemon.hideInfo().then(() => enemyPokemon.destroy());
        enemyPokemon.hp = 0;
        enemyPokemon.trySetStatus(StatusEffect.FAINT);
      });

      globalScene.phaseManager.pushNew("BattleEndPhase", false);

      if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
        globalScene.phaseManager.pushNew("SelectBiomePhase");
      }

      globalScene.phaseManager.pushNew("NewBattlePhase");
    } else {
      globalScene.currentBattle.failedRunAway = true;
      globalScene.phaseManager.queueMessage(i18next.t("battle:runAwayCannotEscape"), null, true, 500);
    }

    this.end();
  }
}
