import BattleScene from "../battle-scene";
import Pokemon from "../pokemon";
import { TextStyle, addTextObject } from "./text";

export default class AbilityBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private pokemonNameText: Phaser.GameObjects.Text;
  private abilityNameText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, -91, (-scene.game.canvas.height / 6) + 64);
  }

  setup(): void {
    this.bg = this.scene.add.image(0, 0, 'ability_bar');
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.pokemonNameText = addTextObject(this.scene, 5, 3, 'Pokemon', TextStyle.MESSAGE, { fontSize: '72px' });
    this.pokemonNameText.setOrigin(0, 0);
    this.add(this.pokemonNameText);

    this.abilityNameText = addTextObject(this.scene, 87, 16, 'Chlorophyll', TextStyle.WINDOW, { fontSize: '72px' });
    this.abilityNameText.setOrigin(1, 0);
    this.add(this.abilityNameText);

    this.setVisible(false);
    this.shown = false;
  }

  showAbility(pokemon: Pokemon) {
    this.pokemonNameText.setText(`${pokemon.name}'s`);
    this.abilityNameText.setText(pokemon.getAbility().name);

    if (this.tween)
      this.tween.stop();

    this.tween = this.scene.tweens.add({
      targets: this,
      x: 10,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => this.tween = null
    });

    this.setVisible(true);
    this.shown = true;
  }

  hide() {
    if (this.tween)
      this.tween.stop();

    this.tween = this.scene.tweens.add({
      targets: this,
      x: -91,
      duration: 500,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.tween = null;
        this.setVisible(false);
      }
    });

    this.shown = false;
  }
}