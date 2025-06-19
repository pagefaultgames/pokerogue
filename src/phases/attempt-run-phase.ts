import { applyAbAttrs, applyPreLeaveFieldAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { PlayerPokemon, EnemyPokemon } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import i18next from "i18next";
import { NumberHolder, randSeedInt } from "#app/utils/common";
import { PokemonPhase } from "./pokemon-phase";
import { globalScene } from "#app/global-scene";

export class AttemptRunPhase extends PokemonPhase {
  public readonly phaseName = "AttemptRunPhase";
  /** For testing purposes: this is to force the pokemon to fail and escape */
  public forceFailEscape = false;

  private getTeamRNG(range: number, min = 0) {
    return globalScene.currentBattle ? globalScene.randBattleSeedInt(range, min) : randSeedInt(range, min);
  }

  start() {
    super.start();

    const activePlayerField = globalScene.getActivePlayerField();
    const enemyField = globalScene.getEnemyField();
    //Attempting to run is a TEAM not PLAYER based action, we should not be referercing individual pokemon,
    //we should instead be referring to the team as a whole and

    const escapeChance = new NumberHolder(0);
    const escapeRoll = this.getTeamRNG(100);

    this.attemptRunAway(activePlayerField, enemyField, escapeChance);

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
      //there should be a general failed run away bool for the active team
      activePlayerField.forEach(p => {
        p.turnData.failedRunAway = true;
      });

      globalScene.phaseManager.queueMessage(i18next.t("battle:runAwayCannotEscape"), null, true, 500);
    }

    this.end();
  }

  attemptRunAway(playerField: PlayerPokemon[], enemyField: EnemyPokemon[], escapeChance: NumberHolder) {
    /** Sum of the speed of all enemy pokemon on the field */
    const enemySpeed = enemyField.reduce(
      (total: number, enemyPokemon: Pokemon) => total + enemyPokemon.getStat(Stat.SPD),
      0,
    );
    /** Sum of the speed of all player pokemon on the field */
    const playerSpeed = playerField.reduce(
      (total: number, playerPokemon: Pokemon) => total + playerPokemon.getStat(Stat.SPD),
      0,
    );

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

    let isBoss = false;
    for (let e = 0; e < enemyField.length; e++) {
      isBoss = isBoss || enemyField[e].isBoss(); // this line checks if any of the enemy pokemon on the field are bosses; if so, the calculation for escaping is different
    }

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
    escapeChance.value = Phaser.Math.Clamp(
      Math.round(escapeSlope * speedRatio + minChance + escapeBonus * globalScene.currentBattle.escapeAttempts++),
      minChance,
      maxChance,
    );
  }
}
