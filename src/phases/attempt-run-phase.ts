import BattleScene from "#app/battle-scene.js";
import { applyAbAttrs, RunSuccessAbAttr } from "#app/data/ability.js";
import { Stat } from "#app/enums/stat.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import Pokemon from "#app/field/pokemon.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { BattleEndPhase } from "./battle-end-phase";
import { NewBattlePhase } from "./new-battle-phase";
import { PokemonPhase } from "./pokemon-phase";

export class AttemptRunPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const playerPokemon = this.getPokemon();
    const enemyField = this.scene.getEnemyField();

    const enemySpeed = enemyField.reduce((total: integer, enemyPokemon: Pokemon) => total + enemyPokemon.getStat(Stat.SPD), 0) / enemyField.length;

    const escapeChance = new Utils.IntegerHolder((((playerPokemon.getStat(Stat.SPD) * 128) / enemySpeed) + (30 * this.scene.currentBattle.escapeAttempts++)) % 256);
    applyAbAttrs(RunSuccessAbAttr, playerPokemon, null, false, escapeChance);

    if (playerPokemon.randSeedInt(256) < escapeChance.value) {
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
}
