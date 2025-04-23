import BattleInfo from "./battle-info";

export class EnemyBattleInfo extends BattleInfo {
  constructor() {
    super(140, -141, false);
  }

  setMini(_mini: boolean): void {} // Always mini
}
