import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { CommonAnim } from "#app/data/battle-anims.js";
import { getStatusEffectHealText } from "#app/data/status-effect.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { HitResult, DamageResult } from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { HealingBoosterModifier } from "#app/modifier/modifier.js";
import { HealAchv } from "#app/system/achv.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { CommonAnimPhase } from "./common-anim-phase";

export class PokemonHealPhase extends CommonAnimPhase {
  private hpHealed: integer;
  private message: string | null;
  private showFullHpMessage: boolean;
  private skipAnim: boolean;
  private revive: boolean;
  private healStatus: boolean;
  private preventFullHeal: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, hpHealed: integer, message: string | null, showFullHpMessage: boolean, skipAnim: boolean = false, revive: boolean = false, healStatus: boolean = false, preventFullHeal: boolean = false) {
    super(scene, battlerIndex, undefined, CommonAnim.HEALTH_UP);

    this.hpHealed = hpHealed;
    this.message = message;
    this.showFullHpMessage = showFullHpMessage;
    this.skipAnim = skipAnim;
    this.revive = revive;
    this.healStatus = healStatus;
    this.preventFullHeal = preventFullHeal;
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
      super.end();
      return;
    }

    const hasMessage = !!this.message;
    const healOrDamage = (!pokemon.isFullHp() || this.hpHealed < 0);
    let lastStatusEffect = StatusEffect.NONE;

    if (healOrDamage) {
      const hpRestoreMultiplier = new Utils.IntegerHolder(1);
      if (!this.revive) {
        this.scene.applyModifiers(HealingBoosterModifier, this.player, hpRestoreMultiplier);
      }
      const healAmount = new Utils.NumberHolder(Math.floor(this.hpHealed * hpRestoreMultiplier.value));
      if (healAmount.value < 0) {
        pokemon.damageAndUpdate(healAmount.value * -1, HitResult.HEAL as DamageResult);
        healAmount.value = 0;
      }
      // Prevent healing to full if specified (in case of healing tokens so Sturdy doesn't cause a softlock)
      if (this.preventFullHeal && pokemon.hp + healAmount.value >= pokemon.getMaxHp()) {
        healAmount.value = (pokemon.getMaxHp() - pokemon.hp) - 1;
      }
      healAmount.value = pokemon.heal(healAmount.value);
      if (healAmount.value) {
        this.scene.damageNumberHandler.add(pokemon, healAmount.value, HitResult.HEAL);
      }
      if (pokemon.isPlayer()) {
        this.scene.validateAchvs(HealAchv, healAmount);
        if (healAmount.value > this.scene.gameData.gameStats.highestHeal) {
          this.scene.gameData.gameStats.highestHeal = healAmount.value;
        }
      }
      if (this.healStatus && !this.revive && pokemon.status) {
        lastStatusEffect = pokemon.status.effect;
        pokemon.resetStatus();
      }
      pokemon.updateInfo().then(() => super.end());
    } else if (this.healStatus && !this.revive && pokemon.status) {
      lastStatusEffect = pokemon.status.effect;
      pokemon.resetStatus();
      pokemon.updateInfo().then(() => super.end());
    } else if (this.showFullHpMessage) {
      this.message = i18next.t("battle:hpIsFull", { pokemonName: getPokemonNameWithAffix(pokemon) });
    }

    if (this.message) {
      this.scene.queueMessage(this.message);
    }

    if (this.healStatus && lastStatusEffect && !hasMessage) {
      this.scene.queueMessage(getStatusEffectHealText(lastStatusEffect, getPokemonNameWithAffix(pokemon)));
    }

    if (!healOrDamage && !lastStatusEffect) {
      super.end();
    }
  }
}
