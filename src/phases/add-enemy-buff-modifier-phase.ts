import { ModifierTier } from "#app/modifier/modifier-tier";
import {
  regenerateModifierPoolThresholds,
  ModifierPoolType,
  getEnemyBuffModifierForWave,
} from "#app/modifier/modifier-type";
import { EnemyPersistentModifier } from "#app/modifier/modifier";
import { Phase } from "#app/phase";
import { globalScene } from "#app/global-scene";

export class AddEnemyBuffModifierPhase extends Phase {
  start() {
    super.start();

    const waveIndex = globalScene.currentBattle.waveIndex;
    const tier = !(waveIndex % 1000)
      ? ModifierTier.ULTRA
      : !(waveIndex % 250)
        ? ModifierTier.GREAT
        : ModifierTier.COMMON;

    regenerateModifierPoolThresholds(globalScene.getEnemyParty(), ModifierPoolType.ENEMY_BUFF);

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      globalScene.addEnemyModifier(
        getEnemyBuffModifierForWave(
          tier,
          globalScene.findModifiers(m => m instanceof EnemyPersistentModifier, false),
        ),
        true,
        true,
      );
    }
    globalScene.updateModifiers(false, true);
    this.end();
  }
}
