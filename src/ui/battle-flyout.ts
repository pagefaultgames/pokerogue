import { default as Pokemon } from '../field/pokemon';
import { addTextObject, TextStyle } from "./text";
import * as Utils from '../utils';
import BattleScene, { MoveUsedEvent } from '#app/battle-scene.js';
import { UiTheme } from '#app/enums/ui-theme.js';
import { Move } from 'pokenode-ts';

interface MoveInfo {
  move: Move,
  ppUsed: number,
  maxPp: number,
}

export default class BattleFlyout extends Phaser.GameObjects.Container {
  private battleScene: BattleScene;

  private player: boolean;
  private mini: boolean;
  private boss: boolean;
  private offset: boolean;

  private pokemon: Pokemon;
  
  private flyoutWidth = 90;
  private flyoutHeight = 22;

  private translationX: number;
  private anchorX: number;
  private anchorY: number;

  private flyoutParent: Phaser.GameObjects.Container;
  private flyoutBox: Phaser.GameObjects.Sprite;

  private flyoutContainer: Phaser.GameObjects.Container;
  
  private flyoutText: Phaser.GameObjects.Text[] = new Array(4);

  constructor(scene: Phaser.Scene, player: boolean) {
    super(scene, 0, 0);
    this.battleScene = scene as BattleScene;

    this.player = player;
    this.mini = !player;
    this.boss = false;
    this.offset = false;     

    this.translationX = this.player ? -this.flyoutWidth : this.flyoutWidth;
    this.anchorX = -15 + (this.player ? -130 : -5);
    this.anchorY = -2.5 + (this.player ? -18.5 : -13);

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    this.flyoutBox = this.scene.add.sprite(0, 0, `pbinfo_enemy_mini_stats`);
    this.flyoutBox.setOrigin(0, 0);
    
    this.flyoutParent.add(this.flyoutBox);

    this.flyoutContainer = this.scene.add.container(28 + (this.player ? -this.flyoutWidth : 0), 2);
    this.flyoutParent.add(this.flyoutContainer);    

    for (let i = 0; i < 4; i++) {
      this.flyoutText[i] = addTextObject(this.scene, 50 * (i % 2), 13 * (i < 2 ? 0 : 1), `???`, TextStyle.BATTLE_INFO);
      this.flyoutText[i].setFontSize(52);
      this.flyoutText[i].setAlign('center');      
    }

    this.flyoutContainer.add(this.flyoutText);

    this.battleScene.eventTarget.addEventListener('onMoveUsed', this.updateInfo);
  }

  initInfo(pokemon: Pokemon) {
    this.pokemon = pokemon;

    this.name = `Flyout ${this.pokemon.name}`;
    this.flyoutParent.name = `Flyout Parent ${this.pokemon.name}`;

    for (let i = 0; i < 4; i++) {
      this.flyoutText[i].text = this.pokemon.moveset[i].getName();
    }
  }

  setMini(mini: boolean): void {
    if (this.mini === mini)
      return;

    this.mini = mini;

    //if (this.player)
    //  this.y -= 12 * (mini ? 1 : -1);
  }

  updateInfo(event: MoveUsedEvent) {
    console.log('Event!', event.move.name);
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