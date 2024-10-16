import BattleScene from "#app/battle-scene";

export type ConditionFn = (scene: BattleScene, args?: any[]) => boolean;
