import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import i18next from "i18next";
import { HeldItem, ITEM_EFFECT } from "#app/items/held-item";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { toDmgValue } from "#app/utils/common";
import { getPokemonNameWithAffix } from "#app/messages";

export interface TURN_END_HEAL_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export class TurnEndHealHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.TURN_END_HEAL];

  get name(): string {
    return i18next.t("modifierType:ModifierType.LEFTOVERS.name") + " (new)";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.LEFTOVERS.description");
  }

  get icon(): string {
    return "leftovers";
  }

  apply(params: TURN_END_HEAL_PARAMS): boolean {
    const pokemon = params.pokemon;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
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
