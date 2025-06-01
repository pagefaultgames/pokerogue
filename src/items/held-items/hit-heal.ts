import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import i18next from "i18next";
import { HeldItem } from "#app/items/held-item";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { toDmgValue } from "#app/utils/common";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "../all-held-items";

export class HitHealHeldItem extends HeldItem {
  get name(): string {
    return i18next.t("modifierType:ModifierType.SHELL_BELL.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.SHELL_BELL.description");
  }

  get icon(): string {
    return "shell_bell";
  }

  /**
   * Applies {@linkcode HitHealModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  apply(stackCount: number, pokemon: Pokemon): boolean {
    if (pokemon.turnData.totalDamageDealt && !pokemon.isFullHp()) {
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

export function applyHitHealHeldItem(pokemon: Pokemon) {
  if (pokemon) {
    for (const [item, props] of Object.entries(pokemon.heldItemManager.getHeldItems())) {
      if (allHeldItems[item] instanceof HitHealHeldItem) {
        allHeldItems[item].apply(props.stack, pokemon);
      }
    }
  }
}
