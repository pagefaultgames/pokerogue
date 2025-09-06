import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import type { HitHealParams } from "#types/held-item-parameter";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

export class HitHealHeldItem extends HeldItem<[typeof HeldItemEffect.HIT_HEAL]> {
  public readonly effects = [HeldItemEffect.HIT_HEAL] as const;

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
  apply(_effect: typeof HeldItemEffect.HIT_HEAL, { pokemon }: HitHealParams): boolean {
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
