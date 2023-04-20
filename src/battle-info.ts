import { default as Pokemon } from './pokemon';
import { getLevelTotalExp, getLevelRelExp } from './exp';
import * as Utils from './utils';
import { addTextObject, TextStyle } from './text';
import { getGenderSymbol, getGenderColor } from './gender';
import { StatusEffect } from './status-effect';
import BattleScene from './battle-scene';

export default class BattleInfo extends Phaser.GameObjects.Container {
  private player: boolean;
  private lastName: string;
  private lastStatus: StatusEffect;
  private lastHp: integer;
  private lastMaxHp: integer;
  private lastHpFrame: string;
  private lastExp: integer;
  private lastLevelExp: integer;
  private lastLevel: integer;

  private nameText: Phaser.GameObjects.Text;
  private genderText: Phaser.GameObjects.Text;
  private ownedIcon: Phaser.GameObjects.Image;
  private statusIndicator: Phaser.GameObjects.Sprite;
  private levelContainer: Phaser.GameObjects.Container;
  private hpBar: Phaser.GameObjects.Image;
  private levelNumbersContainer: Phaser.GameObjects.Container;
  private hpNumbersContainer: Phaser.GameObjects.Container;
  private expBar: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, player: boolean) {
    super(scene, x, y);
    this.player = player;
    this.lastName = null;
    this.lastStatus = StatusEffect.NONE;
    this.lastHp = -1;
    this.lastMaxHp = -1;
    this.lastHpFrame = null;
    this.lastExp = -1;
    this.lastLevelExp = -1;
    this.lastLevel = -1;

    // Initially invisible and shown via Pokemon.showInfo
    this.setVisible(false);

    const box = this.scene.add.image(0, 0, `pbinfo_${player ? 'player' : 'enemy'}`);
    box.setOrigin(1, 0.5);
    this.add(box);

    this.nameText = addTextObject(this.scene, player ? -115 : -124, player ? -15.2 : -11.2, '', TextStyle.BATTLE_INFO);
    this.nameText.setOrigin(0, 0);
    this.add(this.nameText);

    this.genderText = addTextObject(this.scene, 0, 0, '', TextStyle.BATTLE_INFO);
    this.genderText.setOrigin(0, 0);
    this.genderText.setPositionRelative(this.nameText, 0, 2);
    this.add(this.genderText);

    if (!this.player) {
      this.ownedIcon = this.scene.add.image(0, 0, 'icon_owned');
      this.ownedIcon.setVisible(false);
      this.ownedIcon.setOrigin(0, 0);
      this.ownedIcon.setPositionRelative(this.nameText, 0, 11.5);
      this.add(this.ownedIcon);
    }

    this.statusIndicator = this.scene.add.sprite(0, 0, 'statuses');
    this.statusIndicator.setVisible(false);
    this.statusIndicator.setOrigin(0, 0);
    this.statusIndicator.setPositionRelative(this.nameText, 0, 11.5);
    this.add(this.statusIndicator);

    this.levelContainer = this.scene.add.container(player ? -41 : -50, player ? -10 : -5);
    this.add(this.levelContainer);

    const levelOverlay = this.scene.add.image(0, 0, 'overlay_lv');
    this.levelContainer.add(levelOverlay);

    this.hpBar = this.scene.add.image(player ? -61 : -71, player ? -1 : 4.5, 'overlay_hp');
    this.hpBar.setOrigin(0);
    this.add(this.hpBar);

    this.levelNumbersContainer = this.scene.add.container(9.5, 0);
    this.levelContainer.add(this.levelNumbersContainer);

    if (this.player) {
      this.hpNumbersContainer = this.scene.add.container(-15, 10);
      this.add(this.hpNumbersContainer);

      const expBar = this.scene.add.image(-98, 18, 'overlay_exp');
      expBar.setOrigin(0);
      expBar.setScale(0, 1);
      this.add(expBar);

      this.expBar = expBar;
    }
  }

  initInfo(pokemon: Pokemon) {
    this.nameText.setText(pokemon.name);
    this.lastName = pokemon.name;

    const nameSizeTest = addTextObject(this.scene, 0, 0, pokemon.name, TextStyle.BATTLE_INFO);
    const nameTextWidth = nameSizeTest.displayWidth;
    nameSizeTest.destroy();

    this.genderText.setText(getGenderSymbol(pokemon.gender));
    this.genderText.setColor(getGenderColor(pokemon.gender));
    this.genderText.setPositionRelative(this.nameText, nameTextWidth, 0);

    if (!this.player) {
      const speciesOwned = !!pokemon.scene.gameData.getDefaultDexEntry(pokemon.species)?.entry?.caught;
      this.ownedIcon.setVisible(speciesOwned);
      if (!pokemon.scene.gameData.getPokemonDexEntry(pokemon).caught)
        this.ownedIcon.setTint(0x808080);
    }

    this.hpBar.setScale(pokemon.getHpRatio(), 1);
    if (this.player)
      this.setHpNumbers(pokemon.hp, pokemon.getMaxHp());
    this.lastHp = pokemon.hp;
    this.lastHpFrame = this.hpBar.scaleX > 0.5 ? 'high' : this.hpBar.scaleX > 0.25 ? 'medium' : 'low';
    this.lastMaxHp = pokemon.getMaxHp();

    this.setLevel(pokemon.level);
    this.lastLevel = pokemon.level;

    if (this.player) {
      this.expBar.setScale(pokemon.levelExp / getLevelTotalExp(pokemon.level, pokemon.species.growthRate), 1);
      this.lastExp = pokemon.exp;
      this.lastLevelExp = pokemon.levelExp;
    }
  }

  updateInfo(pokemon: Pokemon, instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene) {
        resolve();
        return;
      }

      if (this.lastName !== pokemon.species.name) {
        this.nameText.setText(pokemon.name);
        this.lastName = pokemon.name;

        const nameSizeTest = addTextObject(this.scene, 0, 0, pokemon.name, TextStyle.BATTLE_INFO);
        const nameTextWidth = nameSizeTest.displayWidth;
        nameSizeTest.destroy();

        this.genderText.setPositionRelative(this.nameText, nameTextWidth, 0);
      }

      if (this.lastStatus !== (pokemon.status?.effect || StatusEffect.NONE)) {
        this.lastStatus = pokemon.status?.effect || StatusEffect.NONE;

        if (this.lastStatus !== StatusEffect.NONE)
          this.statusIndicator.setFrame(StatusEffect[this.lastStatus].toLowerCase());
        this.statusIndicator.setVisible(!!this.lastStatus);
        
        if (!this.player && this.ownedIcon.visible)
          this.ownedIcon.setAlpha(this.statusIndicator.visible ? 0 : 1);
      }

      const updatePokemonHp = () => {
        const duration = !instant ? Utils.clampInt(Math.abs((this.lastHp) - pokemon.hp) * 5, 250, 5000) : 0;
        this.scene.tweens.add({
          targets: this.hpBar,
          ease: 'Sine.easeOut',
          scaleX: pokemon.getHpRatio(),
          duration: duration,
          onUpdate: () => {
            if (this.player && this.lastHp !== pokemon.hp) {
              const tweenHp = Math.ceil(this.hpBar.scaleX * pokemon.getMaxHp());
              this.setHpNumbers(tweenHp, pokemon.getMaxHp())
              this.lastHp = tweenHp;
            }

            const hpFrame = this.hpBar.scaleX > 0.5 ? 'high' : this.hpBar.scaleX > 0.25 ? 'medium' : 'low';
            if (hpFrame !== this.lastHpFrame) {
              this.hpBar.setFrame(hpFrame);
              this.lastHpFrame = hpFrame;
            }
          },
          onComplete: () => {
            resolve();
          }
        });
        if (!this.player)
          this.lastHp = pokemon.hp;
        this.lastMaxHp = pokemon.getMaxHp();
      };

      if (this.player && (this.lastExp !== pokemon.exp || this.lastLevel !== pokemon.level)) {
        const originalResolve = resolve;
        resolve = () => this.updatePokemonExp(pokemon).then(() => originalResolve());
      }

      if (this.lastHp !== pokemon.hp || this.lastMaxHp !== pokemon.getMaxHp()) {
        updatePokemonHp();
        return;
      } else if (!this.player && this.lastLevel !== pokemon.level) {
        this.setLevel(pokemon.level);
        this.lastLevel = pokemon.level;
      }

      resolve();
    });
  }

  updatePokemonExp(battler: Pokemon, instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      const levelUp = this.lastLevel < battler.level;
      const relLevelExp = getLevelRelExp(this.lastLevel + 1, battler.species.growthRate);
      const levelExp = levelUp ? relLevelExp : battler.levelExp;
      let ratio = relLevelExp ? levelExp / relLevelExp : 0;
      if (this.lastLevel >= 100) {
        if (levelUp)
          ratio = 1;
        instant = true;
      }
      let duration = this.visible && !instant ? ((levelExp - this.lastLevelExp) / relLevelExp) * 1650 : 0;
      if (duration)
        this.scene.sound.play('exp');
      this.scene.tweens.add({
        targets: this.expBar,
        ease: 'Sine.easeIn',
        scaleX: ratio,
        duration: duration,
        onUpdate: () => {
          if (this.player && this.lastHp !== battler.hp) {
            const tweenHp = Math.ceil(this.hpBar.scaleX * battler.getMaxHp());
            this.setHpNumbers(tweenHp, battler.getMaxHp());
            this.lastHp = tweenHp;
          }

          const hpFrame = this.hpBar.scaleX > 0.5 ? 'high' : this.hpBar.scaleX > 0.25 ? 'medium' : 'low';
          if (hpFrame !== this.lastHpFrame) {
            this.hpBar.setFrame(hpFrame);
            this.lastHpFrame = hpFrame;
          }
        },
        onComplete: () => {
          if (!this.scene) {
            resolve();
            return;
          }
          if (duration)
            this.scene.sound.stopByKey('exp');
          if (ratio === 1) {
            this.lastLevelExp = 0;
            this.lastLevel++;
            this.scene.sound.play('level_up');
            this.setLevel(this.lastLevel);
            this.scene.time.delayedCall(500, () => {
              this.expBar.setScale(0, 1);
              this.updateInfo(battler, instant).then(() => resolve());
            });
            return;
          } else {
            this.lastExp = battler.exp;
            this.lastLevelExp = battler.levelExp;
          }
          resolve();
        }
      });
    });
  }

  setLevel(level: integer) {
    this.levelNumbersContainer.removeAll(true);
    const levelStr = level.toString();
    for (let i = 0; i < levelStr.length; i++)
      this.levelNumbersContainer.add(this.scene.add.image(i * 8, 0, 'numbers', levelStr[i]));
    this.levelContainer.setX((this.player ? -41 : -50) - 8 * Math.max(levelStr.length - 3, 0));
  }

  setHpNumbers(hp: integer, maxHp: integer) {
    if (!this.player || !this.scene)
      return;
    this.hpNumbersContainer.removeAll(true);
    const hpStr = hp.toString();
    const maxHpStr = maxHp.toString();
    let offset = 0;
    for (let i = maxHpStr.length - 1; i >= 0; i--)
      this.hpNumbersContainer.add(this.scene.add.image(offset++ * -8, 0, 'numbers', maxHpStr[i]));
    this.hpNumbersContainer.add(this.scene.add.image(offset++ * -8, 0, 'numbers', '/'));
    for (let i = hpStr.length - 1; i >= 0; i--)
      this.hpNumbersContainer.add(this.scene.add.image(offset++ * -8, 0, 'numbers', hpStr[i]));
  }
}

export class PlayerBattleInfo extends BattleInfo {
  constructor(scene: Phaser.Scene) {
    super(scene, Math.floor(scene.game.canvas.width / 6) - 10, -72, true);
  }
}

export class EnemyBattleInfo extends BattleInfo {
  constructor(scene: Phaser.Scene) {
    super(scene, 140, -141, false);
  }
}