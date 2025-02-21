import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPostStatStageChangeAbAttrs, applyPreStatStageChangeAbAttrs, PostStatStageChangeAbAttr, ProtectStatAbAttr, ReflectStatStageChangeAbAttr, StatStageChangeCopyAbAttr, StatStageChangeMultiplierAbAttr } from "#app/data/ability";
import { ArenaTagSide, MistTag } from "#app/data/arena-tag";
import type { ArenaTag } from "#app/data/arena-tag";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { ResetNegativeStatStageModifier } from "#app/modifier/modifier";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { NumberHolder, BooleanHolder } from "#app/utils";
import i18next from "i18next";
import { PokemonPhase } from "./pokemon-phase";
import { Stat, type BattleStat, getStatKey, getStatStageChangeDescriptionKey } from "#enums/stat";
import { OctolockTag } from "#app/data/battler-tags";
import { ArenaTagType } from "#app/enums/arena-tag-type";

export type StatStageChangeCallback = (target: Pokemon | null, changed: BattleStat[], relativeChanges: number[]) => void;

export class StatStageChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private selfTarget: boolean;
  private stages: number;
  private showMessage: boolean;
  private ignoreAbilities: boolean;
  private canBeCopied: boolean;
  private onChange: StatStageChangeCallback | null;
  private comingFromMirrorArmorUser: boolean;
  private comingFromStickyWeb: boolean;


  constructor(battlerIndex: BattlerIndex, selfTarget: boolean, stats: BattleStat[], stages: number, showMessage: boolean = true, ignoreAbilities: boolean = false, canBeCopied: boolean = true, onChange: StatStageChangeCallback | null = null, comingFromMirrorArmorUser: boolean = false, comingFromStickyWeb: boolean = false) {
    super(battlerIndex);

    this.selfTarget = selfTarget;
    this.stats = stats;
    this.stages = stages;
    this.showMessage = showMessage;
    this.ignoreAbilities = ignoreAbilities;
    this.canBeCopied = canBeCopied;
    this.onChange = onChange;
    this.comingFromMirrorArmorUser = comingFromMirrorArmorUser;
    this.comingFromStickyWeb = comingFromStickyWeb;
  }

  start() {

    // Check if multiple stats are being changed at the same time, then run SSCPhase for each of them
    if (this.stats.length > 1) {
      for (let i = 0; i < this.stats.length; i++) {
        const stat = [ this.stats[i] ];
        globalScene.unshiftPhase(new StatStageChangePhase(this.battlerIndex, this.selfTarget, stat, this.stages, this.showMessage, this.ignoreAbilities, this.canBeCopied, this.onChange, this.comingFromMirrorArmorUser));
      }
      return this.end();
    }

    const pokemon = this.getPokemon();
    let opponentPokemon: Pokemon | undefined;

    /** Gets the position of last enemy or player pokemon that used ability or move, primarily for double battles involving Mirror Armor */
    if (pokemon.isPlayer()) {
      /** If this SSCP is not from sticky web, then we find the opponent pokemon that last did something */
      if (!this.comingFromStickyWeb) {
        opponentPokemon = globalScene.getEnemyField()[globalScene.currentBattle.lastEnemyInvolved];
      } else {
        /** If this SSCP is from sticky web, then check if pokemon that last sucessfully used sticky web is on field */
        const stickyTagID = globalScene.arena.findTagsOnSide(
          (t: ArenaTag) => t.tagType === ArenaTagType.STICKY_WEB,
          ArenaTagSide.PLAYER)[0].sourceId;
        globalScene.getEnemyField().forEach((e) => {
          if (e.id === stickyTagID) {
            opponentPokemon = e;
          }
        });
      }
    } else {
      if (!this.comingFromStickyWeb) {
        opponentPokemon = globalScene.getPlayerField()[globalScene.currentBattle.lastPlayerInvolved];
      } else {
        const stickyTagID = globalScene.arena.findTagsOnSide(
          (t: ArenaTag) => t.tagType === ArenaTagType.STICKY_WEB,
          ArenaTagSide.ENEMY)[0].sourceId;
        globalScene.getPlayerField().forEach((e) => {
          if (e.id === stickyTagID) {
            opponentPokemon = e;
          }
        });
      }
    }

    if (!pokemon.isActive(true)) {
      return this.end();
    }

    const stages = new NumberHolder(this.stages);

    if (!this.ignoreAbilities) {
      applyAbAttrs(StatStageChangeMultiplierAbAttr, pokemon, null, false, stages);
    }

    let simulate = false;

    const filteredStats = this.stats.filter(stat => {
      const cancelled = new BooleanHolder(false);

      if (!this.selfTarget && stages.value < 0) {
        // TODO: add a reference to the source of the stat change to fix Infiltrator interaction
        globalScene.arena.applyTagsForSide(MistTag, pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, false, null, cancelled);
      }

      if (!cancelled.value && !this.selfTarget && stages.value < 0) {
        applyPreStatStageChangeAbAttrs(ProtectStatAbAttr, pokemon, stat, cancelled, simulate);

        /** Potential stat reflection due to Mirror Armor, does not apply to Octolock end of turn effect */
        if (opponentPokemon !== undefined && !pokemon.findTag(t => t instanceof OctolockTag) && !this.comingFromMirrorArmorUser) {
          applyPreStatStageChangeAbAttrs(ReflectStatStageChangeAbAttr, pokemon, stat, cancelled, simulate, opponentPokemon, this.stages);
        }
      }

      // If one stat stage decrease is cancelled, simulate the rest of the applications
      if (cancelled.value) {
        simulate = true;
      }

      return !cancelled.value;
    });

    const relLevels = filteredStats.map(s => (stages.value >= 1 ? Math.min(pokemon.getStatStage(s) + stages.value, 6) : Math.max(pokemon.getStatStage(s) + stages.value, -6)) - pokemon.getStatStage(s));

    this.onChange && this.onChange(this.getPokemon(), filteredStats, relLevels);

    const end = () => {
      if (this.showMessage) {
        const messages = this.getStatStageChangeMessages(filteredStats, stages.value, relLevels);
        for (const message of messages) {
          globalScene.queueMessage(message);
        }
      }

      for (const s of filteredStats) {
        if (stages.value > 0 && pokemon.getStatStage(s) < 6) {
          if (!pokemon.turnData) {
            // Temporary fix for missing turn data struct on turn 1
            pokemon.resetTurnData();
          }
          pokemon.turnData.statStagesIncreased = true;
        } else if (stages.value < 0 && pokemon.getStatStage(s) > -6) {
          if (!pokemon.turnData) {
            // Temporary fix for missing turn data struct on turn 1
            pokemon.resetTurnData();
          }
          pokemon.turnData.statStagesDecreased = true;
        }

        pokemon.setStatStage(s, pokemon.getStatStage(s) + stages.value);
      }

      if (stages.value > 0 && this.canBeCopied) {
        for (const opponent of pokemon.getOpponents()) {
          applyAbAttrs(StatStageChangeCopyAbAttr, opponent, null, false, this.stats, stages.value);
        }
      }

      applyPostStatStageChangeAbAttrs(PostStatStageChangeAbAttr, pokemon, filteredStats, this.stages, this.selfTarget);

      // Look for any other stat change phases; if this is the last one, do White Herb check
      const existingPhase = globalScene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex);
      if (!(existingPhase instanceof StatStageChangePhase)) {
        // Apply White Herb if needed
        const whiteHerb = globalScene.applyModifier(ResetNegativeStatStageModifier, this.player, pokemon) as ResetNegativeStatStageModifier;
        // If the White Herb was applied, consume it
        if (whiteHerb) {
          pokemon.loseHeldItem(whiteHerb);
          globalScene.updateModifiers(this.player);
        }
      }

      pokemon.updateInfo();

      handleTutorial(Tutorial.Stat_Change).then(() => super.end());
    };

    if (relLevels.filter(l => l).length && globalScene.moveAnimations) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const tileX = (this.player ? 106 : 236) * pokemon.getSpriteScale() * globalScene.field.scale;
      const tileY = ((this.player ? 148 : 84) + (stages.value >= 1 ? 160 : 0)) * pokemon.getSpriteScale() * globalScene.field.scale;
      const tileWidth = 156 * globalScene.field.scale * pokemon.getSpriteScale();
      const tileHeight = 316 * globalScene.field.scale * pokemon.getSpriteScale();

      // On increase, show the red sprite located at ATK
      // On decrease, show the blue sprite located at SPD
      const spriteColor = stages.value >= 1 ? Stat[Stat.ATK].toLowerCase() : Stat[Stat.SPD].toLowerCase();
      const statSprite = globalScene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
      statSprite.setPipeline(globalScene.fieldSpritePipeline);
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      globalScene.playSound(`se/stat_${stages.value >= 1 ? "up" : "down"}`);

      statSprite.setMask(new Phaser.Display.Masks.BitmapMask(globalScene, pokemonMaskSprite ?? undefined));

      globalScene.tweens.add({
        targets: statSprite,
        duration: 250,
        alpha: 0.8375,
        onComplete: () => {
          globalScene.tweens.add({
            targets: statSprite,
            delay: 1000,
            duration: 250,
            alpha: 0
          });
        }
      });

      globalScene.tweens.add({
        targets: statSprite,
        duration: 1500,
        y: `${stages.value >= 1 ? "-" : "+"}=${160 * 6}`
      });

      globalScene.time.delayedCall(1750, () => {
        pokemon.disableMask();
        end();
      });
    } else {
      end();
    }
  }

  aggregateStatStageChanges(): void {
    const accEva: BattleStat[] = [ Stat.ACC, Stat.EVA ];
    const isAccEva = accEva.some(s => this.stats.includes(s));
    let existingPhase: StatStageChangePhase;
    if (this.stats.length === 1) {
      while ((existingPhase = (globalScene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex && p.stats.length === 1
        && (p.stats[0] === this.stats[0])
        && p.selfTarget === this.selfTarget && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatStageChangePhase))) {
        this.stages += existingPhase.stages;

        if (!globalScene.tryRemovePhase(p => p === existingPhase)) {
          break;
        }
      }
    }
    while ((existingPhase = (globalScene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex && p.selfTarget === this.selfTarget
      && (accEva.some(s => p.stats.includes(s)) === isAccEva)
      && p.stages === this.stages && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatStageChangePhase))) {
      this.stats.push(...existingPhase.stats);
      if (!globalScene.tryRemovePhase(p => p === existingPhase)) {
        break;
      }
    }
  }

  getStatStageChangeMessages(stats: BattleStat[], stages: number, relStages: number[]): string[] {
    const messages: string[] = [];

    const relStageStatIndexes = {};
    for (let rl = 0; rl < relStages.length; rl++) {
      const relStage = relStages[rl];
      if (!relStageStatIndexes[relStage]) {
        relStageStatIndexes[relStage] = [];
      }
      relStageStatIndexes[relStage].push(rl);
    }

    Object.keys(relStageStatIndexes).forEach(rl => {
      const relStageStats = stats.filter((_, i) => relStageStatIndexes[rl].includes(i));
      let statsFragment = "";

      if (relStageStats.length > 1) {
        statsFragment = relStageStats.length >= 5
          ? i18next.t("battle:stats")
          : `${relStageStats.slice(0, -1).map(s => i18next.t(getStatKey(s))).join(", ")}${relStageStats.length > 2 ? "," : ""} ${i18next.t("battle:statsAnd")} ${i18next.t(getStatKey(relStageStats[relStageStats.length - 1]))}`;
        messages.push(i18next.t(getStatStageChangeDescriptionKey(Math.abs(parseInt(rl)), stages >= 1), {
          pokemonNameWithAffix: getPokemonNameWithAffix(this.getPokemon()),
          stats: statsFragment,
          count: relStageStats.length
        }));
      } else {
        statsFragment = i18next.t(getStatKey(relStageStats[0]));
        messages.push(i18next.t(getStatStageChangeDescriptionKey(Math.abs(parseInt(rl)), stages >= 1), {
          pokemonNameWithAffix: getPokemonNameWithAffix(this.getPokemon()),
          stats: statsFragment,
          count: relStageStats.length
        }));
      }
    });

    return messages;
  }
}
