import BattleScene from "../battle-scene";
import Pokemon from "../field/pokemon";
import { TextStyle, addTextObject } from "./text";

const hiddenX = -118;
const shownX = 0;
const baseY = -116;

export default class AbilityBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private pokemonNameText: Phaser.GameObjects.Text;
  private abilityNameText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, hiddenX, baseY);
  }

  setup(): void {
    this.bg = this.scene.add.image(0, 0, 'ability_bar_left');
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

    (this.scene as BattleScene).fieldUI.bringToTop(this);

    if (this.tween)
      this.tween.stop();

    this.y = baseY + ((this.scene as BattleScene).currentBattle.double ? 14 : 0);
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