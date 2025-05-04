import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { CommonAnim } from "#app/data/battle-anims";
import { getStatusEffectHealText } from "#app/data/status-effect";
import { StatusEffect } from "#app/enums/status-effect";
import { HitResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { HealingBoosterModifier } from "#app/modifier/modifier";
import { HealAchv } from "#app/system/achv";
import i18next from "i18next";
import { NumberHolder } from "#app/utils/common";
import { CommonAnimPhase } from "./common-anim-phase";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import type { HealBlockTag } from "#app/data/battler-tags";

export class PokemonHealPhase extends CommonAnimPhase {
  private hpHealed: number;
  private message: string | null;
  private showFullHpMessage: boolean;
  private skipAnim: boolean;
  private revive: boolean;
  private healStatus: boolean;
  private preventFullHeal: boolean;
  private fullRestorePP: boolean;

  constructor(
    battlerIndex: BattlerIndex,
    hpHealed: number,
    message: string | null,
    showFullHpMessage: boolean,
    skipAnim = false,
    revive = false,
    healStatus = false,
    preventFullHeal = false,
    fullRestorePP = false,
  ) {
    super(battlerIndex, undefined, CommonAnim.HEALTH_UP);

    this.hpHealed = hpHealed;
    this.message = message;
    this.showFullHpMessage = showFullHpMessage;
    this.skipAnim = skipAnim;
    this.revive = revive;
    this.healStatus = healStatus;
    this.preventFullHeal = preventFullHeal;
    this.fullRestorePP = fullRestorePP;
  }

  start() {
    if (!this.skipAnim && (this.revive || this.getPokemon().hp) && !this.getPokemon().isFullHp()) {
      super.start();
    } else {
      this.end();
    }
  }

  end() {
    const pokemon = this.getPokemon();

    if (!pokemon.isOnField() || (!this.revive && !pokemon.isActive())) {
      return super.end();
    }

    const hasMessage = !!this.message;
    const healOrDamage = !pokemon.isFullHp() || this.hpHealed < 0;
    const healBlock = pokemon.getTag(BattlerTagType.HEAL_BLOCK) as HealBlockTag;
    let lastStatusEffect = StatusEffect.NONE;

    if (healBlock && this.hpHealed > 0) {
      globalScene.queueMessage(healBlock.onActivation(pokemon));
      this.message = null;
      return super.end();
    }
    if (healOrDamage) {
      const hpRestoreMultiplier = new NumberHolder(1);
      if (!this.revive) {
        globalScene.applyModifiers(HealingBoosterModifier, this.player, hpRestoreMultiplier);
      }
      const healAmount = new NumberHolder(Math.floor(this.hpHealed * hpRestoreMultiplier.value));
      if (healAmount.value < 0) {
        pokemon.damageAndUpdate(healAmount.value * -1, { result: HitResult.INDIRECT });
        healAmount.value = 0;
      }
      // Prevent healing to full if specified (in case of healing tokens so Sturdy doesn't cause a softlock)
      if (this.preventFullHeal && pokemon.hp + healAmount.value >= pokemon.getMaxHp()) {
        healAmount.value = pokemon.getMaxHp() - pokemon.hp - 1;
      }
      healAmount.value = pokemon.heal(healAmount.value);
      if (healAmount.value) {
        globalScene.damageNumberHandler.add(pokemon, healAmount.value, HitResult.HEAL);
      }
      if (pokemon.isPlayer()) {
        globalScene.validateAchvs(HealAchv, healAmount);
        if (healAmount.value > globalScene.gameData.gameStats.highestHeal) {
          globalScene.gameData.gameStats.highestHeal = healAmount.value;
        }
      }
      if (this.healStatus && !this.revive && pokemon.status) {
        lastStatusEffect = pokemon.status.effect;
        pokemon.resetStatus();
      }
      if (this.fullRestorePP) {
        for (const move of this.getPokemon().getMoveset()) {
          if (move) {
            move.ppUsed = 0;
          }
        }
      }
      pokemon.updateInfo().then(() => super.end());
    } else if (this.healStatus && !this.revive && pokemon.status) {
      lastStatusEffect = pokemon.status.effect;
      pokemon.resetStatus();
      pokemon.updateInfo().then(() => super.end());
    } else if (this.showFullHpMessage) {
      this.message = i18next.t("battle:hpIsFull", {
        pokemonName: getPokemonNameWithAffix(pokemon),
      });
    }

    if (this.message) {
      globalScene.queueMessage(this.message);
    }

    if (this.healStatus && lastStatusEffect && !hasMessage) {
      globalScene.queueMessage(getStatusEffectHealText(lastStatusEffect, getPokemonNameWithAffix(pokemon)));
    }

    if (!healOrDamage && !lastStatusEffect) {
      super.end();
    }
  }
}
