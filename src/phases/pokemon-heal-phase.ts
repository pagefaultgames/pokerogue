import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectHealText } from "#data/status-effect";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { CommonAnim } from "#enums/move-anims-common";
import { HealingBoosterModifier } from "#modifiers/modifier";
import { CommonAnimPhase } from "#phases/common-anim-phase";
import { HealAchv } from "#system/achv";
import { NumberHolder, toDmgValue } from "#utils/common";
import i18next from "i18next";

// TODO: Refactor this - it has far too many arguments
export class PokemonHealPhase extends CommonAnimPhase {
  public readonly phaseName = "PokemonHealPhase";

  /** The base amount of HP to heal. */
  private hpHealed: number;
  /**
   * The message to display upon healing the target, or `undefined` to show no message.
   * Will be overridden by the full HP message if {@linkcode showFullHpMessage} is set to `true`
   */
  private message: string | undefined;
  /**
   * Whether to show a failure message upon healing a Pokemon already at full HP.
   * @defaultValue `true`
   */
  private showFullHpMessage: boolean;
  /**
   * Whether to skip showing the healing animation.
   * @defaultValue `false`
   */
  private skipAnim: boolean;
  /**
   * Whether to revive the affected Pokemon in addition to healing.
   * Revives will not be affected by any Healing Charms.
   * @todo Remove post modifier rework as revives will not be using phases to heal stuff
   * @defaultValue `false`
   */
  private revive: boolean;
  /**
   * Whether to heal the affected Pokemon's status condition.
   * @todo This should not be the healing phase's job
   * @defaultValue `false`
   */
  private healStatus: boolean;
  /**
   * Whether to prevent fully healing affected Pokemon, leaving them 1 HP below full.
   * @defaultValue `false`
   */
  private preventFullHeal: boolean;
  /**
   * Whether to fully restore PP upon healing.
   * @todo This should not be the healing phase's job
   * @defaultValue `false`
   */
  private fullRestorePP: boolean;

  constructor(
    battlerIndex: BattlerIndex,
    hpHealed: number,
    {
      message,
      showFullHpMessage = true,
      skipAnim = false,
      revive = false,
      healStatus = false,
      preventFullHeal = false,
      fullRestorePP = false,
    }: {
      message?: string;
      showFullHpMessage?: boolean;
      skipAnim?: boolean;
      revive?: boolean;
      healStatus?: boolean;
      preventFullHeal?: boolean;
      fullRestorePP?: boolean;
    } = {},
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

  override start() {
    // Only play animation if not skipped and target is not at full HP
    if (!this.skipAnim && !this.getPokemon().isFullHp()) {
      super.start();
    } else {
      this.end();
    }
  }

  // This is required as `commonAnimPhase` calls `this.end` once the animation finishes
  // TODO: This is a really shitty process and i hate it
  override end() {
    this.heal().then(() => {
      super.end();
    });
  }

  private async heal() {
    const pokemon = this.getPokemon();

    // Prevent healing off-field pokemon unless via revives
    // TODO: Revival effects shouldn't use this phase
    if (!this.revive && !pokemon.isActive(true)) {
      return;
    }

    // Check for heal block, ending the phase early if healing was prevented
    const healBlock = pokemon.getTag(BattlerTagType.HEAL_BLOCK);
    if (healBlock && this.hpHealed > 0) {
      globalScene.phaseManager.queueMessage(healBlock.onActivation(pokemon));
      return;
    }

    this.doHealPokemon();

    // Cure status as applicable
    // TODO: This should not be the job of the healing phase
    if (this.healStatus && pokemon.status) {
      this.message = getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon));
      pokemon.resetStatus();
    }

    // Restore PP.
    // TODO: This should not be the job of the healing phase
    if (this.fullRestorePP) {
      pokemon.getMoveset().forEach(m => {
        m.ppUsed = 0;
      });
    }

    // Show message, update info boxes and then wrap up.
    if (this.message) {
      globalScene.phaseManager.queueMessage(this.message);
    }
    await pokemon.updateInfo();
  }

  /**
   * Heal the Pokemon affected by this Phase.
   */
  private doHealPokemon(): void {
    const pokemon = this.getPokemon()!;

    // If we would heal the user past full HP, don't.
    if (this.hpHealed > 0 && pokemon.isFullHp()) {
      if (this.showFullHpMessage) {
        this.message = i18next.t("battle:hpIsFull", {
          pokemonName: getPokemonNameWithAffix(pokemon),
        });
      }
      return;
    }

    const healAmount = this.getHealAmount();

    if (healAmount < 0) {
      // If Liquid Ooze is active, damage the user for the healing amount, then return.
      // TODO: Consider refactoring liquid ooze to not use a heal phase to do damage
      pokemon.damageAndUpdate(-healAmount, { result: HitResult.INDIRECT });
      return;
    }

    // Heal the pokemon, then show damage numbers and validate achievements.
    pokemon.heal(healAmount);
    globalScene.damageNumberHandler.add(pokemon, healAmount, HitResult.HEAL);
    if (pokemon.isPlayer()) {
      globalScene.validateAchvs(HealAchv, healAmount);
      globalScene.gameData.gameStats.highestHeal = Math.max(globalScene.gameData.gameStats.highestHeal, healAmount);
    }
  }

  /**
   * Calculate the amount of HP to be healed during this Phase.
   * @returns The updated healing amount post-modifications, capped at the Pokemon's maximum HP.
   * @remarks
   * The effect of Healing Charms are rounded down for parity with the closest mainline counterpart
   * (i.e. Big Root).
   */
  private getHealAmount(): number {
    if (this.revive) {
      return toDmgValue(this.hpHealed);
    }

    // Apply the effect of healing charms for non-revival items before rounding down and capping at max HP
    // (or 1 below max for healing tokens).
    // Liquid Ooze damage (being negative) remains uncapped as normal.
    const healMulti = new NumberHolder(1);
    globalScene.applyModifiers(HealingBoosterModifier, this.player, healMulti);
    // TODO: we need to round liquid ooze dmg towards 0, not down
    return Math.min(Math.floor(this.hpHealed * healMulti.value), this.getPokemon().getMaxHp() - +this.preventFullHeal);
  }
}
