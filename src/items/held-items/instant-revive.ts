import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { Pokemon } from "#field/pokemon";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";
import { ConsumableHeldItem, HeldItemEffect } from "../held-item";

export interface InstantReviveParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class InstantReviveHeldItem extends ConsumableHeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.INSTANT_REVIVE];

  get name(): string {
    return i18next.t("modifierType:ModifierType.REVIVER_SEED.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.REVIVER_SEED.description");
  }

  get iconName(): string {
    return "reviver_seed";
  }
  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @returns `true` if any stat stages were reset, false otherwise
   */
  apply(params: InstantReviveParams): boolean {
    const pokemon = params.pokemon;
    // Restore the Pokemon to half HP
    globalScene.phaseManager.unshiftPhase(
      new PokemonHealPhase(
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 2),
        i18next.t("modifier:pokemonInstantReviveApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.name,
        }),
        false,
        false,
        true,
      ),
    );

    // Remove the Pokemon's FAINT status
    pokemon.resetStatus(true, false, true, false);

    // Reapply Commander on the Pokemon's side of the field, if applicable
    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      applyAbAttrs("CommanderAbAttr", p, null, false);
    }
    return true;
  }
}
