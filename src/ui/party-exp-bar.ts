import BattleScene from "../battle-scene";
import Pokemon from "../pokemon";
import { TextStyle, addTextObject } from "./text";

export default class PartyExpBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private pokemonIcon: Phaser.GameObjects.Sprite;
  private expText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, (scene.game.canvas.width / 6), -((scene.game.canvas.height) / 6) + 15);
  }

  setup(): void {
    this.bg = this.scene.add.nineslice(0, 0, 'party_exp_bar', null, 8, 18, 21, 5, 6, 4);
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.pokemonIcon = this.scene.add.sprite(3, 7, 'pokemon_icons_0');
    this.pokemonIcon.setOrigin(0, 0.5);
    this.pokemonIcon.setScale(0.5);
    this.add(this.pokemonIcon);

    this.expText = addTextObject(this.scene, 22, 4, '', TextStyle.BATTLE_INFO);
    this.expText.setOrigin(0, 0);
    this.add(this.expText);

    this.setVisible(false);
    this.shown = false;
  }

  showPokemonExp(pokemon: Pokemon, expValue: integer): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.shown)
        return resolve();

      this.pokemonIcon.setTexture(pokemon.getIconAtlasKey());
      this.pokemonIcon.play(pokemon.getIconKey()).stop();
      this.expText.setText(`+${expValue.toString()}`);

      this.bg.width = this.expText.displayWidth + 28;

      (this.scene as BattleScene).fieldUI.bringToTop(this);

      if (this.tween)
        this.tween.stop();

      this.tween = this.scene.tweens.add({
        targets: this,
        x: (this.scene.game.canvas.width / 6) - (this.bg.width - 5),
        duration: 500,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.tween = null;
          resolve();
        }
      });
    
      this.setVisible(true);
      this.shown = true;
    });
  }

  hide(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.shown)
        return resolve();

      if (this.tween)
        this.tween.stop();

      this.tween = this.scene.tweens.add({
        targets: this,
        x: (this.scene.game.canvas.width / 6),
        duration: 500,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this.tween = null;
          this.shown = false;
          this.setVisible(false);
          resolve();
        }
      });
    });
  }
}