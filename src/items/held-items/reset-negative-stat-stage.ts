import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { ConsumableHeldItem } from "#items/held-item";
import type { ResetNegativeStatStageParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Class used for held items that restore adverse stat stages in battle.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/White_Herb}
 * @sealed
 */
export class ResetNegativeStatStageHeldItem extends ConsumableHeldItem<
  [typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE]
> {
  public readonly effects = [HeldItemEffect.RESET_NEGATIVE_STAT_STAGE] as const;

  public override shouldApply(
    _effect: typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE,
    params: ResetNegativeStatStageParams,
  ): boolean {
    const { pokemon } = params;
    return pokemon.getStatStages().some(stage => stage < 0);
  }

  public override apply(
    _effect: typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE,
    { pokemon }: ResetNegativeStatStageParams,
  ): void {
    pokemon.summonData.statStages = pokemon.summonData.statStages.map(stage => Math.max(stage, 0));

    globalScene.phaseManager.queueMessage(
      i18next.t("modifier:resetNegativeStatStageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.name,
      }),
    );

    this.consume(pokemon, true, false);
  }
}
