import * as Utils from "../utils";
import { addTextObject, TextStyle } from "./text";
import BattleScene from "#app/battle-scene.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { WeatherType } from "#app/data/weather.js";
import { TerrainType } from "#app/data/terrain.js";
import { addWindow, WindowVariant } from "./ui-theme";
import { ArenaEvent, ArenaEventType, TagAddedEvent, TagRemovedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#app/field/arena-events.js";
import { BattleSceneEventType, TurnEndEvent } from "#app/battle-scene-events.js";
import { ArenaTagType } from "#app/data/enums/arena-tag-type.js";
import { TimeOfDay } from "#app/data/enums/time-of-day.js";

/** Enum used to differentiate {@linkcode Arena} effects */
enum ArenaEffectType {
  PLAYER,
  WEATHER,
  TERRAIN,
  FIELD,
  ENEMY,
}
/** Container for info about an {@linkcode Arena}'s effects */
interface ArenaEffectInfo {
  /** The enum string representation of the effect */
  name: string;
  /** {@linkcode ArenaEffectType} type of effect */
  type: ArenaEffectType,

  /** The maximum duration set by the effect */
  maxDuration: number;
  /** The current duration left on the effect */
  duration: number;
}

export default class ArenaFlyout extends Phaser.GameObjects.Container {
  /** An alias for the scene typecast to a {@linkcode BattleScene} */
  private battleScene: BattleScene;

  /** The restricted width of the flyout which should be drawn to */
  private flyoutWidth = 170;
  /** The restricted height of the flyout which should be drawn to */
  private flyoutHeight = 51;

  /** The amount of translation animation on the x-axis */
  private translationX: number;
  /** The x-axis point where the flyout should sit when activated */
  private anchorX: number;
  /** The y-axis point where the flyout should sit when activated */
  private anchorY: number;

  /** The initial container which defines where the flyout should be attached */
  private flyoutParent: Phaser.GameObjects.Container;
  /** The container which defines the drawable dimensions of the flyout */
  private flyoutContainer: Phaser.GameObjects.Container;

  /** The background {@linkcode Phaser.GameObjects.NineSlice} window for the flyout */
  private flyoutWindow: Phaser.GameObjects.NineSlice;

  /** The header {@linkcode Phaser.GameObjects.NineSlice} window for the flyout */
  private flyoutWindowHeader: Phaser.GameObjects.NineSlice;
  /** The {@linkcode Phaser.GameObjects.Text} that goes inside of the header */
  private flyoutTextHeader: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Sprite} that represents the current time of day */
  private timeOfDayIcon: Phaser.GameObjects.Sprite;

  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the player's effects */
  private flyoutTextHeaderPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the enemy's effects */
  private flyoutTextHeaderEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate neutral effects */
  private flyoutTextHeaderField: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the player's effects */
  private flyoutTextPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the enemy's effects */
  private flyoutTextEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate neutral effects */
  private flyoutTextField: Phaser.GameObjects.Text;

  private readonly fieldEffectInfo: ArenaEffectInfo[] = [];

  private onNewArenaEvent =  (event: Event) => this.onNewArena(event);
  private onTurnInitEvent =  (event: Event) => this.onTurnInit(event);
  private onTurnEndEvent =   (event: Event) => this.onTurnEnd(event);

  private onFieldEffectChangedEvent = (event: Event) => this.onFieldEffectChanged(event);

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.battleScene = this.scene as BattleScene;

    this.translationX = this.flyoutWidth;
    this.anchorX = 0;
    this.anchorY = -98;

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    this.flyoutContainer = this.scene.add.container(0, 0);
    this.flyoutParent.add(this.flyoutContainer);

    this.flyoutWindow = addWindow(this.scene as BattleScene, 0, 0, this.flyoutWidth, this.flyoutHeight, false, false, 0, 0, WindowVariant.THIN);
    this.flyoutContainer.add(this.flyoutWindow);

    this.flyoutWindowHeader = addWindow(this.scene as BattleScene, this.flyoutWidth / 2, 0, this.flyoutWidth / 2, 14, false, false, 0, 0, WindowVariant.XTHIN);
    this.flyoutWindowHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutWindowHeader);

    this.flyoutTextHeader = addTextObject(this.scene, this.flyoutWidth / 2, 0, "Active Battle Effects", TextStyle.BATTLE_INFO);
    this.flyoutTextHeader.setFontSize(54);
    this.flyoutTextHeader.setAlign("center");
    this.flyoutTextHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutTextHeader);

    this.timeOfDayIcon = this.scene.add.sprite((this.flyoutWidth / 2) + (this.flyoutWindowHeader.displayWidth / 2), 0, "dawn_icon").setOrigin();
    this.flyoutContainer.add(this.timeOfDayIcon);

    this.flyoutTextHeaderPlayer = addTextObject(this.scene, 6, 5, "Player", TextStyle.SUMMARY_BLUE);
    this.flyoutTextHeaderPlayer.setFontSize(54);
    this.flyoutTextHeaderPlayer.setAlign("left");
    this.flyoutTextHeaderPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderPlayer);

    this.flyoutTextHeaderField = addTextObject(this.scene, this.flyoutWidth / 2, 5, "Neutral", TextStyle.SUMMARY_GREEN);
    this.flyoutTextHeaderField.setFontSize(54);
    this.flyoutTextHeaderField.setAlign("center");
    this.flyoutTextHeaderField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderField);

    this.flyoutTextHeaderEnemy = addTextObject(this.scene, this.flyoutWidth - 6, 5, "Enemy", TextStyle.SUMMARY_RED);
    this.flyoutTextHeaderEnemy.setFontSize(54);
    this.flyoutTextHeaderEnemy.setAlign("right");
    this.flyoutTextHeaderEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderEnemy);

    this.flyoutTextPlayer = addTextObject(this.scene, 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextPlayer.setLineSpacing(-1);
    this.flyoutTextPlayer.setFontSize(48);
    this.flyoutTextPlayer.setAlign("left");
    this.flyoutTextPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextPlayer);

    this.flyoutTextField = addTextObject(this.scene, this.flyoutWidth / 2, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextField.setLineSpacing(-1);
    this.flyoutTextField.setFontSize(48);
    this.flyoutTextField.setAlign("center");
    this.flyoutTextField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextField);

    this.flyoutTextEnemy = addTextObject(this.scene, this.flyoutWidth - 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextEnemy.setLineSpacing(-1);
    this.flyoutTextEnemy.setFontSize(48);
    this.flyoutTextEnemy.setAlign("right");
    this.flyoutTextEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextEnemy);

    this.name = "Fight Flyout";
    this.flyoutParent.name = "Fight Flyout Parent";

    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.TURN_INIT, this.onTurnInitEvent);
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.TURN_END,  this.onTurnEndEvent);
  }

  private setTimeOfDayIcon() {
    this.timeOfDayIcon.setTexture(TimeOfDay[this.battleScene.arena.getTimeOfDay()].toLowerCase() + "_icon");
  }

  private onTurnInit(event: Event) {
    this.setTimeOfDayIcon();
  }

  private onNewArena(event: Event) {
    this.fieldEffectInfo.length = 0;

    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.WEATHER_CHANGED, this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.TERRAIN_CHANGED, this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.TAG_ADDED,       this.onFieldEffectChangedEvent);
    this.battleScene.arena.eventTarget.addEventListener(ArenaEventType.TAG_REMOVED,     this.onFieldEffectChangedEvent);

    this.setTimeOfDayIcon();
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

    this.fieldEffectInfo.sort((infoA, infoB) => infoA.duration - infoB.duration);

    for (let i = 0; i < this.fieldEffectInfo.length; i++) {
      const fieldEffectInfo = this.fieldEffectInfo[i];

      let textObject: Phaser.GameObjects.Text;
      switch (fieldEffectInfo.type) {
      case ArenaEffectType.PLAYER:
        textObject = this.flyoutTextPlayer;
        break;

      case ArenaEffectType.WEATHER:
      case ArenaEffectType.TERRAIN:
      case ArenaEffectType.FIELD:
        textObject = this.flyoutTextField;

        break;

      case ArenaEffectType.ENEMY:
        textObject = this.flyoutTextEnemy;
        break;
      }

      textObject.text += this.formatText(fieldEffectInfo.name);
      if (fieldEffectInfo.type === ArenaEffectType.TERRAIN) {
        textObject.text += " Terrain";
      }

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

      const oldName =
      fieldEffectChangedEvent instanceof WeatherChangedEvent
        ? WeatherType[fieldEffectChangedEvent.oldWeatherType]
        : TerrainType[fieldEffectChangedEvent.oldTerrainType];
      const newInfo = {
        name:
          fieldEffectChangedEvent instanceof WeatherChangedEvent
            ? WeatherType[fieldEffectChangedEvent.newWeatherType]
            : TerrainType[fieldEffectChangedEvent.newTerrainType],
        type: fieldEffectChangedEvent instanceof WeatherChangedEvent
          ? ArenaEffectType.WEATHER
          : ArenaEffectType.TERRAIN,
        maxDuration: fieldEffectChangedEvent.duration,
        duration: fieldEffectChangedEvent.duration};

      foundIndex = this.fieldEffectInfo.findIndex(info => [newInfo.name, oldName].includes(info.name));
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
