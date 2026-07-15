import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { OctolockTag } from "#data/battler-tags";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { type BattleStat, getStatKey, getStatStageChangeDescriptionKey, Stat } from "#enums/stat";
import { StatChangeSource } from "#enums/stat-change-source";
import type { Pokemon } from "#field/pokemon";
import { ResetNegativeStatStageModifier } from "#modifiers/modifier";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { ConditionalUserFieldProtectStatAbAttrParams, PreStatStageChangeAbAttrParams } from "#types/ability-types";
import type { StatChange, StatStageChangePhaseOptions } from "#types/stat-change";
import type { Mutable } from "#types/type-helpers";
import { playTween } from "#utils/anim-utils";
import { deepCopy } from "#utils/data";
import { ValueHolder } from "#utils/value-holder";
import i18next from "i18next";

/**
 * Phase responsible for resolving, animating, and applying one or more stat changes.
 * they will be split into one phase for raises and one phase for drops.
 *
 * Changes to multiple stats may be applied at once. If both raises and drops are provided to the same phase,
 * it will be split into one phase for raises and one phase for drops.
 */
export class StatStageChangePhase extends PokemonPhase {
  public override readonly phaseName = "StatStageChangePhase";

  private readonly options: StatStageChangePhaseOptions;
  /** Whether the target caused its own stat changes for this phase */
  private readonly selfTarget: boolean;
  /** Whether this phase represents a stat stage increase, set after splitting changes by sign */
  private isIncrease = false;

  constructor(options: StatStageChangePhaseOptions) {
    super(options.battlerIndex);

    this.options = { ...options };
    // TODO: Change this once `getPokemon`'s return type is fixed
    this.selfTarget = options.sourcePokemon != null && options.sourcePokemon === this.getPokemon();
    this.options.changes = deepCopy(options.changes).filter(c => c.stages !== 0); // Allow changes with 0 stages to be passed as no-ops
  }

  // @ts-expect-error: TODO: the return type of `PokemonPhase#getPokemon` is wrong
  public override getPokemon(): Pokemon | undefined {
    return super.getPokemon();
  }

  public override start(): void {
    const pokemon = this.getPokemon();

    if (!pokemon?.isActive(true)) {
      this.end();
      return;
    }

    if (!this.options.processed) {
      this.applyStageMultipliers(pokemon);
      this.removeCancelledChanges(pokemon);
      this.splitBySign();
    }

    if (this.options.changes.length === 0) {
      this.end();
      return;
    }
    this.isIncrease = this.options.changes.some(c => c.stages > 0);

    const applied = this.getAppliedChanges(pokemon);
    this.options.onChange?.(pokemon, applied);

    if (applied.some(c => c.stages !== 0) && globalScene.moveAnimations) {
      this.playStatChangeAnimation(pokemon).then(() => this.applyStatChangesAndEnd(pokemon, applied));
    } else {
      this.applyStatChangesAndEnd(pokemon, applied);
    }
  }

  /**
   * Apply stat stage multiplier abilities to every requested change.
   *
   * @param pokemon - The Pokemon receiving the stat changes
   */
  private applyStageMultipliers(pokemon: Pokemon): void {
    if (this.options.ignoreAbilities) {
      return;
    }

    const multiplier = new ValueHolder(1);
    applyAbAttrs("StatStageChangeMultiplierAbAttr", { pokemon, numStages: multiplier });

    for (const change of this.options.changes) {
      (change as Mutable<StatChange>).stages *= multiplier.value;
    }
  }

  /**
   * Remove any negative stat changes that are blocked by field effects or abilities,
   * updating {@linkcode StatStageChangePhaseOptions.changes | options.changes} in place.
   *
   * @param pokemon - The Pokemon receiving the stat changes
   */
  private removeCancelledChanges(pokemon: Pokemon): void {
    if (this.selfTarget) {
      return;
    }
    // NB: This currently hardcodes the fact that abilities and field effects can _only_ respond to stat decreases and not increases.
    // If any effects that can cancel stat stage increases are added, this check should be removed.
    const negative = this.options.changes.filter(c => c.stages < 0);
    if (negative.length === 0) {
      return;
    }

    const opponent = this.options.sourcePokemon;
    const cancelledStats: Set<BattleStat> = new Set();

    globalScene.arena.applyTagsForSide(
      ArenaTagType.MIST,
      pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY,
      false,
      pokemon,
      this.options.changes,
      cancelledStats,
      opponent,
    );

    if (cancelledStats.size < this.options.changes.length) {
      this.checkAbilityProtection(pokemon, opponent, negative, cancelledStats);
    }

    this.options.changes = this.options.changes.filter(c => !cancelledStats.has(c.stat));
  }

  /**
   * Invoke abilities that may block or reflect a set of stat drops,
   * adding any blocked stats to {@linkcode cancelledStats}.
   *
   * @param pokemon - The Pokemon receiving the stat changes
   * @param opponentPokemon - The Pokemon that caused the change, if present; used to resolve the target for Mirror Armor's reflection effect.
   * @param changes - The negative stat changes to evaluate
   * @param cancelledStats - A set containing each {@linkcode BattleStat} whose change was cancelled; will be modified by this method
   */
  private checkAbilityProtection(
    pokemon: Pokemon,
    opponentPokemon: Pokemon | undefined,
    changes: readonly StatChange[],
    cancelledStats: Set<BattleStat>,
  ): void {
    const abAttrParams: PreStatStageChangeAbAttrParams & ConditionalUserFieldProtectStatAbAttrParams = {
      pokemon,
      changes,
      cancelledStats,
      simulated: false,
      target: pokemon,
    };

    applyAbAttrs("ProtectStatAbAttr", abAttrParams);
    applyAbAttrs("ConditionalUserFieldProtectStatAbAttr", abAttrParams);

    const ally = pokemon.getAlly();
    if (ally != null) {
      applyAbAttrs("ConditionalUserFieldProtectStatAbAttr", { ...abAttrParams, pokemon: ally });
    }

    // TODO: investigate whether the `opponentPokemon` check prevents Mirror
    // Armor from applying to non-Octolock stat drops when the target has the
    // Octolock tag.
    if (
      opponentPokemon == null
      || this.options.sourceEffectType === StatChangeSource.MIRROR_ARMOR
      || pokemon.findTag(t => t instanceof OctolockTag)
    ) {
      return;
    }

    applyAbAttrs("ReflectStatStageChangeAbAttr", {
      pokemon,
      changes,
      cancelledStats,
      simulated: false,
      source: opponentPokemon,
    });
  }

  /**
   * If both positive and negative stage changes are present,
   * split the negative changes into a follow-up {@linkcode StatStageChangePhase}.
   */
  private splitBySign(): void {
    const positive = this.options.changes.filter(c => c.stages >= 0);
    const negative = this.options.changes.filter(c => c.stages < 0);

    if (positive.length === 0 || negative.length === 0) {
      return;
    }

    this.options.changes = positive;
    globalScene.phaseManager.unshiftNew("StatStageChangePhase", {
      ...this.options,
      changes: negative,
      processed: true,
    });
  }

  /**
   * Compute the relative change for each requested change by clamping to `[-6, 6]`.
   *
   * @param pokemon - The Pokemon receiving the stat changes
   * @returns A new array of {@linkcode StatChange}s
   */
  private getAppliedChanges(pokemon: Pokemon): StatChange[] {
    return this.options.changes.map(({ stat, stages }) => {
      const current = pokemon.getStatStage(stat);
      const clamped = Phaser.Math.Clamp(current + stages, -6, 6);
      return { stat, stages: clamped - current };
    });
  }

  /**
   * Apply the resolved changes, queue battle messages, trigger reactive abilities/items, and end the phase.
   *
   * @param pokemon - The Pokemon receiving the stat changes
   * @param applied - The clamped per-stat deltas to apply
   */
  private applyStatChangesAndEnd(pokemon: Pokemon, applied: readonly StatChange[]): void {
    this.queueStatChangeMessages(applied);
    this.updateStatStages(pokemon, applied);
    this.triggerReactionAbilities(pokemon);
    this.checkWhiteHerb(pokemon);

    pokemon.updateInfo();
    handleTutorial(Tutorial.STAT_CHANGE).then(() => super.end());
  }

  /**
   * Queue one battle message per distinct stage change magnitude.
   *
   * @param applied - The applied changes
   */
  private queueStatChangeMessages(applied: readonly StatChange[]): void {
    for (const [_, group] of Map.groupBy(applied, c => c.stages)) {
      globalScene.phaseManager.queueMessage(this.buildStatStageChangeMessage(group));
    }
  }

  /**
   * Write each clamped change to the target's stat stages and flag turn data accordingly.
   *
   * @param pokemon - The Pokemon receiving the stat changes
   * @param applied - The applied changes
   */
  private updateStatStages(pokemon: Pokemon, applied: readonly StatChange[]): void {
    for (const { stat, stages } of applied) {
      const current = pokemon.getStatStage(stat);

      if (stages > 0 && current < 6) {
        pokemon.turnData.statStagesIncreased = true;
      } else if (stages < 0 && current > -6) {
        pokemon.turnData.statStagesDecreased = true;
      }

      pokemon.setStatStage(stat, current + stages);
    }
  }

  /**
   * Trigger abilities that react to stat stage changes, such as Opportunist and Defiant.
   *
   * @param pokemon - The Pokemon whose stats have changed
   *
   * @privateRemarks
   * Triggering once with all changes means certain interactions diverge from
   * mainline.  For example, Defiant will proc as a single +4 when two stats
   * are dropped instead of twice +2, which would be a real difference for
   * something like Mirror Herb (copying +4 instead of a single +2) but is
   * otherwise not significant beyond faster animation.
   */
  private triggerReactionAbilities(pokemon: Pokemon): void {
    if (
      this.options.sourceEffectType !== StatChangeSource.OPPORTUNIST
      && this.options.changes.some(c => c.stages > 0)
    ) {
      for (const opponent of pokemon.getOpponentsGenerator()) {
        applyAbAttrs("StatStageChangeCopyAbAttr", { pokemon: opponent, changes: this.options.changes });
      }
    }

    applyAbAttrs("PostStatStageChangeAbAttr", { pokemon, changes: this.options.changes, selfTarget: this.selfTarget });
  }

  /**
   * If this is the last queued {@linkcode StatStageChangePhase} for the target,
   * consume a held White Herb (if any) to reset negative stat stages.
   *
   * @param pokemon - The Pokemon to check
   */
  private checkWhiteHerb(pokemon: Pokemon): void {
    const hasMoreStatPhases = globalScene.phaseManager.hasPhaseOfType(
      "StatStageChangePhase",
      p => p.battlerIndex === this.battlerIndex,
    );
    if (hasMoreStatPhases) {
      return;
    }

    const whiteHerb = globalScene.applyModifier(
      ResetNegativeStatStageModifier,
      this.player,
      pokemon,
    ) as ResetNegativeStatStageModifier;

    if (whiteHerb) {
      pokemon.loseHeldItem(whiteHerb);
      globalScene.updateModifiers(this.player);
    }
  }

  /**
   * Play the stat change animation, depending on whether there were increases or decreases.
   *
   * @param pokemon - The Pokemon to animate
   * @param onComplete - Callback for after the animation completes
   */
  private async playStatChangeAnimation(pokemon: Pokemon): Promise<void> {
    pokemon.enableMask();

    const scale = pokemon.getSpriteScale() * globalScene.field.scale;

    const tileX = (this.player ? 106 : 236) * scale;
    const tileY = ((this.player ? 148 : 84) + (this.isIncrease ? 160 : 0)) * scale;
    const tileWidth = 156 * scale;
    const tileHeight = 316 * scale;

    // On increase, show the red sprite located at ATK; on decrease, the blue sprite at SPD
    const spriteColor = this.isIncrease ? Stat[Stat.ATK].toLowerCase() : Stat[Stat.SPD].toLowerCase();
    const statSprite = globalScene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
    statSprite
      .setPipeline(globalScene.fieldSpritePipeline)
      .setAlpha(0)
      .setScale(6)
      .setOrigin(0.5, 1)
      .setMask(new Phaser.Display.Masks.BitmapMask(globalScene, pokemon.maskSprite ?? undefined));

    audioManager.playSound(`se/stat_${this.isIncrease ? "up" : "down"}`);

    await playTween({
      targets: statSprite,
      duration: 250,
      alpha: 0.8375,
    });

    await playTween({
      targets: statSprite,
      duration: 1500,
      y: `${this.isIncrease ? "-" : "+"}=${160 * 6}`,
    });

    await playTween({
      targets: statSprite,
      duration: 250,
      alpha: 0,
    });

    pokemon.disableMask();
  }

  /**
   * Build a stat change message for a group of changes that share the same magnitude.
   *
   * @param changes - The changes described by this message (all sharing one {@linkcode StatChange.stages | stages} value)
   * @returns The localised message string
   */
  private buildStatStageChangeMessage(changes: readonly StatChange[]): string {
    const relStages = changes[0].stages;
    return i18next.t(getStatStageChangeDescriptionKey(Math.abs(relStages), this.isIncrease), {
      pokemonNameWithAffix: getPokemonNameWithAffix(this.getPokemon()),
      stats: this.formatStatsFragment(changes),
      count: changes.length,
    });
  }

  /**
   * Format a list of changes into a localised stat-name fragment (e.g. `"Attack, Defense, and Speed"`).
   *
   * @param changes - The changes whose stat names should be listed
   * @returns The localised fragment, or the generic `"stats"` string for 5+
   */
  private formatStatsFragment(changes: readonly StatChange[]): string {
    if (changes.length >= 5) {
      return i18next.t("battle:stats");
    }

    if (changes.length === 1) {
      return i18next.t(getStatKey(changes[0].stat));
    }

    const allButLast = changes
      .slice(0, -1)
      .map(c => i18next.t(getStatKey(c.stat)))
      .join(", ");
    const oxfordComma = changes.length > 2 ? "," : "";
    const last = i18next.t(getStatKey(changes.at(-1)!.stat));
    return `${allButLast}${oxfordComma} ${i18next.t("battle:statsAnd")} ${last}`;
  }
}
