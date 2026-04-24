import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { ConsumableHeldItemAttr } from "#items/held-item-attr";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import type { InstantReviveParams } from "#types/held-item-parameter";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Attributes used for items that revive a Pokemon when it faints to direct damage.
 * Used for Reviver Seed.
 * @sealed
 */
export class InstantReviveHeldItemAttr extends ConsumableHeldItemAttr<typeof HeldItemEffect.INSTANT_REVIVE> {
  public override readonly effect = HeldItemEffect.INSTANT_REVIVE;

  // TODO: Move to builder
  get name(): string {
    return i18next.t("modifierType:ModifierType.REVIVER_SEED.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.REVIVER_SEED.description");
  }

  get iconName(): string {
    return "reviver_seed";
  }

  public override apply({ pokemon }: InstantReviveParams): void {
    // TODO: Since this should be the only place `revive=true` is passed to `PokemonHealPhase`, we can remove it
    // later on
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

    this.consume(pokemon);
  }
}
