import { getLevelRelExp, getLevelTotalExp } from "#app/data/exp";
import type { PlayerPokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { Stat } from "#enums/stat";
import BattleInfo from "./battle-info";

export class PlayerBattleInfo extends BattleInfo {
  protected player: true = true;
  protected hpNumbersContainer: Phaser.GameObjects.Container;

  override get statOrder(): Stat[] {
    return [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD];
  }
  constructor() {
    super(Math.floor(globalScene.game.canvas.width / 6) - 10, -72, true);

    this.hpNumbersContainer = globalScene.add.container(-15, 10).setName("container_hp");
    this.add(this.hpNumbersContainer);

    const expBar = globalScene.add.image(-98, 18, "overlay_exp").setName("overlay_exp").setOrigin(0);
    this.add(expBar);

    const expMaskRect = globalScene.make
      .graphics({})
      .setScale(6)
      .fillStyle(0xffffff)
      .beginPath()
      .fillRect(127, 126, 85, 2);

    const expMask = expMaskRect.createGeometryMask();

    expBar.setMask(expMask);

    this.expBar = expBar;
    this.expMaskRect = expMaskRect;
  }

  override initInfo(pokemon: PlayerPokemon): void {
    super.initInfo(pokemon);
    this.setHpNumbers(pokemon.hp, pokemon.getMaxHp());
    this.expMaskRect.x = (pokemon.levelExp / getLevelTotalExp(pokemon.level, pokemon.species.growthRate)) * 510;
    this.lastExp = pokemon.exp;
    this.lastLevelExp = pokemon.levelExp;

    this.statValuesContainer.setPosition(8, 7);
  }
  override setMini(mini: boolean): void {
    if (this.mini === mini) {
      return;
    }

    this.mini = mini;

    this.box.setTexture(this.getTextureName());
    this.statsBox.setTexture(`${this.getTextureName()}_stats`);

    if (this.player) {
      this.y -= 12 * (mini ? 1 : -1);
      this.baseY = this.y;
    }

    const offsetElements = [
      this.nameText,
      this.genderText,
      this.teraIcon,
      this.splicedIcon,
      this.shinyIcon,
      this.statusIndicator,
      this.levelContainer,
    ];
    offsetElements.forEach(el => (el.y += 1.5 * (mini ? -1 : 1)));

    [this.type1Icon, this.type2Icon, this.type3Icon].forEach(el => {
      el.x += 4 * (mini ? 1 : -1);
      el.y += -8 * (mini ? 1 : -1);
    });

    this.statValuesContainer.x += 2 * (mini ? 1 : -1);
    this.statValuesContainer.y += -7 * (mini ? 1 : -1);

    const toggledElements = [this.hpNumbersContainer, this.expBar];
    toggledElements.forEach(el => el.setVisible(!mini));
  }

  protected override onHpTweenUpdate(pokemon: PlayerPokemon): void {
    const tweenHp = Math.ceil(this.hpBar.scaleX * pokemon.getMaxHp());
    this.setHpNumbers(tweenHp, pokemon.getMaxHp());
    this.lastHp = tweenHp;
    this.updateHpFrame();
  }

  async updatePokemonExp(pokemon: PlayerPokemon, instant?: boolean, levelDurationMultiplier = 1): Promise<void> {
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

  override async updateInfo(pokemon: PlayerPokemon, instant?: boolean): Promise<void> {
    await super.updateInfo(pokemon, instant);
    const isLevelCapped = pokemon.level >= globalScene.getMaxExpLevel();
    const oldLevelCapped = this.lastLevelCapped;
    this.lastLevelCapped = isLevelCapped;

    if (this.lastExp !== pokemon.exp || this.lastLevel !== pokemon.level) {
      const durationMultipler = Math.max(
        Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn")(1 - Math.min(pokemon.level - this.lastLevel, 10) / 10),
        0.1,
      );
      await this.updatePokemonExp(pokemon, false, durationMultipler);
    } else if (isLevelCapped !== oldLevelCapped) {
      this.setLevel(pokemon.level);
    }
  }

  /**
   * Set the HP numbers text, that is the "HP/Max HP" text that appears below the player's health bar.
   * @param hp - The current HP of the player.
   * @param maxHp - The maximum HP of the player.
   */
  setHpNumbers(hp: number, maxHp: number): void {
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
