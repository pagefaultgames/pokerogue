import BattleScene from "#app/battle-scene";
import { EncounterPhase } from "./encounter-phase";

export class NextEncounterPhase extends EncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    this.scene.arenaNextEnemy.setBiome(this.scene.arena.biomeType);
    this.scene.arenaNextEnemy.setVisible(true);

    const enemyField = this.scene.getEnemyField();
    const moveTargets: any[] = [this.scene.arenaEnemy, this.scene.arenaNextEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.lastEnemyTrainer];
    const lastEncounterVisuals = this.scene.lastMysteryEncounter?.introVisuals;
    if (lastEncounterVisuals) {
      moveTargets.push(lastEncounterVisuals);
    }
    const nextEncounterVisuals = this.scene.currentBattle.mysteryEncounter?.introVisuals;
    if (nextEncounterVisuals) {
      const enterFromRight = nextEncounterVisuals.enterFromRight;
      if (enterFromRight) {
        nextEncounterVisuals.x += 500;
        this.scene.tweens.add({
          targets: nextEncounterVisuals,
          x: "-=200",
          duration: 2000
        });
      } else {
        moveTargets.push(nextEncounterVisuals);
      }
    }

    this.scene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setBiome(this.scene.arena.biomeType);
        this.scene.arenaEnemy.setX(this.scene.arenaNextEnemy.x);
        this.scene.arenaEnemy.setAlpha(1);
        this.scene.arenaNextEnemy.setX(this.scene.arenaNextEnemy.x - 300);
        this.scene.arenaNextEnemy.setVisible(false);
        if (this.scene.lastEnemyTrainer) {
          this.scene.lastEnemyTrainer.destroy();
        }
        if (lastEncounterVisuals) {
          this.scene.field.remove(lastEncounterVisuals, true);
          this.scene.lastMysteryEncounter!.introVisuals = undefined;
        }

        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }
}
