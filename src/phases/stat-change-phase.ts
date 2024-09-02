import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { applyAbAttrs, applyPostStatChangeAbAttrs, applyPreStatChangeAbAttrs, PostStatChangeAbAttr, ProtectStatAbAttr, StatChangeCopyAbAttr, StatChangeMultiplierAbAttr } from "#app/data/ability";
import { ArenaTagSide, MistTag } from "#app/data/arena-tag";
import { BattleStat, getBattleStatLevelChangeDescription, getBattleStatName } from "#app/data/battle-stat";
import Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonResetNegativeStatStageModifier } from "#app/modifier/modifier";
import { handleTutorial, Tutorial } from "#app/tutorial";
import * as Utils from "#app/utils";
import i18next from "i18next";
import { PokemonPhase } from "./pokemon-phase";

export type StatChangeCallback = (target: Pokemon | null, changed: BattleStat[], relativeChanges: number[]) => void;

export class StatChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private selfTarget: boolean;
  private levels: integer;
  private showMessage: boolean;
  private ignoreAbilities: boolean;
  private canBeCopied: boolean;
  private onChange: StatChangeCallback | null;


  constructor(scene: BattleScene, battlerIndex: BattlerIndex, selfTarget: boolean, stats: BattleStat[], levels: integer, showMessage: boolean = true, ignoreAbilities: boolean = false, canBeCopied: boolean = true, onChange: StatChangeCallback | null = null) {
    super(scene, battlerIndex);

    this.selfTarget = selfTarget;
    this.stats = stats;
    this.levels = levels;
    this.showMessage = showMessage;
    this.ignoreAbilities = ignoreAbilities;
    this.canBeCopied = canBeCopied;
    this.onChange = onChange;
  }

  start() {
    const pokemon = this.getPokemon();

    let random = false;

    if (this.stats.length === 1 && this.stats[0] === BattleStat.RAND) {
      this.stats[0] = this.getRandomStat();
      random = true;
    }

    this.aggregateStatChanges(random);

    if (!pokemon.isActive(true)) {
      return this.end();
    }

    const filteredStats = this.stats.map(s => s !== BattleStat.RAND ? s : this.getRandomStat()).filter(stat => {
      const cancelled = new Utils.BooleanHolder(false);

      if (!this.selfTarget && this.levels < 0) {
        this.scene.arena.applyTagsForSide(MistTag, pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, cancelled);
      }

      if (!cancelled.value && !this.selfTarget && this.levels < 0) {
        applyPreStatChangeAbAttrs(ProtectStatAbAttr, this.getPokemon(), stat, cancelled);
      }

      return !cancelled.value;
    });

    const levels = new Utils.IntegerHolder(this.levels);

    if (!this.ignoreAbilities) {
      applyAbAttrs(StatChangeMultiplierAbAttr, pokemon, null, false, levels);
    }

    const battleStats = this.getPokemon().summonData.battleStats;
    const relLevels = filteredStats.map(stat => (levels.value >= 1 ? Math.min(battleStats[stat] + levels.value, 6) : Math.max(battleStats[stat] + levels.value, -6)) - battleStats[stat]);

    this.onChange && this.onChange(this.getPokemon(), filteredStats, relLevels);

    const end = () => {
      if (this.showMessage) {
        const messages = this.getStatChangeMessages(filteredStats, levels.value, relLevels);
        for (const message of messages) {
          this.scene.queueMessage(message);
        }
      }

      for (const stat of filteredStats) {
        if (levels.value > 0 && pokemon.summonData.battleStats[stat] < 6) {
          if (!pokemon.turnData) {
            // Temporary fix for missing turn data struct on turn 1
            pokemon.resetTurnData();
          }
          pokemon.turnData.battleStatsIncreased = true;
        } else if (levels.value < 0 && pokemon.summonData.battleStats[stat] > -6) {
          if (!pokemon.turnData) {
            // Temporary fix for missing turn data struct on turn 1
            pokemon.resetTurnData();
          }
          pokemon.turnData.battleStatsDecreased = true;
        }

        pokemon.summonData.battleStats[stat] = Math.max(Math.min(pokemon.summonData.battleStats[stat] + levels.value, 6), -6);
      }

      if (levels.value > 0 && this.canBeCopied) {
        for (const opponent of pokemon.getOpponents()) {
          applyAbAttrs(StatChangeCopyAbAttr, opponent, null, false, this.stats, levels.value);
        }
      }

      applyPostStatChangeAbAttrs(PostStatChangeAbAttr, pokemon, filteredStats, this.levels, this.selfTarget);

      // Look for any other stat change phases; if this is the last one, do White Herb check
      const existingPhase = this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex);
      if (!(existingPhase instanceof StatChangePhase)) {
        // Apply White Herb if needed
        const whiteHerb = this.scene.applyModifier(PokemonResetNegativeStatStageModifier, this.player, pokemon) as PokemonResetNegativeStatStageModifier;
        // If the White Herb was applied, consume it
        if (whiteHerb) {
          --whiteHerb.stackCount;
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
      const tileY = ((this.player ? 148 : 84) + (levels.value >= 1 ? 160 : 0)) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileWidth = 156 * this.scene.field.scale * pokemon.getSpriteScale();
      const tileHeight = 316 * this.scene.field.scale * pokemon.getSpriteScale();

      // On increase, show the red sprite located at ATK
      // On decrease, show the blue sprite located at SPD
      const spriteColor = levels.value >= 1 ? BattleStat[BattleStat.ATK].toLowerCase() : BattleStat[BattleStat.SPD].toLowerCase();
      const statSprite = this.scene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
      statSprite.setPipeline(this.scene.fieldSpritePipeline);
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.playSound(`se/stat_${levels.value >= 1 ? "up" : "down"}`);

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
        y: `${levels.value >= 1 ? "-" : "+"}=${160 * 6}`
      });

      this.scene.time.delayedCall(1750, () => {
        pokemon.disableMask();
        end();
      });
    } else {
      end();
    }
  }

  getRandomStat(): BattleStat {
    const allStats = Utils.getEnumValues(BattleStat);
    return this.getPokemon() ? allStats[this.getPokemon()!.randSeedInt(BattleStat.SPD + 1)] : BattleStat.ATK; // TODO: return default ATK on random? idk...
  }

  aggregateStatChanges(random: boolean = false): void {
    const isAccEva = [BattleStat.ACC, BattleStat.EVA].some(s => this.stats.includes(s));
    let existingPhase: StatChangePhase;
    if (this.stats.length === 1) {
      while ((existingPhase = (this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex && p.stats.length === 1
        && (p.stats[0] === this.stats[0] || (random && p.stats[0] === BattleStat.RAND))
        && p.selfTarget === this.selfTarget && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatChangePhase))) {
        if (existingPhase.stats[0] === BattleStat.RAND) {
          existingPhase.stats[0] = this.getRandomStat();
          if (existingPhase.stats[0] !== this.stats[0]) {
            continue;
          }
        }
        this.levels += existingPhase.levels;

        if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
          break;
        }
      }
    }
    while ((existingPhase = (this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex && p.selfTarget === this.selfTarget
      && ([BattleStat.ACC, BattleStat.EVA].some(s => p.stats.includes(s)) === isAccEva)
      && p.levels === this.levels && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatChangePhase))) {
      this.stats.push(...existingPhase.stats);
      if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
        break;
      }
    }
  }

  getStatChangeMessages(stats: BattleStat[], levels: integer, relLevels: integer[]): string[] {
    const messages: string[] = [];

    const relLevelStatIndexes = {};
    for (let rl = 0; rl < relLevels.length; rl++) {
      const relLevel = relLevels[rl];
      if (!relLevelStatIndexes[relLevel]) {
        relLevelStatIndexes[relLevel] = [];
      }
      relLevelStatIndexes[relLevel].push(rl);
    }

    Object.keys(relLevelStatIndexes).forEach(rl => {
      const relLevelStats = stats.filter((_, i) => relLevelStatIndexes[rl].includes(i));
      let statsFragment = "";

      if (relLevelStats.length > 1) {
        statsFragment = relLevelStats.length >= 5
          ? i18next.t("battle:stats")
          : `${relLevelStats.slice(0, -1).map(s => getBattleStatName(s)).join(", ")}${relLevelStats.length > 2 ? "," : ""} ${i18next.t("battle:statsAnd")} ${getBattleStatName(relLevelStats[relLevelStats.length - 1])}`;
        messages.push(getBattleStatLevelChangeDescription(getPokemonNameWithAffix(this.getPokemon()), statsFragment, Math.abs(parseInt(rl)), levels >= 1, relLevelStats.length));
      } else {
        statsFragment = getBattleStatName(relLevelStats[0]);
        messages.push(getBattleStatLevelChangeDescription(getPokemonNameWithAffix(this.getPokemon()), statsFragment, Math.abs(parseInt(rl)), levels >= 1, relLevelStats.length));
      }
    });

    return messages;
  }
}
