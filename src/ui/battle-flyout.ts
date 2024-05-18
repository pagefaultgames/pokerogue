import { EnemyPokemon, default as Pokemon } from '../field/pokemon';
import { addTextObject, TextStyle } from "./text";
import * as Utils from '../utils';

export default class BattleFlyout extends Phaser.GameObjects.Container {
  private player: boolean;
  private mini: boolean;
  private boss: boolean;
  private offset: boolean;
  
  private flyoutWidth = 75;
  private flyoutHeight = 22;

  private translationX: number;
  private anchorX: number;
  private anchorY: number;

  private flyoutParent: Phaser.GameObjects.Container;
  private flyoutContainer: Phaser.GameObjects.Container;

  private flyoutPlaceholder: Phaser.GameObjects.Rectangle;
  private flyoutTextPlaceholder: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: boolean) {
    super(scene, 0, 0);    
    this.player = player;
    this.mini = !player;
    this.boss = false;
    this.offset = false;     

    this.translationX = this.player ? -this.flyoutWidth : this.flyoutWidth;
    this.anchorX = this.player ? -130 : 0;
    this.anchorY = this.player ? -18.5 : -13;

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    this.flyoutContainer = this.scene.add.container(this.player ? -this.flyoutWidth : 0, 0);    
    this.flyoutParent.add(this.flyoutContainer);

    /* const color = this.player ? 0x00FF00 : 0xFF0000;
    const maxX =  22 * (this.player ? -1 : 1);
    this.flyoutContainer.add(this.scene.add.rectangle(   0,  0, 1, 1, color - 200, 0.75).setOrigin(0.5, 0.5));
    this.flyoutContainer.add(this.scene.add.rectangle(maxX,  0, 1, 1, color, 0.75).setOrigin(0.5, 0.5));
    this.flyoutContainer.add(this.scene.add.rectangle(   0, 22, 1, 1, color, 0.75).setOrigin(0.5, 0.5));
    this.flyoutContainer.add(this.scene.add.rectangle(maxX, 22, 1, 1, color + 200, 0.75).setOrigin(0.5, 0.5)); */

    this.flyoutPlaceholder = this.scene.add.rectangle(0, 0, this.flyoutWidth, this.flyoutHeight, 0xFFFFFF, 0.5);
    this.flyoutPlaceholder.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutPlaceholder);

    this.flyoutTextPlaceholder = addTextObject(this.scene, 5, 0, `Text Goes\nHere!`, TextStyle.BATTLE_INFO);
    this.flyoutTextPlaceholder.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextPlaceholder);
  }

  initInfo(pokemon: Pokemon) {
    this.name = `Flyout ${pokemon.name}`;
    this.flyoutParent.name = `Flyout Parent ${pokemon.name}`;
  }

  setMini(mini: boolean): void {
    if (this.mini === mini)
      return;

    this.mini = mini;

    //if (this.player)
    //  this.y -= 12 * (mini ? 1 : -1);
  }

  toggleFlyout(visible: boolean): void {
    this.scene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: Utils.fixedInt(125),
      ease: 'Sine.easeInOut',
      alpha: visible ? 1 : 0,
    });
  }
}