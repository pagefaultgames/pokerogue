import type Pokemon from "#app/field/pokemon";
import { BattlePhase } from "#app/phases/battle-phase";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";

export class ResetStatusPhase extends BattlePhase {
  private pokemon: Pokemon;
  private affectConfusion: boolean;
  private reloadAssets: boolean;

  constructor(pokemon: Pokemon, affectConfusion: boolean, reloadAssets: boolean) {
    super();

    this.pokemon = pokemon;
    this.affectConfusion = affectConfusion;
    this.reloadAssets = reloadAssets;
  }

  public override start() {
    const lastStatus = this.pokemon.status?.effect;
    this.pokemon.status = null;
    if (lastStatus === StatusEffect.SLEEP) {
      this.pokemon.setFrameRate(10);
      if (this.pokemon.getTag(BattlerTagType.NIGHTMARE)) {
        this.pokemon.lapseTag(BattlerTagType.NIGHTMARE);
      }
    }
    if (this.affectConfusion) {
      if (this.pokemon.getTag(BattlerTagType.CONFUSED)) {
        this.pokemon.lapseTag(BattlerTagType.CONFUSED);
      }
    }
    if (this.reloadAssets) {
      this.pokemon.loadAssets(false).then(() => this.pokemon.playAnim());
    }
    this.pokemon.updateInfo(true);
    this.end();
  }
}
