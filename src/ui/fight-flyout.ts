import { addTextObject, TextStyle } from "./text";
import * as Utils from '../utils';
import BattleScene from "#app/battle-scene.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { WeatherType } from "#app/data/weather.js";
import { TerrainType } from "#app/data/terrain.js";
import { addWindow } from "./ui-theme";

export default class FightFlyout extends Phaser.GameObjects.Container {  
  private flyoutWidth = 160;
  private flyoutHeight = 55;

  private translationX: number;
  private anchorX: number;
  private anchorY: number;

  private flyoutParent: Phaser.GameObjects.Container;
  private flyoutContainer: Phaser.GameObjects.Container;

  private flyoutWindow: Phaser.GameObjects.NineSlice;

  private flyoutTextPlayer: Phaser.GameObjects.Text;
  private flyoutTextEnemy: Phaser.GameObjects.Text;
  private flyoutTextAll: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);   

    this.translationX = this.flyoutWidth;
    this.anchorX = 0;
    this.anchorY = -102;

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    this.flyoutContainer = this.scene.add.container(0, 0);
    this.flyoutParent.add(this.flyoutContainer);

    this.flyoutWindow = addWindow(this.scene as BattleScene, 0, 0, this.flyoutWidth, this.flyoutHeight);
    this.flyoutContainer.add(this.flyoutWindow);

    this.flyoutTextPlayer = addTextObject(this.scene, 8, 7, `Player Effects:`, TextStyle.BATTLE_INFO);
    this.flyoutTextPlayer.setFontSize(48);
    this.flyoutTextPlayer.setAlign('left');
    this.flyoutTextPlayer.setOrigin(0, 0);    

    this.flyoutContainer.add(this.flyoutTextPlayer);

    this.flyoutTextEnemy = addTextObject(this.scene, this.flyoutWidth - 8, 7, `Enemy Effects:`, TextStyle.BATTLE_INFO);
    this.flyoutTextEnemy.setFontSize(48);
    this.flyoutTextEnemy.setAlign('right');
    this.flyoutTextEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextEnemy);

    this.flyoutTextAll = addTextObject(this.scene, this.flyoutWidth / 2, 7, `All Effects:`, TextStyle.BATTLE_INFO);
    this.flyoutTextAll.setFontSize(48);
    this.flyoutTextAll.setAlign('center');
    this.flyoutTextAll.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextAll);

    this.name = `Fight Flyout`;
    this.flyoutParent.name = `Fight Flyout Parent`;
  }

  private formatText(unformattedText: string): string {
    const text = unformattedText.split('_');
    for (let i = 0; i < text.length; i++)
      text[i] = text[i].charAt(0).toUpperCase() + text[i].substring(1).toLowerCase();

    return text.join(' ');
  }

  private setText(battleScene: BattleScene, textObject: Phaser.GameObjects.Text, tagSide: ArenaTagSide): void {
    let tags = '';
    battleScene.arena.findTagsOnSide(() => true, tagSide).sort((a, b) => a.turnCount - b.turnCount).forEach(
      tag => {
        tags += this.formatText(tag.tagType);
        if (tag.turnCount > 0 && tag.turnCount < 15) // Don't add tags with infinite duration
          tags += ' - ' + tag.turnCount 
        tags += '\n'});
    
    textObject.text += tags;
  }

  toggleFlyout(visible: boolean): void {
    this.scene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: Utils.fixedInt(125),
      ease: 'Sine.easeInOut',
      alpha: visible ? 1 : 0,
    });

    const battleScene = this.scene as BattleScene;
    if (!battleScene)
      return;

    this.flyoutTextPlayer.text = `Player Effects\n`;
    this.flyoutTextEnemy.text = `Enemy Effects\n`;

    this.setText(battleScene, this.flyoutTextPlayer, ArenaTagSide.PLAYER);
    this.setText(battleScene, this.flyoutTextEnemy, ArenaTagSide.ENEMY);

    this.flyoutTextAll.text = `Field Effects\n`;

    if (battleScene.arena.weather)
      this.flyoutTextAll.text += 
        this.formatText(WeatherType[battleScene.arena.weather.weatherType]) + ' - ' + battleScene.arena.weather.turnsLeft + '\n';
    if (battleScene.arena.terrain)
      this.flyoutTextAll.text += 
        this.formatText(TerrainType[battleScene.arena.terrain.terrainType]) + ' - ' + battleScene.arena.terrain.turnsLeft + '\n';
  }
}