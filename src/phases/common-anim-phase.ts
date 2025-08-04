import { globalScene } from "#app/global-scene";
import { CommonBattleAnim } from "#data/battle-anims";
import type { BattlerIndex } from "#enums/battler-index";
import type { CommonAnim } from "#enums/move-anims-common";
import { PokemonPhase } from "#phases/pokemon-phase";

export class CommonAnimPhase extends PokemonPhase {
  // PokemonHealPhase extends CommonAnimPhase, and to make typescript happy,
  // we need to allow phaseName to be a union of the two
  public readonly phaseName: "CommonAnimPhase" | "PokemonHealPhase" | "WeatherEffectPhase" = "CommonAnimPhase";
  private anim: CommonAnim | null;
  private targetIndex?: BattlerIndex;
  private playOnEmptyField: boolean;

  constructor(
    battlerIndex?: BattlerIndex,
    targetIndex?: BattlerIndex,
    anim: CommonAnim | null = null,
    playOnEmptyField = false,
  ) {
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
