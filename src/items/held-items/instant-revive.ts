import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { ConsumableHeldItem } from "#items/held-item";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import type { InstantReviveParams } from "#types/held-item-parameter";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Modifier used for held items, namely Reviver Seed, that revive a fainted
 * {@linkcode Pokemon} immediately when it faints to direct damage
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
  apply(_effect: typeof HeldItemEffect.INSTANT_REVIVE, { pokemon }: InstantReviveParams): void {
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
  }

  //TODO: is this missing the consume call?
}
