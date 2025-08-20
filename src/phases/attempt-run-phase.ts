import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { FieldPhase } from "#phases/field-phase";
import { NumberHolder } from "#utils/common";
import i18next from "i18next";

export class AttemptRunPhase extends FieldPhase {
  public readonly phaseName = "AttemptRunPhase";

  public start() {
    super.start();

    // Increment escape attempts count on entry
    const currentAttempts = globalScene.currentBattle.escapeAttempts++;

    const activePlayerField = globalScene.getPlayerField(true);
    const enemyField = globalScene.getEnemyField();

    const escapeRoll = globalScene.randBattleSeedInt(100);
    const escapeChance = new NumberHolder(this.calculateEscapeChance(currentAttempts));

    activePlayerField.forEach(pokemon => {
      applyAbAttrs("RunSuccessAbAttr", { pokemon, chance: escapeChance });
    });

    if (escapeRoll < escapeChance.value) {
      enemyField.forEach(pokemon => applyAbAttrs("PreLeaveFieldAbAttr", { pokemon }));

      globalScene.playSound("se/flee");
      globalScene.phaseManager.queueMessage(i18next.t("battle:runAwaySuccess"), null, true, 500);

      globalScene.tweens.add({
        targets: [globalScene.arenaEnemy, enemyField].flat(),
        alpha: 0,
        duration: 250,
        ease: "Sine.easeIn",
        onComplete: () => enemyField.forEach(enemyPokemon => enemyPokemon.destroy()),
      });

      globalScene.clearEnemyHeldItemModifiers();

      enemyField.forEach(enemyPokemon => {
        enemyPokemon.hideInfo().then(() => enemyPokemon.destroy());
        enemyPokemon.hp = 0;
        enemyPokemon.doSetStatus(StatusEffect.FAINT);
      });

      globalScene.phaseManager.pushNew("BattleEndPhase", false);

      if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
        globalScene.phaseManager.pushNew("SelectBiomePhase");
      }

      globalScene.phaseManager.pushNew("NewBattlePhase");
    } else {
      activePlayerField.forEach(p => {
        p.turnData.failedRunAway = true;
      });

      globalScene.phaseManager.queueMessage(i18next.t("battle:runAwayCannotEscape"), null, true, 500);
    }

    this.end();
  }

  /**
   * Calculate the chance for the player's team to successfully run away from battle.
   *
   * @param escapeAttempts - The number of prior failed escape attempts in the current battle
   * @returns The final escape chance, as percentage out of 100.
   */
  public calculateEscapeChance(escapeAttempts: number): number {
    //   Check for override, guaranteeing or forbidding random flee attempts as applicable.
    if (Overrides.RUN_SUCCESS_OVERRIDE !== null) {
      return Overrides.RUN_SUCCESS_OVERRIDE ? 100 : 0;
    }

    const enemyField = globalScene.getEnemyField();
    const activePlayerField = globalScene.getPlayerField(true);

    // Cf https://bulbapedia.bulbagarden.net/wiki/Escape#Generation_V_onwards
    // From gen 5 onwards, running takes the _base_ speed totals of both party sides.
    const enemySpeed = enemyField.reduce((total, enemy) => total + enemy.getStat(Stat.SPD), 0);
    const playerSpeed = activePlayerField.reduce((total, player) => total + player.getStat(Stat.SPD), 0);

    /*  The way the escape chance works is by looking at the difference between your speed and the enemy field's average speed as a ratio. The higher this ratio, the higher your chance of success.
     *  However, there is a cap for the ratio of your speed vs enemy speed which beyond that point, you won't gain any advantage. It also looks at how many times you've tried to escape.
     *  Again, the more times you've tried to escape, the higher your odds of escaping. Bosses and non-bosses are calculated differently - bosses are harder to escape from vs non-bosses
     *  Finally, there's a minimum and maximum escape chance as well so that escapes aren't guaranteed, yet they are never 0 either.
     *  The percentage chance to escape from a pokemon for both bosses and non bosses is linear and based on the minimum and maximum chances, and the speed ratio cap.
     *
     *  At the time of writing, these conditions should be met:
     *   - The minimum escape chance should be 5% for bosses and non bosses
     *   - Bosses should have a maximum escape chance of 25%, whereas non-bosses should be 95%
     *   - The bonus per previous escape attempt should be 2% for bosses and 10% for non-bosses
     *   - The speed ratio cap should be 6x for bosses and 4x for non-bosses
     *   - The "default" escape chance when your speed equals the enemy speed should be 8.33% for bosses and 27.5% for non-bosses
     *
     *  From the above, we can calculate the below values
     */

    /** Whether at least 1 pokemon on the enemy field is a boss. */
    const isBoss = enemyField.some(e => e.isBoss());

    /** The ratio between the speed of your active pokemon and the speed of the enemy field */
    const speedRatio = playerSpeed / enemySpeed;
    /** The max ratio before escape chance stops increasing. Increased if there is a boss on the field */
    const speedCap = isBoss ? 6 : 4;
    /** Minimum percent chance to escape */
    const minChance = 5;
    /** Maximum percent chance to escape. Decreased if a boss is on the field */
    const maxChance = isBoss ? 25 : 95;
    /** How much each escape attempt increases the chance of the next attempt. Decreased if a boss is on the field */
    const escapeBonus = isBoss ? 2 : 10;
    /** Slope of the escape chance curve */
    const escapeSlope = (maxChance - minChance) / speedCap;

    // This will calculate the escape chance given all of the above and clamp it to the range of [`minChance`, `maxChance`]
    return Phaser.Math.Clamp(
      Math.round(escapeSlope * speedRatio + minChance + escapeBonus * escapeAttempts),
      minChance,
      maxChance,
    );
  }
}
