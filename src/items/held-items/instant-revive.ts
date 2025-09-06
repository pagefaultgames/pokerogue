import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { ConsumableHeldItem } from "#items/held-item";
import type { InstantReviveParams } from "#items/held-item-parameter";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class InstantReviveHeldItem extends ConsumableHeldItem<[typeof HeldItemEffect.INSTANT_REVIVE]> {
  public readonly effects = [HeldItemEffect.INSTANT_REVIVE] as const;

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
   * @returns `true` if any stat stages were reset, false otherwise
   */
  apply(_effect: typeof HeldItemEffect.INSTANT_REVIVE, { pokemon }: InstantReviveParams): boolean {
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
      applyAbAttrs("CommanderAbAttr", { pokemon: p });
    }
    return true;
  }

  //TODO: is this missing the consume call?
}
