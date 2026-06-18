import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { getLevelRelExp, getLevelTotalExp } from "#data/exp";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { Stat } from "#enums/stat";
import type { PlayerPokemon } from "#field/pokemon";
import type { BattleInfoParamList } from "#ui/battle-info";
import { BattleInfo } from "#ui/battle-info";
import { getLocalizedSpriteKey } from "#utils/common";

const EXP_BAR_WIDTH = 510;

export class PlayerBattleInfo extends BattleInfo {
  protected player: true = true;
  protected hpNumbersContainer: Phaser.GameObjects.Container;
  protected expBarLabel: Phaser.GameObjects.Image;

  override get statOrder(): Stat[] {
    return [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD];
  }

  override getTextureName(): string {
    return this.mini ? "pbinfo_player_mini" : "pbinfo_player";
  }

  override constructTypeIcons(): void {
    this.type1Icon = globalScene.add.sprite(-139, -17, "pbinfo_player_type1").setName("icon_type_1").setOrigin(0);
    this.type2Icon = globalScene.add.sprite(-139, -1, "pbinfo_player_type2").setName("icon_type_2").setOrigin(0);
    this.type3Icon = globalScene.add.sprite(-154, -17, "pbinfo_player_type").setName("icon_type_3").setOrigin(0);
    this.add([this.type1Icon, this.type2Icon, this.type3Icon]);
  }

  constructor() {
    const posParams: BattleInfoParamList = {
      nameTextX: -115,
      nameTextY: -15.2,
      levelContainerX: -41,
      levelContainerY: -10,
      hpBarX: -61,
      hpBarY: -1,
      statBox: {
        xOffset: 8,
        paddingX: 4,
        statOverflow: 1,
      },
    };
    super(Math.floor(globalScene.scaledCanvas.width) - 10, -72, true, posParams);

    this.hpNumbersContainer = globalScene.add.container(-15, 10).setName("container_hp");

    // hp number container must be beneath the stat container for overlay to display properly
    this.addAt(this.hpNumbersContainer, this.getIndex(this.statsContainer));

    const expBarLabel = globalScene.add
      .image(-91, 20, getLocalizedSpriteKey("overlay_exp_label"))
      .setName("overlay_exp_label")
      .setOrigin(1, 1);
    this.add(expBarLabel);

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

    this.expBarLabel = expBarLabel;
    this.expBar = expBar;
    this.expMaskRect = expMaskRect;
  }

  override initInfo(pokemon: PlayerPokemon): void {
    super.initInfo(pokemon);
    this.setHpNumbers(pokemon.hp, pokemon.getMaxHp());
    this.expMaskRect.x =
      (pokemon.levelExp / getLevelTotalExp(pokemon.level, pokemon.species.growthRate)) * EXP_BAR_WIDTH;

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

    const toggledElements = [this.hpNumbersContainer, this.expBarLabel, this.expBar];
    toggledElements.forEach(el => el.setVisible(!mini));
  }

  /**
   * Updates the Hp Number text (that is the "HP/Max HP" text that appears below the player's health bar)
   * while the health bar is tweening.
   * @param pokemon - The Pokemon the health bar belongs to.
   */
  protected override onHpTweenUpdate(pokemon: PlayerPokemon): void {
    const tweenHp = Math.ceil(this.hpBar.scaleX * pokemon.getMaxHp());
    this.setHpNumbers(tweenHp, pokemon.getMaxHp());
    this.lastHp = tweenHp;
    this.updateHpFrame();
  }

  /**
   * Update the Pokemon's level display to its current level, including EXP bar and level number.
   * @param pokemon - The Pokemon to update
   * @param lastLevel - The level the Pokemon was at before the update
   * @param lastLevelExp - The relative EXP the Pokemon had within its level before the update
   */
  public async updatePokemonExpDisplay(pokemon: PlayerPokemon, lastLevel: number, skip: boolean): Promise<void> {
    if (skip) {
      this.setLevelDisplay(pokemon.level);
      const relLevelExp = getLevelRelExp(pokemon.level + 1, pokemon.species.growthRate);
      this.expMaskRect.x = EXP_BAR_WIDTH * (relLevelExp === 0 ? 0 : pokemon.levelExp / relLevelExp);
      return;
    }

    for (let level = lastLevel + 1; level <= pokemon.level; level++) {
      await this.doUpdateExpAnimation(pokemon, level, true);
    }

    await this.doUpdateExpAnimation(pokemon, pokemon.level, false);
  }

  public override async updateInfo(pokemon: PlayerPokemon, instant?: boolean): Promise<void> {
    await super.updateInfo(pokemon, instant);
    this.updatePokemonExpDisplay(pokemon, pokemon.level, true);
  }

  /**
   * Calculate the duration multiplier for the EXP bar animation based on the current and final levels.
   * The smaller the difference, the greater the multiplier (i.e. the longer the animation).
   * @param currentLevel - The visible level on the Pokemon before this animation
   * @param finalLevel - The final level of the Pokemon after all EXP has been applied
   * @returns The numerical multiplier
   */
  private getLevelDurationMultiplier(currentLevel: number, finalLevel: number): number {
    return Math.max(
      Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn")(1 - Math.min(finalLevel - currentLevel, 10) / 10),
      0.1,
    );
  }

  /**
   * Execute the level up animation for the Pokemon's EXP bar.
   *
   * A single invocation of this method allows either one level increase or
   * an increase in EXP level without a level up.
   * @param pokemon - The Pokemon whose level is changing
   * @param levelDurationMultiplier - A multiplier used in calculating the duration of the level increase
   * @param level - The level to increase to (or the current level, if not leveling up)
   * @param levelUp - Whether this invocation is a level up
   * @returns A promise that resolves when the animation is complete
   */
  public async doUpdateExpAnimation(pokemon: PlayerPokemon, level: number, levelUp: boolean): Promise<void> {
    const lastLevel = levelUp ? level - 1 : level;
    const relLevelExp = getLevelRelExp(lastLevel + 1, pokemon.species.growthRate);
    const levelExp = levelUp ? relLevelExp : pokemon.levelExp;
    const ratio = relLevelExp === 0 ? 0 : levelExp / relLevelExp;
    const nextWidth = ratio * EXP_BAR_WIDTH;
    const speed = globalScene.expGainsSpeed;

    const durationMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(
      1 - Math.max(lastLevel - 100, 0) / 150,
    );

    const levelDurationMultiplier = this.getLevelDurationMultiplier(lastLevel, pokemon.level);
    let duration = this.visible
      ? ratio * BattleInfo.EXP_GAINS_DURATION_BASE * durationMultiplier * levelDurationMultiplier
      : 0;
    if (speed && speed >= ExpGainsSpeed.DEFAULT) {
      duration = speed >= ExpGainsSpeed.SKIP ? ExpGainsSpeed.DEFAULT : duration / Math.pow(2, speed);
    }
    if (duration) {
      audioManager.playSound("se/exp");
    }
    return new Promise(resolve => {
      globalScene.tweens.add({
        targets: this.expMaskRect,
        ease: "Sine.easeIn",
        x: nextWidth,
        duration,
        onComplete: () => {
          if (!globalScene) {
            return resolve();
          }
          if (duration) {
            globalScene.sound.stopByKey("se/exp");
          }
          if (levelUp) {
            audioManager.playSound("se/level_up");
            this.setLevelDisplay(level);
            globalScene.time.delayedCall(500 * levelDurationMultiplier, () => {
              this.expMaskRect.x = 0;
              resolve();
            });
            return;
          }
          resolve();
        },
      });
    });
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

  /**
   * Set the level numbers container to display the provided level
   *
   * Overrides the default implementation to handle displaying level capped numbers in red.
   * @param level - The level to display
   */
  public override setLevelDisplay(level: number): void {
    super.setLevelDisplay(level, level >= globalScene.getMaxExpLevel() ? "numbers_red" : "numbers");
  }
}
