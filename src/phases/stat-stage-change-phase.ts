import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import {
  applyAbAttrs, applyPostStatStageChangeAbAttrs, applyPreStatStageChangeAbAttrs,
  PostStatStageChangeAbAttr, ProtectStatAbAttr, StatStageChangeCopyAbAttr, StatStageChangeMultiplierAbAttr
} from "#app/data/ability";
import { ArenaTagSide, MistTag } from "#app/data/arena-tag";
import Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { ResetNegativeStatStageModifier } from "#app/modifier/modifier";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { BooleanHolder, NumberHolder } from "#app/utils";
import { getStatKey, getStatStageChangeDescriptionKey, Stat, type BattleStat } from "#enums/stat";
import i18next from "i18next";

export type StatStageChangeCallback = (changed: BattleStat[], relativeChanges: number[], target?: Pokemon) => void;

export class StatStageChangePhase extends PokemonPhase {
  private filteredStats: BattleStat[];
  private stagesHolder: NumberHolder;
  private relLevels: number[];

  constructor(
    scene: BattleScene,
    battlerIndex: BattlerIndex,
    protected selfTarget: boolean,
    protected stats: BattleStat[],
    protected stages: number,
    protected showMessage: boolean = true,
    protected ignoreAbilities: boolean = false,
    protected canBeCopied: boolean = true,
    protected onChange?: StatStageChangeCallback
  ) {
    super(scene, battlerIndex);
  }

  public override start(): void {
    const pokemon = this.getPokemon();

    if (!pokemon.isActive(true)) {
      return super.end();
    }

    // Check if multiple stats are being changed at the same time, then run SSCPhase for each of them
    if (this.stats.length > 1) {
      for (let i = 0; i < this.stats.length; i++) {
        const stat = [ this.stats[i] ];
        this.scene.unshiftPhase(new StatStageChangePhase(this.scene, this.battlerIndex, this.selfTarget, stat, this.stages, this.showMessage, this.ignoreAbilities, this.canBeCopied, this.onChange));
      }
      return super.end();
    }

    this.stagesHolder = new NumberHolder(this.stages);

    if (!this.ignoreAbilities) {
      applyAbAttrs(StatStageChangeMultiplierAbAttr, pokemon, null, false, this.stagesHolder);
    }

    let simulate = false;

    this.filteredStats = this.stats.filter(stat => {
      const cancelled = new BooleanHolder(false);

      if (!this.selfTarget && this.stagesHolder.value < 0) {
        // TODO: Include simulate boolean when tag applications can be simulated
        this.scene.arena.applyTagsForSide(MistTag, pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, cancelled);
      }

      if (!cancelled.value && !this.selfTarget && this.stagesHolder.value < 0) {
        applyPreStatStageChangeAbAttrs(ProtectStatAbAttr, pokemon, stat, cancelled, simulate);
      }

      // If one stat stage decrease is cancelled, simulate the rest of the applications
      if (cancelled.value) {
        simulate = true;
      }

      return !cancelled.value;
    });

    this.relLevels = this.filteredStats.map(s =>
      (this.stagesHolder.value >= 1
        ? Math.min(pokemon.getStatStage(s) + this.stagesHolder.value, 6)
        : Math.max(pokemon.getStatStage(s) + this.stagesHolder.value, -6)
      ) - pokemon.getStatStage(s));

    if (this.onChange) {
      this.onChange(this.filteredStats, this.relLevels, this.getPokemon());
    }

    if (this.relLevels.filter(l => l).length && this.scene.moveAnimations) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const tileX = (this.isPlayer ? 106 : 236) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileY = ((this.isPlayer ? 148 : 84) + (this.stagesHolder.value >= 1 ? 160 : 0)) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileWidth = 156 * this.scene.field.scale * pokemon.getSpriteScale();
      const tileHeight = 316 * this.scene.field.scale * pokemon.getSpriteScale();

      // On increase, show the red sprite located at ATK
      // On decrease, show the blue sprite located at SPD
      const spriteColor = this.stagesHolder.value >= 1 ? Stat[Stat.ATK].toLowerCase() : Stat[Stat.SPD].toLowerCase();
      const statSprite = this.scene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
      statSprite.setPipeline(this.scene.fieldSpritePipeline);
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.playSound(`se/stat_${this.stagesHolder.value >= 1 ? "up" : "down"}`);

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
        y: `${this.stagesHolder.value >= 1 ? "-" : "+"}=${160 * 6}`
      });

      this.scene.time.delayedCall(1750, () => {
        pokemon.disableMask();
        this.end();
      });
    } else {
      this.end();
    }
  }

  public override end(): void {
    const pokemon = this.getPokemon();
    if (this.showMessage) {
      const messages = this.getStatStageChangeMessages(this.filteredStats, this.stagesHolder.value, this.relLevels);
      for (const message of messages) {
        this.scene.queueMessage(message);
      }
    }

    for (const s of this.filteredStats) {
      if (this.stagesHolder.value > 0 && pokemon.getStatStage(s) < 6) {
        if (!pokemon.turnData) {
          // Temporary fix for missing turn data struct on turn 1
          pokemon.resetTurnData();
        }
        pokemon.turnData.statStagesIncreased = true;
      } else if (this.stagesHolder.value < 0 && pokemon.getStatStage(s) > -6) {
        if (!pokemon.turnData) {
          // Temporary fix for missing turn data struct on turn 1
          pokemon.resetTurnData();
        }
        pokemon.turnData.statStagesDecreased = true;
      }

      pokemon.setStatStage(s, pokemon.getStatStage(s) + this.stagesHolder.value);
    }

    if (this.stagesHolder.value > 0 && this.canBeCopied) {
      for (const opponent of pokemon.getOpponents()) {
        applyAbAttrs(StatStageChangeCopyAbAttr, opponent, null, false, this.stats, this.stagesHolder.value);
      }
    }

    applyPostStatStageChangeAbAttrs(PostStatStageChangeAbAttr, pokemon, this.filteredStats, this.stages, this.selfTarget);

    // Look for any other stat change phases; if this is the last one, do White Herb check
    const existingPhase = this.scene.findPhase(p => p instanceof StatStageChangePhase && p.battlerIndex === this.battlerIndex);
    if (!(existingPhase instanceof StatStageChangePhase)) {
      // Apply White Herb if needed
      const whiteHerb = this.scene.applyModifier(ResetNegativeStatStageModifier, this.isPlayer, pokemon) as ResetNegativeStatStageModifier;
      // If the White Herb was applied, consume it
      if (whiteHerb) {
        whiteHerb.stackCount--;
        if (whiteHerb.stackCount <= 0) {
          this.scene.removeModifier(whiteHerb);
        }
        this.scene.updateModifiers(this.isPlayer);
      }
    }

    pokemon.updateInfo();

    handleTutorial(this.scene, Tutorial.Stat_Change).then(() => super.end());
  }

  protected getStatStageChangeMessages(stats: BattleStat[], stages: number, relStages: number[]): string[] {
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
