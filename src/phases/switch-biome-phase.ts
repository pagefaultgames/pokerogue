import { globalScene } from "#app/global-scene";
import type { BiomeId } from "#enums/biome-id";
import { getBiomeKey } from "#field/arena";
import { BattlePhase } from "#phases/battle-phase";

export class SwitchBiomePhase extends BattlePhase {
  public readonly phaseName = "SwitchBiomePhase";
  private nextBiome: BiomeId;

  constructor(nextBiome: BiomeId) {
    super();

    this.nextBiome = nextBiome;
  }

  async start() {
    super.start();

    if (this.nextBiome === undefined) {
      return this.end();
    }

    // Kick off biome asset loading in parallel with the 2000ms slide-out
    // tween. By the time onComplete fires, assets will be ready.
    const biomeLoadPromise = globalScene.loadBiomeAssets(this.nextBiome);

    // Before switching biomes, make sure to set the last encounter for other phases that need it too.
    globalScene.lastEnemyTrainer = globalScene.currentBattle?.trainer ?? null;
    globalScene.lastMysteryEncounter = globalScene.currentBattle?.mysteryEncounter;

    globalScene.tweens.add({
      targets: [globalScene.arenaEnemy, globalScene.lastEnemyTrainer],
      x: "+=300",
      duration: 2000,
      onComplete: async () => {
        // Wait for biome assets before proceeding — will usually
        // already be resolved since the tween took 2000ms
        await biomeLoadPromise;

        globalScene.arenaEnemy.setX(globalScene.arenaEnemy.x - 600);
        // Capture BEFORE newArena overwrites globalScene.arena
        const previousBiome = globalScene.arena.biomeId;
        globalScene.newArena(this.nextBiome);

        const biomeKey = getBiomeKey(this.nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        globalScene.arenaBgTransition.setTexture(bgTexture);
        globalScene.arenaBgTransition.setAlpha(0);
        globalScene.arenaBgTransition.setVisible(true);
        globalScene.arenaPlayerTransition.setBiome(this.nextBiome);
        globalScene.arenaPlayerTransition.setAlpha(0);
        globalScene.arenaPlayerTransition.setVisible(true);

        globalScene.tweens.add({
          targets: [globalScene.arenaPlayer, globalScene.arenaBgTransition, globalScene.arenaPlayerTransition],
          duration: 1000,
          delay: 1000,
          ease: "Sine.easeInOut",
          alpha: (target: any) => (target === globalScene.arenaPlayer ? 0 : 1),
          onComplete: () => {
            globalScene.arenaBg.setTexture(bgTexture);
            globalScene.arenaPlayer.setBiome(this.nextBiome);
            globalScene.arenaPlayer.setAlpha(1);
            globalScene.arenaEnemy.setBiome(this.nextBiome);
            globalScene.arenaEnemy.setAlpha(1);
            globalScene.arenaNextEnemy.setBiome(this.nextBiome);
            globalScene.arenaBgTransition.setVisible(false);
            globalScene.arenaPlayerTransition.setVisible(false);
            if (globalScene.lastEnemyTrainer) {
              globalScene.lastEnemyTrainer.destroy();
            }
            // Clear previous biome textures now that the transition is complete
            globalScene.clearBiomeAssets(previousBiome);
            this.end();
          },
        });
      },
    });
  }
}
