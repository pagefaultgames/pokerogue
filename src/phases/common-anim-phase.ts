import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { CommonAnim, CommonBattleAnim } from "#app/data/battle-anims";
import { PokemonPhase } from "./pokemon-phase";

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim | null;
  private targetIndex: integer | undefined;
  private playOnEmptyField: boolean;

  constructor(scene: BattleScene, battlerIndex?: BattlerIndex, targetIndex?: BattlerIndex | undefined, anim?: CommonAnim, playOnEmptyField: boolean = false) {
    super(scene, battlerIndex);

    this.anim = anim!; // TODO: is this bang correct?
    this.targetIndex = targetIndex;
    this.playOnEmptyField = playOnEmptyField;
  }

  setAnimation(anim: CommonAnim) {
    this.anim = anim;
  }

  start() {
    const target = this.targetIndex !== undefined ? (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField())[this.targetIndex] : this.getPokemon();
    new CommonBattleAnim(this.anim, this.getPokemon(), target).play(this.scene, false, () => {
      this.end();
    });
  }
}
