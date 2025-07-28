import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { toDmgValue } from "#utils/common";
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
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  apply({ pokemon }: HitHealParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (pokemon.turnData.totalDamageDealt > 0 && !pokemon.isFullHp()) {
      // TODO: this shouldn't be undefined AFAIK
      globalScene.phaseManager.unshiftPhase(
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
