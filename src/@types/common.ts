import BattleScene from "#app/battle-scene.js";

export type ConditionFn = (scene: BattleScene, args?: any[]) => boolean;
