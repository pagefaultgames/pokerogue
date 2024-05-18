import Pokemon from "#app/field/pokemon.js";
import { addTextObject, TextStyle } from "./text";
import * as Utils from '../utils';

export default class BattleFlyout extends Phaser.GameObjects.Container {
  private player: boolean;
  private mini: boolean;
  private boss: boolean;
  private offset: boolean;
  
  private translationX = 100;
  private anchorX: number;
  private anchorY: number;

  private flyoutParent: Phaser.GameObjects.Container;
  private flyoutContainer: Phaser.GameObjects.Container;

  private flyoutPlaceholder: Phaser.GameObjects.Rectangle;
  private flyoutTextPlaceholder: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, player: boolean) {
    super(scene, x, y);    
    this.player = player;
    this.mini = !player;
    this.boss = false;
    this.offset = false;

    // Initially invisible and shown via Pokemon.showInfo
    this.setVisible(false);
    this.setDepth(-15);

    this.anchorX = this.player ? -130 : 0;
    this.anchorY = this.player ? -18.5 : -13;

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.flyoutParent.setDepth(-15);

    this.add(this.flyoutParent);

    this.flyoutContainer = this.scene.add.container(this.player ? -75 : 0, 0);
    
    this.flyoutParent.add(this.flyoutContainer);

    /* const color = this.player ? 0x00FF00 : 0xFF0000;
    const maxX =  22 * (this.player ? -1 : 1);
    this.flyoutContainer.add(this.scene.add.rectangle(   0,  0, 1, 1, color - 200, 0.75).setOrigin(0.5, 0.5));
    this.flyoutContainer.add(this.scene.add.rectangle(maxX,  0, 1, 1, color, 0.75).setOrigin(0.5, 0.5));
    this.flyoutContainer.add(this.scene.add.rectangle(   0, 22, 1, 1, color, 0.75).setOrigin(0.5, 0.5));
    this.flyoutContainer.add(this.scene.add.rectangle(maxX, 22, 1, 1, color + 200, 0.75).setOrigin(0.5, 0.5)); */

    this.flyoutPlaceholder = this.scene.add.rectangle(0, 0, 75, 22, 0xFFFFFF, 0.5);
    this.flyoutPlaceholder.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutPlaceholder);

    this.flyoutTextPlaceholder = addTextObject(this.scene, 5, 0, `Text Goes\nHere!`, TextStyle.BATTLE_INFO);
    this.flyoutTextPlaceholder.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextPlaceholder);

    // Sets up the mask that hides the description text to give an illusion of scrolling
    const flyoutMaskRect = this.scene.make.graphics({fillStyle: {color: 0xFFFFFF, alpha: 0.75}});
    //flyoutMaskRect.setScale(6);
    flyoutMaskRect.beginPath();
    flyoutMaskRect.fillRect(this.flyoutParent.getWorldTransformMatrix().tx, this.flyoutParent.getWorldTransformMatrix().ty * -1, 100, 50);

    //this.flyoutContainer.setMask(this.flyoutContainer.createGeometryMask(flyoutMaskRect));
  }

  initInfo(pokemon: Pokemon) {
    this.name = `Flyout ${pokemon.name}`;
    this.flyoutParent.name = `Flyout Parent ${pokemon.name}`;
  }

  setMini(mini: boolean): void {
    if (this.mini === mini)
      return;

    this.mini = mini;

    if (this.player)
      this.y -= 12 * (mini ? 1 : -1);
  }

  setOffset(offset: boolean): void {
    if (this.offset === offset)
      return;
    
    this.offset = offset;

    this.x += 10 * (this.offset === this.player ? 1 : -1);
    this.y += 27 * (this.offset ? 1 : -1);
  }

  toggleFlyout(visible: boolean): void {
    this.scene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX + (this.player ? this.translationX : -this.translationX),
      duration: Utils.fixedInt(125),
      ease: 'Sine.easeInOut',
      alpha: visible ? 1 : 0,
    });
  }
}

export class PlayerBattleFlyout extends BattleFlyout {
  constructor(scene: Phaser.Scene) {
    super(scene, Math.floor(scene.game.canvas.width / 6) - 10, -72, true);
  }
}

export class EnemyBattleFlyout extends BattleFlyout {
  constructor(scene: Phaser.Scene) {
    super(scene, 140, -141, false);
  }

  setMini(mini: boolean): void { } // Always mini
}