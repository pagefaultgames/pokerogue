import BattleScene from "#app/battle-scene";
import { applyAbAttrs, RunSuccessAbAttr } from "#app/data/ability";
import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import Pokemon, { PlayerPokemon, EnemyPokemon } from "#app/field/pokemon";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattleEndPhase } from "./battle-end-phase";
import { NewBattlePhase } from "./new-battle-phase";
import { PokemonPhase } from "./pokemon-phase";

export class AttemptRunPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: number) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const playerField = this.scene.getPlayerField();
    const enemyField = this.scene.getEnemyField();

    const playerPokemon = this.getPokemon();

    const escapeChance = new Utils.NumberHolder(0);

    this.attemptRunAway(playerField, enemyField, escapeChance);

    applyAbAttrs(RunSuccessAbAttr, playerPokemon, null, false, escapeChance);

    if (playerPokemon.randSeedInt(100) < escapeChance.value) {
      this.scene.playSound("se/flee");
      this.scene.queueMessage(i18next.t("battle:runAwaySuccess"), null, true, 500);

      this.scene.tweens.add({
        targets: [this.scene.arenaEnemy, enemyField].flat(),
        alpha: 0,
        duration: 250,
        ease: "Sine.easeIn",
        onComplete: () => enemyField.forEach(enemyPokemon => enemyPokemon.destroy())
      });

      this.scene.clearEnemyHeldItemModifiers();

      enemyField.forEach(enemyPokemon => {
        enemyPokemon.hideInfo().then(() => enemyPokemon.destroy());
        enemyPokemon.hp = 0;
        enemyPokemon.trySetStatus(StatusEffect.FAINT);
      });

      this.scene.pushPhase(new BattleEndPhase(this.scene));
      this.scene.pushPhase(new NewBattlePhase(this.scene));
    } else {
      this.scene.queueMessage(i18next.t("battle:runAwayCannotEscape"), null, true, 500);
    }

    this.end();
  }

  attemptRunAway(playerField: PlayerPokemon[], enemyField: EnemyPokemon[], escapeChance: Utils.NumberHolder) {
    /** Sum of the speed of all enemy pokemon on the field */
    const enemySpeed = enemyField.reduce((total: number, enemyPokemon: Pokemon) => total + enemyPokemon.getStat(Stat.SPD), 0);
    /** Sum of the speed of all player pokemon on the field */
    const playerSpeed = playerField.reduce((total: number, playerPokemon: Pokemon) => total + playerPokemon.getStat(Stat.SPD), 0);

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
    escapeChance.value = Phaser.Math.Clamp(Math.round((escapeSlope * speedRatio) + minChance + (escapeBonus * this.scene.currentBattle.escapeAttempts++)), minChance, maxChance);
  }
}
