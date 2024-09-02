import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { applyAbAttrs, applyPostStatStageChangeAbAttrs, applyPreStatStageChangeAbAttrs, PostStatStageChangeAbAttr, ProtectStatAbAttr, StatStageChangeCopyAbAttr, StatStageChangeMultiplierAbAttr } from "#app/data/ability";
import { ArenaTagSide, MistTag } from "#app/data/arena-tag";
import Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { ResetNegativeStatStageModifier } from "#app/modifier/modifier";
import { handleTutorial, Tutorial } from "#app/tutorial";
import * as Utils from "#app/utils";
import i18next from "i18next";
import { PokemonPhase } from "./pokemon-phase";
import { Stat, type BattleStat, getStatKey, getStatStageChangeDescriptionKey } from "#enums/stat";

export type StatStageChangeCallback = (target: Pokemon | null, changed: BattleStat[], relativeChanges: number[]) => void;

export class StatStageChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private selfTarget: boolean;
  private stages: integer;
  private showMessage: boolean;
  private ignoreAbilities: boolean;
  private canBeCopied: boolean;
  private onChange: StatStageChangeCallback | null;


  constructor(scene: BattleScene, battlerIndex: BattlerIndex, selfTarget: boolean, stats: BattleStat[], stages: integer, showMessage: boolean = true, ignoreAbilities: boolean = false, canBeCopied: boolean = true, onChange: StatStageChangeCallback | null = null) {
    super(scene, battlerIndex);

    this.selfTarget = selfTarget;
    this.stats = stats;
    this.stages = stages;
    this.showMessage = showMessage;
    this.ignoreAbilities = ignoreAbilities;
    this.canBeCopied = canBeCopied;
    this.onChange = onChange;
  }

  start() {
    const pokemon = this.getPokemon();

    if (!pokemon.isActive(true)) {
      return this.end();
    }

    let simulate = false;

    const filteredStats = this.stats.filter(stat => {
      const cancelled = new Utils.BooleanHolder(false);

      if (!this.selfTarget && this.stages < 0) {
        // TODO: Include simulate boolean when tag applications can be simulated
        this.scene.arena.applyTagsForSide(MistTag, pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, cancelled);
      }

      if (!cancelled.value && !this.selfTarget && this.stages < 0) {
        applyPreStatStageChangeAbAttrs(ProtectStatAbAttr, pokemon, stat, cancelled, simulate);
      }

      // If one stat stage decrease is cancelled, simulate the rest of the applications
      if (cancelled.value) {
        simulate = true;
      }

      return !cancelled.value;
    });

    const stages = new Utils.IntegerHolder(this.stages);

    if (!this.ignoreAbilities) {
      applyAbAttrs(StatStageChangeMultiplierAbAttr, pokemon, null, false, stages);
    }

    const relLevels = filteredStats.map(s => (stages.value >= 1 ? Math.min(pokemon.getStatStage(s) + stages.value, 6) : Math.max(pokemon.getStatStage(s) + stages.value, -6)) - pokemon.getStatStage(s));

    this.onChange && this.onChange(this.getPokemon(), filteredStats, relLevels);

    const end = () => {
      if (this.showMessage) {
        const messages = this.getStatStageChangeMessages(filteredStats, stages.value, relLevels);
        for (const message of messages) {
          this.scene.queueMessage(message);
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
      const existingPhase = this.scene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex);
      if (!(existingPhase instanceof StatStageChangePhase)) {
        // Apply White Herb if needed
        const whiteHerb = this.scene.applyModifier(ResetNegativeStatStageModifier, this.player, pokemon) as ResetNegativeStatStageModifier;
        // If the White Herb was applied, consume it
        if (whiteHerb) {
          whiteHerb.stackCount--;
          if (whiteHerb.stackCount <= 0) {
            this.scene.removeModifier(whiteHerb);
          }
          this.scene.updateModifiers(this.player);
        }
      }

      pokemon.updateInfo();

      handleTutorial(this.scene, Tutorial.Stat_Change).then(() => super.end());
    };

    if (relLevels.filter(l => l).length && this.scene.moveAnimations) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const tileX = (this.player ? 106 : 236) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileY = ((this.player ? 148 : 84) + (stages.value >= 1 ? 160 : 0)) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileWidth = 156 * this.scene.field.scale * pokemon.getSpriteScale();
      const tileHeight = 316 * this.scene.field.scale * pokemon.getSpriteScale();

      // On increase, show the red sprite located at ATK
      // On decrease, show the blue sprite located at SPD
      const spriteColor = stages.value >= 1 ? Stat[Stat.ATK].toLowerCase() : Stat[Stat.SPD].toLowerCase();
      const statSprite = this.scene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
      statSprite.setPipeline(this.scene.fieldSpritePipeline);
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.playSound(`se/stat_${stages.value >= 1 ? "up" : "down"}`);

      statSprite.setMask(new Phaser.Display.Masks.BitmapMask(this.scene, pokemonMaskSprite ?? undefined));

      this.scene.tweens.add({
        targets: statSprite,
        duration: 250,
        alpha: 0.8375,
        onComplete: () => {
          this.scene.tweens.add({
            targets: statSprite,
            delay: 1000,
            duration: 250,
            alpha: 0
          });
        }
      });

      this.scene.tweens.add({
        targets: statSprite,
        duration: 1500,
        y: `${stages.value >= 1 ? "-" : "+"}=${160 * 6}`
      });

      this.scene.time.delayedCall(1750, () => {
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
      while ((existingPhase = (this.scene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex && p.stats.length === 1
        && (p.stats[0] === this.stats[0])
        && p.selfTarget === this.selfTarget && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatStageChangePhase))) {
        this.stages += existingPhase.stages;

        if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
          break;
        }
      }
    }
    while ((existingPhase = (this.scene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex && p.selfTarget === this.selfTarget
      && (accEva.some(s => p.stats.includes(s)) === isAccEva)
      && p.stages === this.stages && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatStageChangePhase))) {
      this.stats.push(...existingPhase.stats);
      if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
        break;
      }
    }
  }

  getStatStageChangeMessages(stats: BattleStat[], stages: integer, relStages: integer[]): string[] {
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
