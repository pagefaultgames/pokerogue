import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import type { HitHealParams } from "#types/held-item-parameter";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Attribute used for items that heal the holder by a fraction of the damage dealt in battle.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Shell_Bell}
 * @sealed
 */
export class HitHealHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.HIT_HEAL> {
  public override readonly effect = HeldItemEffect.HIT_HEAL;

  public override shouldApply({ pokemon }: HitHealParams): boolean {
    return pokemon.turnData.totalDamageDealt > 0 && !pokemon.isFullHp();
  }

  public override apply({ pokemon }: HitHealParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);

    // TODO: This will need to be adjusted after the pokemon heal phase refactor
    globalScene.phaseManager.unshiftPhase(
      new PokemonHealPhase(
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.turnData.totalDamageDealt / 8) * stackCount,
        i18next.t("modifier:hitHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.item.name,
        }),
        true,
      ),
    );
  }
}
