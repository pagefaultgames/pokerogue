import { gScene } from "#app/battle-scene";
import { Biome } from "#app/enums/biome";
import { getBiomeKey } from "#app/field/arena";
import { BattlePhase } from "./battle-phase";

export class SwitchBiomePhase extends BattlePhase {
  private nextBiome: Biome;

  constructor(nextBiome: Biome) {
    super();

    this.nextBiome = nextBiome;
  }

  start() {
    super.start();

    if (this.nextBiome === undefined) {
      return this.end();
    }

    gScene.tweens.add({
      targets: [ gScene.arenaEnemy, gScene.lastEnemyTrainer ],
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        gScene.arenaEnemy.setX(gScene.arenaEnemy.x - 600);

        gScene.newArena(this.nextBiome);

        const biomeKey = getBiomeKey(this.nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        gScene.arenaBgTransition.setTexture(bgTexture);
        gScene.arenaBgTransition.setAlpha(0);
        gScene.arenaBgTransition.setVisible(true);
        gScene.arenaPlayerTransition.setBiome(this.nextBiome);
        gScene.arenaPlayerTransition.setAlpha(0);
        gScene.arenaPlayerTransition.setVisible(true);

        gScene.tweens.add({
          targets: [ gScene.arenaPlayer, gScene.arenaBgTransition, gScene.arenaPlayerTransition ],
          duration: 1000,
          delay: 1000,
          ease: "Sine.easeInOut",
          alpha: (target: any) => target === gScene.arenaPlayer ? 0 : 1,
          onComplete: () => {
            gScene.arenaBg.setTexture(bgTexture);
            gScene.arenaPlayer.setBiome(this.nextBiome);
            gScene.arenaPlayer.setAlpha(1);
            gScene.arenaEnemy.setBiome(this.nextBiome);
            gScene.arenaEnemy.setAlpha(1);
            gScene.arenaNextEnemy.setBiome(this.nextBiome);
            gScene.arenaBgTransition.setVisible(false);
            gScene.arenaPlayerTransition.setVisible(false);
            if (gScene.lastEnemyTrainer) {
              gScene.lastEnemyTrainer.destroy();
            }

            this.end();
          }
        });
      }
    });
  }
}
