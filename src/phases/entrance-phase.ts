/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { SwitchPhase } from "#phases/switch-phase";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { globalScene } from "#app/global-scene";
import type { FieldBattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { SwitchType } from "#enums/switch-type";
import { PokemonPhase } from "#phases/pokemon-phase";

/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

/**
 * Phase to handle all logical elements of sending a Pokemon into battle.
 * @see {@linkcode SummonPhase} Phase handling the visual aspects of sending in a Pokemon
 * @see {@linkcode SwitchPhase} Phase handling the visual aspects of sending in a Pokemon
 */
export class EntrancePhase extends PokemonPhase {
  public override readonly phaseName = "SwitchPhase";

  private switchType: SwitchType;
  private switchInIndex: number;
  /**
   * Whether to schedule a {@linkcode SummonPhase} immediately after this phase ends
   * to render animations for the new Pokemon switching in.
   * @defaultValue `true`
   */
  private readonly withSummon: boolean;

  /**
   * @param battlerIndex - The {@linkcode FieldBattlerIndex} of the Pokemon switching **out**
   * @param withSummon - Whether to queue a {@linkcode SummonPhase} upon this phase's completion to render
   * animations for the new Pokemon switching in; default `true`
   */
  constructor(battlerIndex: FieldBattlerIndex, withSummon = true) {
    super(battlerIndex);

    this.withSummon = withSummon;
  }

  public override start(): void {
    this.updatePokemonData();
    this.end();
  }

  public override end(): void {
    if (this.withSummon) {
      // TODO: Do we need to add an `overrideMessage` parameter?
      globalScene.phaseManager.unshiftNew("SummonPhase", this.battlerIndex);
    }
    super.end();
  }

  /**
   * Updates *all* data that needs to be changed as a direct result of this
   * phase's switch action.
   *
   * Note that the affected Pokemon are visually off the field when this is
   * called. Any pre-switch effects that require the Pokemon to be visible
   * should be applied when or before the Pokemon is {@linkcode RecallPhase | recalled}.
   */
  private updatePokemonData(): void {
    const activePokemon = this.getPokemon();

    // If a Substitute was transferred, update the switched in Pokemon's sprite
    // to a "behind Substitute" state
    const transferredSubTag = activePokemon.getTag(BattlerTagType.SUBSTITUTE);
    if (transferredSubTag) {
      activePokemon.x += activePokemon.getSubstituteOffset()[0];
      activePokemon.y += activePokemon.getSubstituteOffset()[1];
      activePokemon.setAlpha(0.5);
    }
  }
}
