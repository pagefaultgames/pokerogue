import { gScene } from "#app/battle-scene";
import { EncounterPhase } from "./encounter-phase";

export class NextEncounterPhase extends EncounterPhase {
  constructor() {
    super();
  }

  start() {
    super.start();
  }

  doEncounter(): void {
    gScene.playBgm(undefined, true);

    for (const pokemon of gScene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    gScene.arenaNextEnemy.setBiome(gScene.arena.biomeType);
    gScene.arenaNextEnemy.setVisible(true);

    const enemyField = gScene.getEnemyField();
    const moveTargets: any[] = [ gScene.arenaEnemy, gScene.arenaNextEnemy, gScene.currentBattle.trainer, enemyField, gScene.lastEnemyTrainer ];
    const lastEncounterVisuals = gScene.lastMysteryEncounter?.introVisuals;
    if (lastEncounterVisuals) {
      moveTargets.push(lastEncounterVisuals);
    }
    const nextEncounterVisuals = gScene.currentBattle.mysteryEncounter?.introVisuals;
    if (nextEncounterVisuals) {
      const enterFromRight = nextEncounterVisuals.enterFromRight;
      if (enterFromRight) {
        nextEncounterVisuals.x += 500;
        gScene.tweens.add({
          targets: nextEncounterVisuals,
          x: "-=200",
          duration: 2000
        });
      } else {
        moveTargets.push(nextEncounterVisuals);
      }
    }

    gScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        gScene.arenaEnemy.setBiome(gScene.arena.biomeType);
        gScene.arenaEnemy.setX(gScene.arenaNextEnemy.x);
        gScene.arenaEnemy.setAlpha(1);
        gScene.arenaNextEnemy.setX(gScene.arenaNextEnemy.x - 300);
        gScene.arenaNextEnemy.setVisible(false);
        if (gScene.lastEnemyTrainer) {
          gScene.lastEnemyTrainer.destroy();
        }
        if (lastEncounterVisuals) {
          gScene.field.remove(lastEncounterVisuals, true);
          gScene.lastMysteryEncounter!.introVisuals = undefined;
        }

        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }

  /**
   * Do nothing (since this is simply the next wave in the same biome).
   */
  trySetWeatherIfNewBiome(): void {
  }
}
