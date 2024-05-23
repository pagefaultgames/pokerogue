import { addTextObject, TextStyle } from "./text";
import * as Utils from '../utils';
import BattleScene, { TurnEndEvent } from "#app/battle-scene.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { WeatherType } from "#app/data/weather.js";
import { TerrainType } from "#app/data/terrain.js";
import { addWindow } from "./ui-theme";
import { TerrainChangedEvent, WeatherChangedEvent } from "#app/field/arena.js";
import { ArenaTagType } from "#app/data/enums/arena-tag-type.js";

interface FieldEffectInfo {
  type: string;

  maxDuration: number;
  duration: number;
}
export default class FightFlyout extends Phaser.GameObjects.Container {  
  private battleScene: BattleScene;

  private flyoutWidth = 160;
  private flyoutHeight = 55;

  private translationX: number;
  private anchorX: number;
  private anchorY: number;

  private flyoutParent: Phaser.GameObjects.Container;
  private flyoutContainer: Phaser.GameObjects.Container;

  private flyoutWindow: Phaser.GameObjects.NineSlice;

  private flyoutTextHeaderPlayer: Phaser.GameObjects.Text;
  private flyoutTextHeaderEnemy: Phaser.GameObjects.Text;
  private flyoutTextHeaderField: Phaser.GameObjects.Text;

  private flyoutTextPlayer: Phaser.GameObjects.Text;
  private flyoutTextEnemy: Phaser.GameObjects.Text;
  private flyoutTextField: Phaser.GameObjects.Text;

  private readonly fieldEffectInfo: FieldEffectInfo[] = new Array();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);   
    this.battleScene = this.scene as BattleScene;

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

    this.flyoutTextHeaderPlayer = addTextObject(this.scene, 8, 7, `Player Effects`, TextStyle.SUMMARY_BLUE);
    this.flyoutTextHeaderPlayer.setFontSize(54);
    this.flyoutTextHeaderPlayer.setAlign('left');
    this.flyoutTextHeaderPlayer.setOrigin(0, 0);    

    this.flyoutContainer.add(this.flyoutTextHeaderPlayer);

    this.flyoutTextHeaderField = addTextObject(this.scene, this.flyoutWidth / 2, 7, `Field Effects`, TextStyle.SUMMARY_GREEN);
    this.flyoutTextHeaderField.setFontSize(54);
    this.flyoutTextHeaderField.setAlign('center');
    this.flyoutTextHeaderField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderField);

    this.flyoutTextHeaderEnemy = addTextObject(this.scene, this.flyoutWidth - 8, 7, `Enemy Effects`, TextStyle.SUMMARY_RED);
    this.flyoutTextHeaderEnemy.setFontSize(54);
    this.flyoutTextHeaderEnemy.setAlign('right');
    this.flyoutTextHeaderEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderEnemy);

    this.flyoutTextPlayer = addTextObject(this.scene, 8, 15, '', TextStyle.BATTLE_INFO);
    this.flyoutTextPlayer.setFontSize(48);
    this.flyoutTextPlayer.setAlign('left');
    this.flyoutTextPlayer.setOrigin(0, 0);    

    this.flyoutContainer.add(this.flyoutTextPlayer);

    this.flyoutTextField = addTextObject(this.scene, this.flyoutWidth / 2, 15, '', TextStyle.BATTLE_INFO);
    this.flyoutTextField.setFontSize(48);
    this.flyoutTextField.setAlign('center');
    this.flyoutTextField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextField);

    this.flyoutTextEnemy = addTextObject(this.scene, this.flyoutWidth - 8, 15, '', TextStyle.BATTLE_INFO);
    this.flyoutTextEnemy.setFontSize(48);
    this.flyoutTextEnemy.setAlign('right');
    this.flyoutTextEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextEnemy);

    this.name = `Fight Flyout`;
    this.flyoutParent.name = `Fight Flyout Parent`;

    this.battleScene.eventTarget.addEventListener('onNewArena', (e) => this.onNewArena(e));
    this.battleScene.eventTarget.addEventListener('onTurnEnd', (e) => this.onTurnEnd(e));
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

  updateFieldText() {
    this.flyoutTextField.text = '';

    for (let i = 0; i < this.fieldEffectInfo.length; i++) {
      const fieldEffectInfo = this.fieldEffectInfo[i];

      this.flyoutTextField.text += 
        this.formatText(fieldEffectInfo.type) + ' - ' + fieldEffectInfo.duration + '/' + fieldEffectInfo.maxDuration + '\n';
    }
  }

  onNewArena(event: Event) {
    this.fieldEffectInfo.length = 0;
    
    this.battleScene.arena.eventTarget.addEventListener('onWeatherChanged', (e) => this.onFieldEffectChanged(e));
    this.battleScene.arena.eventTarget.addEventListener('onTerrainChanged', (e) => this.onFieldEffectChanged(e));    
  }

  onFieldEffectChanged(event: Event) {
    const fieldEffectChangedEvent = event as WeatherChangedEvent | TerrainChangedEvent;
    if (!fieldEffectChangedEvent)
      return;

    const oldType = 
    fieldEffectChangedEvent instanceof WeatherChangedEvent 
      ? WeatherType[fieldEffectChangedEvent.oldWeatherType] 
      : TerrainType[fieldEffectChangedEvent.oldTerrainType];
    const newInfo = {
      type: 
        fieldEffectChangedEvent instanceof WeatherChangedEvent 
          ? WeatherType[fieldEffectChangedEvent.newWeatherType] 
          : TerrainType[fieldEffectChangedEvent.newTerrainType], 
      maxDuration: fieldEffectChangedEvent.duration, 
      duration: fieldEffectChangedEvent.duration};

    const foundIndex = this.fieldEffectInfo.findIndex(info => [newInfo.type, oldType].includes(info.type));
    if (foundIndex === -1)
      this.fieldEffectInfo.push(newInfo);
    else if (!newInfo.type)
      this.fieldEffectInfo.splice(foundIndex, 1)
    else
      this.fieldEffectInfo[foundIndex] = newInfo;

    this.updateFieldText();
  }
  
  onTurnEnd(event: Event) {
    const turnEndEvent = event as TurnEndEvent;
    if (!turnEndEvent)
      return;

    for (let i = 0; i < this.fieldEffectInfo.length; i++) {
      const fieldEffectInfo = this.fieldEffectInfo[i];
      
      --fieldEffectInfo.duration;
    }

    this.updateFieldText();
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

    this.flyoutTextPlayer.text = '';
    this.flyoutTextEnemy.text = '';

    this.setText(battleScene, this.flyoutTextPlayer, ArenaTagSide.PLAYER);
    this.setText(battleScene, this.flyoutTextEnemy, ArenaTagSide.ENEMY);
  }
}