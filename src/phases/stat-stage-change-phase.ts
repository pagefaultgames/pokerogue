import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { OctolockTag } from "#data/battler-tags";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerIndex } from "#enums/battler-index";
import { type BattleStat, getStatKey, getStatStageChangeDescriptionKey, Stat } from "#enums/stat";
import { StatChangeSource } from "#enums/stat-change-source";
import type { Pokemon } from "#field/pokemon";
import { ResetNegativeStatStageModifier } from "#modifiers/modifier";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { ConditionalUserFieldProtectStatAbAttrParams, PreStatStageChangeAbAttrParams } from "#types/ability-types";
import { ValueHolder } from "#utils/value-holder";
import i18next from "i18next";

export type StatStageChangeCallback = (
  target: Pokemon | null,
  changed: readonly BattleStat[],
  relativeChanges: number,
) => void;

export interface StatStageChangePhaseOptions {
  battlerIndex: BattlerIndex | number;
  stats: readonly BattleStat[];
  stages: number;
  sourcePokemon: Pokemon | undefined;
  ignoreAbilities?: boolean;
  canBeCopied?: boolean;
  onChange?: StatStageChangeCallback;
  /** The Pokemon whose effect caused these stat changes */
  sourceEffect?: StatChangeSource;
  /** If this phase was queued after splitting by another SSCP, avoid doing housekeeping again */
  processed?: boolean;
}

export class StatStageChangePhase extends PokemonPhase {
  public readonly phaseName = "StatStageChangePhase";
  private readonly options: StatStageChangePhaseOptions;
  private readonly selfTarget: boolean;

  constructor(options: StatStageChangePhaseOptions) {
    super(options.battlerIndex);

    this.options = { sourceEffect: StatChangeSource.NORMAL, ...options };
    this.selfTarget = options.sourcePokemon != null && options.sourcePokemon === this.getPokemon();
  }

  start() {
    const pokemon = this.getPokemon();
    const opponent = this.selfTarget ? undefined : this.options.sourcePokemon;

    if (!pokemon.isActive(true)) {
      return this.end();
    }

    let statsToChange: readonly BattleStat[];
    let relativeChange: number;

    if (this.options.processed) {
      statsToChange = this.options.stats;
      relativeChange = this.getRelativeChanges(pokemon, statsToChange)[0];
    } else {
      const stages = new ValueHolder(this.options.stages);
      if (!this.options.ignoreAbilities) {
        applyAbAttrs("StatStageChangeMultiplierAbAttr", { pokemon, numStages: stages });
      }
      this.options.stages = stages.value;

      const filteredStats = this.options.stats.filter(stat => {
        return !this.checkStatCancellation(pokemon, opponent, stat);
      });

      if (filteredStats.length === 0) {
        this.end();
        return;
      }

      const relativeChanges = this.getRelativeChanges(pokemon, filteredStats);

      // Split stat changes into separate phases when the relative changes don't match
      // If split, continue running this phase with the first group instead of re-queuing
      statsToChange = this.splitUnlikeChanges(filteredStats, relativeChanges);
      relativeChange = relativeChanges[0];
    }

    this.options.onChange?.(pokemon, statsToChange, relativeChange);

    const hasVisibleChanges = relativeChange !== 0;
    if (hasVisibleChanges && globalScene.moveAnimations) {
      this.playStatChangeAnimation(pokemon, relativeChange, () => {
        this.applyStatChangesAndEnd(pokemon, statsToChange, relativeChange);
      });
    } else {
      this.applyStatChangesAndEnd(pokemon, statsToChange, relativeChange);
    }
  }

  /**
   * Split stat changes into phases by relative changes (i.e. groups where the message would be the same)
   * @param filteredStats - The stats to change
   * @param relLevels - The relative level by which each stat is changing
   * @returns The first group of stats changed, so it can be used immediately instead of in a subsequent Phase
   */
  private splitUnlikeChanges(filteredStats: BattleStat[], relLevels: number[]): BattleStat[] {
    const groups = this.groupStatsByRelativeStage(filteredStats, relLevels);
    const groupEntries = Object.values(groups);

    for (let i = 1; i < groupEntries.length; i++) {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", {
        ...this.options,
        stats: groupEntries[i],
      });
    }
    return groupEntries[0];
  }

  /**
   * Compute the relative level for each stat stage change after clamping the result between -6 and 6.
   * @param pokemon - The Pokemon with potential stat changes
   * @param stats - The stats being changes
   * @param stages - The pre-clamp number of stages to change each stat
   * @returns A parallel array to `stats` holding the relative change for each stat
   */
  private getRelativeChanges(pokemon: Pokemon, stats: readonly BattleStat[]): number[] {
    return stats.map(s => {
      const stages = this.options.stages;
      const current = pokemon.getStatStage(s);
      const clamped = stages > 0 ? Math.min(current + stages, 6) : Math.max(current + stages, -6);
      return clamped - current;
    });
  }

  /**
   * Determine if a single stat stage should be cancelled by field or enemy effects such as Mirror Armor or Mist
   * @param pokemon - The Pokemon with potential stat changes
   * @param opponentPokemon - The opponent of the provided pokemon
   * @param stat - The stat to change
   * @returns Whether the stat should be cancelled
   */
  private checkStatCancellation(pokemon: Pokemon, opponentPokemon: Pokemon | undefined, stat: BattleStat): boolean {
    // No reflection method currently exists which blocks positive or self-target changes
    if (this.options.stages >= 0 || this.selfTarget) {
      return false;
    }

    const cancelled = new ValueHolder(false);

    globalScene.arena.applyTagsForSide(
      ArenaTagType.MIST,
      pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY,
      false,
      pokemon,
      cancelled,
      opponentPokemon,
    );

    if (!cancelled.value) {
      this.checkAbilityProtection(pokemon, opponentPokemon, stat, cancelled);
    }

    return cancelled.value;
  }

  /**
   * Helper to check if a stat change is prevented by the target Pokemon's or its ally's ability.
   */
  private checkAbilityProtection(
    pokemon: Pokemon,
    opponentPokemon: Pokemon | undefined,
    stat: BattleStat,
    cancelled: ValueHolder<boolean>,
  ): void {
    const abAttrParams: PreStatStageChangeAbAttrParams & ConditionalUserFieldProtectStatAbAttrParams = {
      pokemon,
      stat,
      cancelled,
      simulated: false,
      target: pokemon,
      stages: this.options.stages,
    };

    applyAbAttrs("ProtectStatAbAttr", abAttrParams);
    applyAbAttrs("ConditionalUserFieldProtectStatAbAttr", abAttrParams);

    // TODO: Consider skipping this call if `cancelled` is already true.
    const ally = pokemon.getAlly();
    if (ally != null) {
      applyAbAttrs("ConditionalUserFieldProtectStatAbAttr", { ...abAttrParams, pokemon: ally });
    }

    // TODO: investigate whether the `opponentPokemon` check is stopping mirror armor from applying
    // to non-octolock reasons for stat drops if the user has the Octolock tag
    if (
      opponentPokemon == null
      || this.options.sourceEffect === StatChangeSource.MIRROR_ARMOR
      || pokemon.findTag(t => t instanceof OctolockTag)
    ) {
      return;
    }

    applyAbAttrs("ReflectStatStageChangeAbAttr", {
      pokemon,
      stat,
      cancelled,
      simulated: false,
      source: opponentPokemon,
      stages: this.options.stages,
    });
  }

  /**
   * After validity checks, apply stat stage changes and reactions (i.e. Defiant, White Herb) then end the phase.
   * @param pokemon - The Pokemon receiving stat changes
   * @param filteredStats - The stats to change
   * @param stages - The amount of stages to change for each stat, before clamping (used to i.e. determine if a stat change was positive or negative)
   * @param relLevel - The amount of stages to change for each stat, after clamping
   */
  private applyStatChangesAndEnd(pokemon: Pokemon, filteredStats: readonly BattleStat[], relLevel: number): void {
    const message = this.buildStatStageChangeMessage(filteredStats, this.options.stages, relLevel);
    globalScene.phaseManager.queueMessage(message);

    this.updateStatStages(pokemon, filteredStats, relLevel);
    this.triggerReactionAbilities(pokemon, filteredStats, this.options.stages);
    this.checkWhiteHerb(pokemon);

    pokemon.updateInfo();
    handleTutorial(Tutorial.STAT_CHANGE).then(() => super.end());
  }

  private updateStatStages(pokemon: Pokemon, stats: readonly BattleStat[], stages: number): void {
    for (const s of stats) {
      const current = pokemon.getStatStage(s);

      if (stages > 0 && current < 6) {
        pokemon.turnData.statStagesIncreased = true;
      } else if (stages < 0 && current > -6) {
        pokemon.turnData.statStagesDecreased = true;
      }

      pokemon.setStatStage(s, current + stages);
    }
  }

  private triggerReactionAbilities(pokemon: Pokemon, filteredStats: readonly BattleStat[], stages: number): void {
    if (stages > 0 && this.options.canBeCopied) {
      for (const opponent of pokemon.getOpponentsGenerator()) {
        applyAbAttrs("StatStageChangeCopyAbAttr", { pokemon: opponent, stats: filteredStats, numStages: stages });
      }
    }

    applyAbAttrs("PostStatStageChangeAbAttr", {
      pokemon,
      stats: filteredStats,
      stages: this.options.stages,
      selfTarget: this.selfTarget ?? false,
    });
  }

  /** If this is the last stat change phase for the target, apply White Herb if held. */
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

  private playStatChangeAnimation(pokemon: Pokemon, stages: number, onComplete: () => void): void {
    pokemon.enableMask();

    const isIncrease = stages >= 1;
    const scale = pokemon.getSpriteScale() * globalScene.field.scale;

    const tileX = (this.player ? 106 : 236) * scale;
    const tileY = ((this.player ? 148 : 84) + (isIncrease ? 160 : 0)) * scale;
    const tileWidth = 156 * scale;
    const tileHeight = 316 * scale;

    // On increase, show the red sprite located at ATK; on decrease, the blue sprite at SPD
    const spriteColor = isIncrease ? Stat[Stat.ATK].toLowerCase() : Stat[Stat.SPD].toLowerCase();
    const statSprite = globalScene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
    statSprite.setPipeline(globalScene.fieldSpritePipeline);
    statSprite.setAlpha(0);
    statSprite.setScale(6);
    statSprite.setOrigin(0.5, 1);
    statSprite.setMask(new Phaser.Display.Masks.BitmapMask(globalScene, pokemon.maskSprite ?? undefined));

    globalScene.playSound(`se/stat_${isIncrease ? "up" : "down"}`);

    globalScene.tweens.add({
      targets: statSprite,
      duration: 250,
      alpha: 0.8375,
      onComplete: () => {
        globalScene.tweens.add({
          targets: statSprite,
          delay: 1000,
          duration: 250,
          alpha: 0,
        });
      },
    });

    globalScene.tweens.add({
      targets: statSprite,
      duration: 1500,
      y: `${isIncrease ? "-" : "+"}=${160 * 6}`,
    });

    globalScene.time.delayedCall(1750, () => {
      pokemon.disableMask();
      onComplete();
    });
  }

  private buildStatStageChangeMessage(stats: readonly BattleStat[], stages: number, relStages: number): string {
    const statsFragment = this.formatStatsFragment(stats);
    return i18next.t(getStatStageChangeDescriptionKey(Math.abs(relStages), stages > 0), {
      pokemonNameWithAffix: getPokemonNameWithAffix(this.getPokemon()),
      stats: statsFragment,
      count: stats.length,
    });
  }

  private groupStatsByRelativeStage(stats: readonly BattleStat[], relStages: number[]): Record<number, BattleStat[]> {
    const groups: Record<number, BattleStat[]> = {};
    for (let i = 0; i < relStages.length; i++) {
      const key = relStages[i];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(stats[i]);
    }
    return groups;
  }

  private formatStatsFragment(stats: readonly BattleStat[]): string {
    if (stats.length >= 5) {
      return i18next.t("battle:stats");
    }

    if (stats.length === 1) {
      return i18next.t(getStatKey(stats[0]));
    }

    const allButLast = stats
      .slice(0, -1)
      .map(s => i18next.t(getStatKey(s)))
      .join(", ");
    const oxfordComma = stats.length > 2 ? "," : "";
    const last = i18next.t(getStatKey(stats.at(-1)!));
    return `${allButLast}${oxfordComma} ${i18next.t("battle:statsAnd")} ${last}`;
  }
}
