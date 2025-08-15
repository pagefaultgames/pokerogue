import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { ModifierTier } from "#enums/modifier-tier";
import { EnemyPersistentModifier } from "#modifiers/modifier";
import { getEnemyBuffModifierForWave, regenerateModifierPoolThresholds } from "#modifiers/modifier-type";

export class AddEnemyBuffModifierPhase extends Phase {
  public readonly phaseName = "AddEnemyBuffModifierPhase";
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
