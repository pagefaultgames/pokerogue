import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { HeldItem, HeldItemEffect } from "#app/items/held-item";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { toDmgValue } from "#app/utils/common";
import i18next from "i18next";

export interface HitHealParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export class HitHealHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.TURN_END_HEAL];

  get name(): string {
    return i18next.t("modifierType:ModifierType.SHELL_BELL.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.SHELL_BELL.description");
  }

  get iconName(): string {
    return "shell_bell";
  }

  /**
   * Applies {@linkcode HitHealModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  apply(params: HitHealParams): boolean {
    const pokemon = params.pokemon;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (pokemon.turnData.totalDamageDealt > 0 && !pokemon.isFullHp()) {
      // TODO: this shouldn't be undefined AFAIK
      globalScene.unshiftPhase(
        new PokemonHealPhase(
          pokemon.getBattlerIndex(),
          toDmgValue(pokemon.turnData.totalDamageDealt / 8) * stackCount,
          i18next.t("modifier:hitHealApply", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            typeName: this.name,
          }),
          true,
        ),
      );
    }
    return true;
  }
}
