import { globalScene } from "#app/global-scene";
import { applyAbAttrs, PostBiomeChangeAbAttr } from "#app/data/abilities/ability";
import { getRandomWeatherType } from "#app/data/weather";
import { NextEncounterPhase } from "./next-encounter-phase";

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  doEncounter(): void {
    globalScene.playBgm(undefined, true);

    for (const pokemon of globalScene.getPlayerParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
        pokemon.customPokemonData.resetHitReceivedCount();
      }
    }

    for (const pokemon of globalScene.getPlayerParty().filter(p => p.isOnField())) {
      applyAbAttrs(PostBiomeChangeAbAttr, pokemon, null);
    }

    const enemyField = globalScene.getEnemyField();
    const moveTargets: any[] = [globalScene.arenaEnemy, enemyField];
    const mysteryEncounter = globalScene.currentBattle?.mysteryEncounter?.introVisuals;
    if (mysteryEncounter) {
      moveTargets.push(mysteryEncounter);
    }

    globalScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      },
    });
  }

  /**
   * Set biome weather.
   */
  trySetWeatherIfNewBiome(): void {
    globalScene.arena.trySetWeather(getRandomWeatherType(globalScene.arena));
  }
}
