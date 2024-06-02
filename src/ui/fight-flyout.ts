import * as Utils from "../utils";
import { addTextObject, TextStyle } from "./text";
import BattleScene from "#app/battle-scene.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { WeatherType } from "#app/data/weather.js";
import { TerrainType } from "#app/data/terrain.js";
import { addWindow } from "./ui-theme";
import { ArenaEvent, ArenaEventType, TagAddedEvent, TagRemovedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#app/field/arena-events.js";
import { BattleSceneEventType, TurnEndEvent } from "#app/battle-scene-events.js";
import { ArenaTagType } from "#app/data/enums/arena-tag-type.js";

enum ArenaEffectType {
  PLAYER,
  FIELD,
  ENEMY,
}
interface ArenaEffectInfo {
  name: string;
  type: ArenaEffectType,

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

  private readonly fieldEffectInfo: ArenaEffectInfo[] = [];

  private onNewArenaEvent =  (event: Event) => this.onNewArena(event);
  private onTurnEndEvent =   (event: Event) => this.onTurnEnd(event);

  private onFieldEffectChangedEvent = (event: Event) => this.onFieldEffectChanged(event);

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

    this.flyoutTextHeaderPlayer = addTextObject(this.scene, 6, 5, "Player Field", TextStyle.SUMMARY_BLUE);
    this.flyoutTextHeaderPlayer.setFontSize(54);
    this.flyoutTextHeaderPlayer.setAlign("left");
    this.flyoutTextHeaderPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderPlayer);

    this.flyoutTextHeaderField = addTextObject(this.scene, this.flyoutWidth / 2, 5, "Field Effects", TextStyle.SUMMARY_GREEN);
    this.flyoutTextHeaderField.setFontSize(54);
    this.flyoutTextHeaderField.setAlign("center");
    this.flyoutTextHeaderField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderField);

    this.flyoutTextHeaderEnemy = addTextObject(this.scene, this.flyoutWidth - 6, 5, "Enemy Field", TextStyle.SUMMARY_RED);
    this.flyoutTextHeaderEnemy.setFontSize(54);
    this.flyoutTextHeaderEnemy.setAlign("right");
    this.flyoutTextHeaderEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderEnemy);

    this.flyoutTextPlayer = addTextObject(this.scene, 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextPlayer.setFontSize(48);
    this.flyoutTextPlayer.setAlign("left");
    this.flyoutTextPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextPlayer);

    this.flyoutTextField = addTextObject(this.scene, this.flyoutWidth / 2, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextField.setFontSize(48);
    this.flyoutTextField.setAlign("center");
    this.flyoutTextField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextField);

    this.flyoutTextEnemy = addTextObject(this.scene, this.flyoutWidth - 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextEnemy.setFontSize(48);
    this.flyoutTextEnemy.setAlign("right");
    this.flyoutTextEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextEnemy);

    this.name = "Fight Flyout";
    this.flyoutParent.name = "Fight Flyout Parent";

    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.TURN_END,  this.onTurnEndEvent);
  }

  private onNewArena(event: Event) {
    this.fieldEffectInfo.length = 0;

    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.WEATHER_CHANGED, this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.TERRAIN_CHANGED, this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.TAG_ADDED,       this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.TAG_REMOVED,     this.onFieldEffectChangedEvent);
  }

  private formatText(unformattedText: string): string {
    const text = unformattedText.split("_");
    for (let i = 0; i < text.length; i++) {
      text[i] = text[i].charAt(0).toUpperCase() + text[i].substring(1).toLowerCase();
    }

    return text.join(" ");
  }

  clearText() {
    this.flyoutTextPlayer.text = "";
    this.flyoutTextField.text = "";
    this.flyoutTextEnemy.text = "";
  }

  updateFieldText() {
    this.clearText();

    for (let i = 0; i < this.fieldEffectInfo.length; i++) {
      const fieldEffectInfo = this.fieldEffectInfo[i];

      let textObject: Phaser.GameObjects.Text;
      switch (fieldEffectInfo.type) {
      case ArenaEffectType.PLAYER:
        textObject = this.flyoutTextPlayer;
        break;

      case ArenaEffectType.FIELD:
        textObject = this.flyoutTextField;
        break;

      case ArenaEffectType.ENEMY:
        textObject = this.flyoutTextEnemy;
        break;
      }

      textObject.text += this.formatText(fieldEffectInfo.name);

      if (fieldEffectInfo.maxDuration !== 0) {
        textObject.text += "  " + fieldEffectInfo.duration + "/" + fieldEffectInfo.maxDuration;
      }

      textObject.text += "\n";
    }
  }

  private onFieldEffectChanged(event: Event) {
    const arenaEffectChangedEvent = event as ArenaEvent;
    if (!arenaEffectChangedEvent) {
      return;
    }

    let foundIndex: number;
    switch (arenaEffectChangedEvent.constructor) {
    case TagAddedEvent:
      const tagAddedEvent = arenaEffectChangedEvent as TagAddedEvent;
      this.fieldEffectInfo.push({
        name: ArenaTagType[tagAddedEvent.arenaTagType],
        type: tagAddedEvent.arenaTagSide === ArenaTagSide.BOTH
          ? ArenaEffectType.FIELD
          : tagAddedEvent.arenaTagSide === ArenaTagSide.PLAYER
            ? ArenaEffectType.PLAYER
            : ArenaEffectType.ENEMY,
        maxDuration: tagAddedEvent.duration,
        duration: tagAddedEvent.duration});
      break;
    case TagRemovedEvent:
      const tagRemovedEvent = arenaEffectChangedEvent as TagRemovedEvent;
      foundIndex = this.fieldEffectInfo.findIndex(info => info.name === ArenaTagType[tagRemovedEvent.arenaTagType]);
      if (foundIndex !== -1) {
        this.fieldEffectInfo.splice(foundIndex, 1);
      }
      break;

    case WeatherChangedEvent:
    case TerrainChangedEvent:
      const fieldEffectChangedEvent = arenaEffectChangedEvent as WeatherChangedEvent | TerrainChangedEvent;

      const oldType =
      fieldEffectChangedEvent instanceof WeatherChangedEvent
        ? WeatherType[fieldEffectChangedEvent.oldWeatherType]
        : TerrainType[fieldEffectChangedEvent.oldTerrainType];
      const newInfo = {
        name:
          fieldEffectChangedEvent instanceof WeatherChangedEvent
            ? WeatherType[fieldEffectChangedEvent.newWeatherType]
            : TerrainType[fieldEffectChangedEvent.newTerrainType],
        type: ArenaEffectType.FIELD,
        maxDuration: fieldEffectChangedEvent.duration,
        duration: fieldEffectChangedEvent.duration};

      foundIndex = this.fieldEffectInfo.findIndex(info => [newInfo.name, oldType].includes(info.name));
      if (foundIndex === -1) {
        if (newInfo.name !== undefined) {
          this.fieldEffectInfo.push(newInfo);
        }
      } else if (!newInfo.name) {
        this.fieldEffectInfo.splice(foundIndex, 1);
      } else {
        this.fieldEffectInfo[foundIndex] = newInfo;
      }
      break;
    }

    this.updateFieldText();
  }

  private onTurnEnd(event: Event) {
    const turnEndEvent = event as TurnEndEvent;
    if (!turnEndEvent) {
      return;
    }

    const fieldEffectInfo: ArenaEffectInfo[] = [];
    this.fieldEffectInfo.forEach(i => fieldEffectInfo.push(i));

    for (let i = 0; i < fieldEffectInfo.length; i++) {
      const info = fieldEffectInfo[i];

      if (info.maxDuration === 0) {
        continue;
      }

      --info.duration;
      if (info.duration <= 0) {
        this.fieldEffectInfo.splice(this.fieldEffectInfo.indexOf(info), 1);
      }
    }

    this.updateFieldText();
  }

  toggleFlyout(visible: boolean): void {
    this.scene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: Utils.fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
  }

  destroy(fromScene?: boolean): void {
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.TURN_END,  this.onTurnEndEvent);

    this.battleScene.arena.eventTarget.removeEventListener(ArenaEventType.WEATHER_CHANGED, this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.removeEventListener(ArenaEventType.TERRAIN_CHANGED, this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.removeEventListener(ArenaEventType.TAG_ADDED,       this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.removeEventListener(ArenaEventType.TAG_REMOVED,     this.onFieldEffectChangedEvent);

    super.destroy();
  }
}
