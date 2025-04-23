import { getLevelRelExp } from "#app/data/exp";
import { globalScene } from "#app/global-scene";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import BattleInfo from "./battle-info";
import { Stat } from "#enums/stat";

import type { PlayerPokemon } from "#app/field/pokemon";

export class PlayerBattleInfo extends BattleInfo {
  protected static player: true = true;

  override get statOrder(): Stat[] {
    return [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD];
  }

  constructor() {
    super(Math.floor(globalScene.game.canvas.width / 6) - 10, -72, true);

    this.hpNumbersContainer = globalScene.add.container(-15, 10).setName("container_hp");
    this.add(this.hpNumbersContainer);

    const expBar = globalScene.add.image(-98, 18, "overlay_exp");
    expBar.setName("overlay_exp");
    expBar.setOrigin(0);
    this.add(expBar);

    const expMaskRect = globalScene.make.graphics({});
    expMaskRect.setScale(6);
    expMaskRect.fillStyle(0xffffff);
    expMaskRect.beginPath();
    expMaskRect.fillRect(127, 126, 85, 2);

    const expMask = expMaskRect.createGeometryMask();

    expBar.setMask(expMask);

    this.expBar = expBar;
    this.expMaskRect = expMaskRect;
  }

  override async updatePokemonExp(
    pokemon: PlayerPokemon,
    instant?: boolean,
    levelDurationMultiplier = 1,
  ): Promise<void> {
    const levelUp = this.lastLevel < pokemon.level;
    const relLevelExp = getLevelRelExp(this.lastLevel + 1, pokemon.species.growthRate);
    const levelExp = levelUp ? relLevelExp : pokemon.levelExp;
    let ratio = relLevelExp ? levelExp / relLevelExp : 0;
    if (this.lastLevel >= globalScene.getMaxExpLevel(true)) {
      if (levelUp) {
        ratio = 1;
      } else {
        ratio = 0;
      }
      instant = true;
    }
    const durationMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(
      1 - Math.max(this.lastLevel - 100, 0) / 150,
    );
    let duration =
      this.visible && !instant
        ? ((levelExp - this.lastLevelExp) / relLevelExp) *
          BattleInfo.EXP_GAINS_DURATION_BASE *
          durationMultiplier *
          levelDurationMultiplier
        : 0;
    const speed = globalScene.expGainsSpeed;
    if (speed && speed >= ExpGainsSpeed.DEFAULT) {
      duration = speed >= ExpGainsSpeed.SKIP ? ExpGainsSpeed.DEFAULT : duration / Math.pow(2, speed);
    }
    if (ratio === 1) {
      this.lastLevelExp = 0;
      this.lastLevel++;
    } else {
      this.lastExp = pokemon.exp;
      this.lastLevelExp = pokemon.levelExp;
    }
    if (duration) {
      globalScene.playSound("se/exp");
    }
    return new Promise(resolve => {
      globalScene.tweens.add({
        targets: this.expMaskRect,
        ease: "Sine.easeIn",
        x: ratio * 510,
        duration: duration,
        onComplete: () => {
          if (!globalScene) {
            return resolve();
          }
          if (duration) {
            globalScene.sound.stopByKey("se/exp");
          }
          if (ratio === 1) {
            globalScene.playSound("se/level_up");
            this.setLevel(this.lastLevel);
            globalScene.time.delayedCall(500 * levelDurationMultiplier, () => {
              this.expMaskRect.x = 0;
              this.updateInfo(pokemon, instant).then(() => resolve());
            });
            return;
          }
          resolve();
        },
      });
    });
  }

  protected override onHpTweenUpdate(pokemon: PlayerPokemon): void {
    const tweenHp = Math.ceil(this.hpBar.scaleX * pokemon.getMaxHp());
    this.setHpNumbers(tweenHp, pokemon.getMaxHp());
    this.lastHp = tweenHp;
    this.updateHpFrame();
  }

  override async updateInfo(pokemon: PlayerPokemon, instant?: boolean): Promise<void> {
    super.updateInfo(pokemon, instant);
    const isLevelCapped = pokemon.level >= globalScene.getMaxExpLevel();

    if (this.lastExp !== pokemon.exp || this.lastLevel !== pokemon.level) {
      const durationMultipler = Math.max(
        Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn")(1 - Math.min(pokemon.level - this.lastLevel, 10) / 10),
        0.1,
      );
      await this.updatePokemonExp(pokemon, false, durationMultipler).then();
    } else if (isLevelCapped !== this.lastLevelCapped) {
      this.setLevel(pokemon.level);
    }

    this.lastLevelCapped = isLevelCapped;
  }

  protected setHpNumbers(hp: number, maxHp: number): void {
    if (!globalScene) {
      return;
    }
    this.hpNumbersContainer.removeAll(true);
    const hpStr = hp.toString();
    const maxHpStr = maxHp.toString();
    let offset = 0;
    for (let i = maxHpStr.length - 1; i >= 0; i--) {
      this.hpNumbersContainer.add(globalScene.add.image(offset++ * -8, 0, "numbers", maxHpStr[i]));
    }
    this.hpNumbersContainer.add(globalScene.add.image(offset++ * -8, 0, "numbers", "/"));
    for (let i = hpStr.length - 1; i >= 0; i--) {
      this.hpNumbersContainer.add(globalScene.add.image(offset++ * -8, 0, "numbers", hpStr[i]));
    }
  }
}
