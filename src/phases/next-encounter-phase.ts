import { globalScene } from "#app/global-scene";
import { EncounterPhase } from "./encounter-phase";

export class NextEncounterPhase extends EncounterPhase {
  constructor() {
    super();
  }

  start() {
    super.start();
  }

  doEncounter(): void {
    globalScene.playBgm(undefined, true);

    for (const pokemon of globalScene.getPlayerParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    globalScene.arenaNextEnemy.setBiome(globalScene.arena.biomeType);
    globalScene.arenaNextEnemy.setVisible(true);

    const enemyField = globalScene.getEnemyField();
    const moveTargets: any[] = [
      globalScene.arenaEnemy,
      globalScene.arenaNextEnemy,
      globalScene.currentBattle.trainer,
      enemyField,
      globalScene.lastEnemyTrainer,
    ];
    const lastEncounterVisuals = globalScene.lastMysteryEncounter?.introVisuals;
    if (lastEncounterVisuals) {
      moveTargets.push(lastEncounterVisuals);
    }
    const nextEncounterVisuals = globalScene.currentBattle.mysteryEncounter?.introVisuals;
    if (nextEncounterVisuals) {
      const enterFromRight = nextEncounterVisuals.enterFromRight;
      if (enterFromRight) {
        nextEncounterVisuals.x += 500;
        globalScene.tweens.add({
          targets: nextEncounterVisuals,
          x: "-=200",
          duration: 2000,
        });
      } else {
        moveTargets.push(nextEncounterVisuals);
      }
    }

    globalScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        globalScene.arenaEnemy.setBiome(globalScene.arena.biomeType);
        globalScene.arenaEnemy.setX(globalScene.arenaNextEnemy.x);
        globalScene.arenaEnemy.setAlpha(1);
        globalScene.arenaNextEnemy.setX(globalScene.arenaNextEnemy.x - 300);
        globalScene.arenaNextEnemy.setVisible(false);
        if (globalScene.lastEnemyTrainer) {
          globalScene.lastEnemyTrainer.destroy();
        }
        if (lastEncounterVisuals) {
          globalScene.field.remove(lastEncounterVisuals, true);
          globalScene.lastMysteryEncounter!.introVisuals = undefined;
        }

        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      },
    });
  }

  /**
   * Do nothing (since this is simply the next wave in the same biome).
   */
  trySetWeatherIfNewBiome(): void {}
}
