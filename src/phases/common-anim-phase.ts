import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { CommonAnim, CommonBattleAnim } from "#app/data/battle-anims.js";
import { PokemonPhase } from "./pokemon-phase";

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim | null;
  private targetIndex: integer | undefined;

  constructor(scene: BattleScene, battlerIndex?: BattlerIndex, targetIndex?: BattlerIndex | undefined, anim?: CommonAnim) {
    super(scene, battlerIndex);

    this.anim = anim!; // TODO: is this bang correct?
    this.targetIndex = targetIndex;
  }

  setAnimation(anim: CommonAnim) {
    this.anim = anim;
  }

  start() {
    new CommonBattleAnim(this.anim, this.getPokemon(), this.targetIndex !== undefined ? (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField())[this.targetIndex] : this.getPokemon()).play(this.scene, () => {
      this.end();
    });
  }
}
