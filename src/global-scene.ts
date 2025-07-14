import type { BattleScene } from "#app/battle-scene";

export let globalScene: BattleScene;

export function initGlobalScene(scene: BattleScene): void {
  globalScene = scene;
}
