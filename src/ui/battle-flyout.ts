import { default as Pokemon } from '../field/pokemon';
import { addTextObject, TextStyle } from "./text";
import * as Utils from '../utils';
import BattleScene, { MoveUsedEvent } from '#app/battle-scene.js';
import { UiTheme } from '#app/enums/ui-theme.js';
import Move from '#app/data/move.js';

interface MoveInfo {
  move: Move,

  maxPp: number,
  ppUsed: number,
}

export default class BattleFlyout extends Phaser.GameObjects.Container {
  private battleScene: BattleScene;

  private player: boolean;
  private mini: boolean;
  private boss: boolean;
  private offset: boolean;

  private pokemon: Pokemon;
  
  private flyoutWidth = 110;
  private flyoutHeight = 22;

  private translationX: number;
  private anchorX: number;
  private anchorY: number;

  private flyoutParent: Phaser.GameObjects.Container;
  private flyoutBox: Phaser.GameObjects.Sprite;

  private flyoutContainer: Phaser.GameObjects.Container;
  
  private flyoutText: Phaser.GameObjects.Text[] = new Array(4);
  private moveInfo: MoveInfo[] = new Array();

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
      this.flyoutText[i] = addTextObject(this.scene, 18 + 47 * (i % 2), 6 + 11 * (i < 2 ? 0 : 1), `???`, TextStyle.BATTLE_INFO);
      this.flyoutText[i].setFontSize(45);
      this.flyoutText[i].setLineSpacing(-10);
      this.flyoutText[i].setAlign('center');
      this.flyoutText[i].setOrigin();
    }

    this.flyoutContainer.add(this.flyoutText);
  }

  initInfo(pokemon: Pokemon) {
    this.pokemon = pokemon;

    this.name = `Flyout ${this.pokemon.name}`;
    this.flyoutParent.name = `Flyout Parent ${this.pokemon.name}`;

    this.battleScene.eventTarget.addEventListener('onMoveUsed', (e) => this.updateInfo(e));
  }

  setMini(mini: boolean): void {
    if (this.mini === mini)
      return;

    this.mini = mini;

    //if (this.player)
    //  this.y -= 12 * (mini ? 1 : -1);
  }

  setText() {
    for (let i = 0; i < this.flyoutText.length; i++) {
      const flyoutText = this.flyoutText[i];
      const moveInfo = this.moveInfo[i];
      
      if (!moveInfo)
        continue;

      const currentPp = Math.max(moveInfo.maxPp - moveInfo.ppUsed, 0);
      flyoutText.text = `${moveInfo.move.name}\n${currentPp}/${moveInfo.maxPp}`;
    }
  }

  updateInfo(event: Event) {
    const moveUsedEvent = event as MoveUsedEvent;
    if (!moveUsedEvent || moveUsedEvent.userIndex !== this.pokemon?.getBattlerIndex())
      return;

    const foundInfo = this.moveInfo.find(x => x?.move.id === moveUsedEvent.move.id)
    if (foundInfo)
      ++foundInfo.ppUsed;
    else
      this.moveInfo.push({move: moveUsedEvent.move, maxPp: moveUsedEvent.move.pp, ppUsed: 1})

    this.setText();
    console.log('Event!', moveUsedEvent.move.name, moveUsedEvent.userIndex);
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