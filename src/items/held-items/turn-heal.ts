import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import i18next from "i18next";
import { HeldItem } from "#app/items/held-item";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { toDmgValue } from "#app/utils/common";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "../all-held-items";

export class TurnHealHeldItem extends HeldItem {
  get name(): string {
    return i18next.t("modifierType:ModifierType.LEFTOVERS.name") + " (new)";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.LEFTOVERS.description");
  }

  get icon(): string {
    return "leftovers";
  }

  apply(stackCount: number, pokemon: Pokemon): boolean {
    if (pokemon.isFullHp()) {
      return false;
    }
    globalScene.unshiftPhase(
      new PokemonHealPhase(
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16) * stackCount,
        i18next.t("modifier:turnHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.name,
        }),
        true,
      ),
    );
    return true;
  }
}

export function applyTurnHealHeldItem(pokemon: Pokemon) {
  if (pokemon) {
    for (const [item, props] of Object.entries(pokemon.heldItemManager.getHeldItems())) {
      if (allHeldItems[item] instanceof TurnHealHeldItem) {
        allHeldItems[item].apply(props.stack, pokemon);
      }
    }
  }
}
