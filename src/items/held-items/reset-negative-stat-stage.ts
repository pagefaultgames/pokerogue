import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { ConsumableHeldItemAttr } from "#items/held-item-attr";
import type { ResetNegativeStatStageParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Attribute used for held items that revert adverse stat stages in battle.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/White_Herb}
 * @sealed
 */
export class ResetNegativeStatStageHeldItemAttr extends ConsumableHeldItemAttr<
  typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE
> {
  public override readonly effect = HeldItemEffect.RESET_NEGATIVE_STAT_STAGE;

  public override shouldApply({ pokemon }: ResetNegativeStatStageParams): boolean {
    return pokemon.getStatStages().some(stage => stage < 0);
  }

  public override apply({ pokemon }: ResetNegativeStatStageParams): void {
    pokemon.summonData.statStages = pokemon.summonData.statStages.map(stage => Math.max(stage, 0));

    globalScene.phaseManager.queueMessage(
      i18next.t("modifier:resetNegativeStatStageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.item.name,
      }),
    );

    this.consume(pokemon, true, false);
  }
}
