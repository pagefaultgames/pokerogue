import { ModifierTier } from "#app/modifier/modifier-tier";
import { regenerateModifierPoolThresholds, ModifierPoolType, getEnemyBuffModifierForWave } from "#app/modifier/modifier-type";
import { EnemyPersistentModifier } from "#app/modifier/modifier";
import { Phase } from "#app/phase";
import { gScene } from "#app/battle-scene";

export class AddEnemyBuffModifierPhase extends Phase {
  constructor() {
    super();
  }

  start() {
    super.start();

    const waveIndex = gScene.currentBattle.waveIndex;
    const tier = !(waveIndex % 1000) ? ModifierTier.ULTRA : !(waveIndex % 250) ? ModifierTier.GREAT : ModifierTier.COMMON;

    regenerateModifierPoolThresholds(gScene.getEnemyParty(), ModifierPoolType.ENEMY_BUFF);

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      gScene.addEnemyModifier(getEnemyBuffModifierForWave(tier, gScene.findModifiers(m => m instanceof EnemyPersistentModifier, false)), true, true);
    }
    gScene.updateModifiers(false, true).then(() => this.end());
  }
}
