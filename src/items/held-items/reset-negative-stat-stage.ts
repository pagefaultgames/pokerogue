import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { BATTLE_STATS } from "#enums/stat";
import i18next from "i18next";
import { ConsumableHeldItem, ITEM_EFFECT } from "../held-item";
import { getPokemonNameWithAffix } from "#app/messages";

export interface RESET_NEGATIVE_STAT_STAGE_PARAMS {
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
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.RESET_NEGATIVE_STAT_STAGE];

  get name(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.description");
  }

  get icon(): string {
    return "white_herb";
  }
  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @returns `true` if any stat stages were reset, false otherwise
   */
  apply(params: RESET_NEGATIVE_STAT_STAGE_PARAMS): boolean {
    const pokemon = params.pokemon;
    const isPlayer = params.isPlayer;
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
