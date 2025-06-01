import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { BATTLE_STATS } from "#enums/stat";
import i18next from "i18next";
import { ConsumableHeldItem } from "../held-item";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "../all-held-items";

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class ResetNegativeStatStageHeldItem extends ConsumableHeldItem {
  get name(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.WHITE_HERB.description");
  }

  get icon(): string {
    return "shell_bell";
  }
  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @returns `true` if any stat stages were reset, false otherwise
   */
  applyConsumable(pokemon: Pokemon): boolean {
    let statRestored = false;

    for (const s of BATTLE_STATS) {
      if (pokemon.getStatStage(s) < 0) {
        pokemon.setStatStage(s, 0);
        statRestored = true;
      }
    }

    if (statRestored) {
      globalScene.queueMessage(
        i18next.t("modifier:resetNegativeStatStageApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.name,
        }),
      );
    }
    return statRestored;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 2;
  }
}

// TODO: Do we need this to return true/false?
export function applyResetNegativeStatStageHeldItem(pokemon: Pokemon): boolean {
  let applied = false;
  if (pokemon) {
    for (const item of Object.keys(pokemon.heldItemManager.heldItems)) {
      if (allHeldItems[item] instanceof ResetNegativeStatStageHeldItem) {
        applied ||= allHeldItems[item].apply(pokemon);
      }
    }
  }
  return applied;
}
