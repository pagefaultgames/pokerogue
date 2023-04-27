import BattleScene from "../battle-scene";
import Pokemon from "../pokemon";
import { TextStyle, addTextObject } from "./text";

const hiddenX = -91;
const shownX = 10;

export default class AbilityBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private pokemonNameText: Phaser.GameObjects.Text;
  private abilityNameText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, hiddenX, (-scene.game.canvas.height / 6) + 64);
  }

  setup(): void {
    this.bg = this.scene.add.image(0, 0, 'ability_bar');
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.pokemonNameText = addTextObject(this.scene, 5, 3, '', TextStyle.MESSAGE, { fontSize: '72px' });
    this.pokemonNameText.setOrigin(0, 0);
    this.add(this.pokemonNameText);

    this.abilityNameText = addTextObject(this.scene, 87, 16, '', TextStyle.WINDOW, { fontSize: '72px' });
    this.abilityNameText.setOrigin(1, 0);
    this.add(this.abilityNameText);

    this.setVisible(false);
    this.shown = false;
  }

  showAbility(pokemon: Pokemon): void {
    this.pokemonNameText.setText(`${pokemon.name}'s`);
    this.abilityNameText.setText(pokemon.getAbility().name);

    if (this.shown)
      return;

    if (this.tween)
      this.tween.stop();

    this.tween = this.scene.tweens.add({
      targets: this,
      x: shownX,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => this.tween = null
    });
   
    this.setVisible(true);
    this.shown = true;
  }

  hide(): void {
    if (!this.shown)
      return;

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