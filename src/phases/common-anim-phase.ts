import type { BattlerIndex } from "#app/battle";
import { globalScene } from "#app/global-scene";
import type { CommonAnim } from "#app/data/battle-anims";
import { CommonBattleAnim } from "#app/data/battle-anims";
import { PokemonPhase } from "./pokemon-phase";

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim | null;
  private targetIndex?: BattlerIndex;
  private playOnEmptyField: boolean;

  constructor(battlerIndex?: BattlerIndex, targetIndex?: BattlerIndex, anim: CommonAnim | null = null, playOnEmptyField: boolean = false) {
    super(battlerIndex);

    this.anim = anim;
    this.targetIndex = targetIndex;
    this.playOnEmptyField = playOnEmptyField;
  }

  setAnimation(anim: CommonAnim) {
    this.anim = anim;
  }

  start() {
    const target =
      this.targetIndex !== undefined
        ? (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField())[this.targetIndex]
        : this.getPokemon();
    new CommonBattleAnim(this.anim, this.getPokemon(), target).play(false, () => {
      this.end();
    });
  }
}
