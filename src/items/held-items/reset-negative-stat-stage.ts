import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BATTLE_STATS } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { ConsumableHeldItem, HeldItemEffect } from "#items/held-item";
import i18next from "i18next";

export interface ResetNegativeStatStageParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Whether the move was used by a player pokemon */
  isPlayer: boolean;
}

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class ResetNegativeStatStageHeldItem extends ConsumableHeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.RESET_NEGATIVE_STAT_STAGE];

  get name(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.description");
  }

  get iconName(): string {
    return "white_herb";
  }
  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   * @returns `true` if any stat stages were reset, false otherwise
   */
  apply({ pokemon, isPlayer }: ResetNegativeStatStageParams): boolean {
    let statRestored = false;

    for (const s of BATTLE_STATS) {
      if (pokemon.getStatStage(s) < 0) {
        pokemon.setStatStage(s, 0);
        statRestored = true;
      }
    }

    if (statRestored) {
      globalScene.phaseManager.queueMessage(
        i18next.t("modifier:resetNegativeStatStageApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.name,
        }),
      );

      this.consume(pokemon, isPlayer, true, false);
    }

    return statRestored;
  }
}
