import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { ConsumableHeldItem } from "#items/held-item";
import type { ResetNegativeStatStageParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class ResetNegativeStatStageHeldItem extends ConsumableHeldItem<
  [typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE]
> {
  public readonly effects = [HeldItemEffect.RESET_NEGATIVE_STAT_STAGE] as const;

  get name(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.description");
  }

  get iconName(): string {
    return "white_herb";
  }

  public override shouldApply(
    _effect: typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE,
    { pokemon }: ResetNegativeStatStageParams,
  ): boolean {
    for (const s of pokemon.getStatStages()) {
      if (s < 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   */
  public override apply(
    _effect: typeof HeldItemEffect.RESET_NEGATIVE_STAT_STAGE,
    { pokemon }: ResetNegativeStatStageParams,
  ): void {
    pokemon.summonData.statStages.fill(0);

    globalScene.phaseManager.queueMessage(
      i18next.t("modifier:resetNegativeStatStageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.name,
      }),
    );

    this.consume(pokemon, true, false);
  }
}
