import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { TrainerSlot } from "#enums/trainer-slot";
import { playTween } from "#utils/anim-utils";

/**
 * Adds functions to display and hide the enemy trainer
 */
export abstract class BattlePhase extends Phase {
  /** Slides the enemy trainer into view */
  public async showEnemyTrainer(trainerSlot: TrainerSlot = TrainerSlot.NONE): Promise<void> {
    const { trainer } = globalScene.currentBattle;
    if (!trainer) {
      console.warn("Enemy trainer is missing!");
      return;
    }

    trainer.setVisible(true);

    // TODO: Do these sprites still need to be reset/made visible?
    const sprites = trainer.getSprites();
    const tintSprites = trainer.getTintSprites();
    for (let i = 0; i < sprites.length; i++) {
      const visible = !trainerSlot || !i === (trainerSlot === TrainerSlot.TRAINER) || sprites.length < 2;
      [sprites[i], tintSprites[i]].forEach(sprite => {
        if (visible) {
          sprite.x = trainerSlot || sprites.length < 2 ? 0 : i ? 16 : -16;
        }
        sprite.setVisible(visible);
        sprite.clearTint();
      });
    }

    await playTween({
      targets: trainer,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 750,
    });
  }

  /** Slides the enemy trainer out of view */
  public async hideEnemyTrainer(): Promise<void> {
    const { trainer } = globalScene.currentBattle;
    if (!trainer) {
      console.warn("Enemy Trainer is missing!");
      return;
    }

    await playTween({
      targets: trainer,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 750,
    });

    trainer.setVisible(false);
  }
}
