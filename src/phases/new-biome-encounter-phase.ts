import { gScene } from "#app/battle-scene";
import { applyAbAttrs, PostBiomeChangeAbAttr } from "#app/data/ability";
import { getRandomWeatherType } from "#app/data/weather";
import { NextEncounterPhase } from "./next-encounter-phase";

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  constructor() {
    super();
  }

  doEncounter(): void {
    gScene.playBgm(undefined, true);

    for (const pokemon of gScene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    for (const pokemon of gScene.getParty().filter(p => p.isOnField())) {
      applyAbAttrs(PostBiomeChangeAbAttr, pokemon, null);
    }

    const enemyField = gScene.getEnemyField();
    const moveTargets: any[]  = [ gScene.arenaEnemy, enemyField ];
    const mysteryEncounter = gScene.currentBattle?.mysteryEncounter?.introVisuals;
    if (mysteryEncounter) {
      moveTargets.push(mysteryEncounter);
    }

    gScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }

  /**
   * Set biome weather.
   */
  trySetWeatherIfNewBiome(): void {
    gScene.arena.trySetWeather(getRandomWeatherType(gScene.arena), false);
  }
}
