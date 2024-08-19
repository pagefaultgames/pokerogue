import BattleScene from "#app/battle-scene.js";
import { applyAbAttrs, PostBiomeChangeAbAttr } from "#app/data/ability.js";
import { getRandomWeatherType } from "#app/data/weather.js";
import { NextEncounterPhase } from "./next-encounter-phase";

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena), false);

    for (const pokemon of this.scene.getParty().filter(p => p.isOnField())) {
      applyAbAttrs(PostBiomeChangeAbAttr, pokemon, null);
    }

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [this.scene.arenaEnemy, enemyField].flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }
}
