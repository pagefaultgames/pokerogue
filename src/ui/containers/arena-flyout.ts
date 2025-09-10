import { globalScene } from "#app/global-scene";
import { EntryHazardTag } from "#data/arena-tag";
import { TerrainType } from "#data/terrain";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { TextStyle } from "#enums/text-style";
import { WeatherType } from "#enums/weather-type";
import type { ArenaEvent } from "#events/arena";
import {
  ArenaEventType,
  TagAddedEvent,
  TagRemovedEvent,
  TerrainChangedEvent,
  WeatherChangedEvent,
} from "#events/arena";
import type { TurnEndEvent } from "#events/battle-scene";
import { BattleSceneEventType } from "#events/battle-scene";
import { TimeOfDayWidget } from "#ui/containers/time-of-day-widget";
import { addTextObject } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import { toCamelCase, toTitleCase } from "#utils/strings";
import type { ParseKeys } from "i18next";
import i18next from "i18next";

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
  effectType: ArenaEffectType;

  /** The maximum duration set by the effect */
  maxDuration: number;
  /** The current duration left on the effect */
  duration: number;
  /** The arena tag type being added */
  tagType?: ArenaTagType;
}

export function getFieldEffectText(arenaTagType: string): string {
  if (!arenaTagType || arenaTagType === ArenaTagType.NONE) {
    return arenaTagType;
  }
  const effectName = toCamelCase(arenaTagType);
  const i18nKey = `arenaFlyout:${effectName}` as ParseKeys;
  const resultName = i18next.t(i18nKey);
  return !resultName || resultName === i18nKey ? toTitleCase(arenaTagType) : resultName;
}

export class ArenaFlyout extends Phaser.GameObjects.Container {
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

  private timeOfDayWidget: TimeOfDayWidget;

  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the player's effects */
  private flyoutTextHeaderPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the enemy's effects */
  private flyoutTextHeaderEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate field effects */
  private flyoutTextHeaderField: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the player's effects */
  private flyoutTextPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the enemy's effects */
  private flyoutTextEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate field effects */
  private flyoutTextField: Phaser.GameObjects.Text;

  /** Container for all field effects observed by this object */
  private readonly fieldEffectInfo: ArenaEffectInfo[] = [];

  // Stores callbacks in a variable so they can be unsubscribed from when destroyed
  private readonly onNewArenaEvent = (event: Event) => this.onNewArena(event);
  private readonly onTurnEndEvent = (event: Event) => this.onTurnEnd(event);

  private readonly onFieldEffectChangedEvent = (event: Event) => this.onFieldEffectChanged(event);

  constructor() {
    super(globalScene, 0, 0);
    this.setName("arena-flyout");

    this.translationX = this.flyoutWidth;
    this.anchorX = 0;
    this.anchorY = -98;

    this.flyoutParent = globalScene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    this.flyoutContainer = globalScene.add.container(0, 0);
    this.flyoutParent.add(this.flyoutContainer);

    this.flyoutWindow = addWindow(0, 0, this.flyoutWidth, this.flyoutHeight, false, false, 0, 0, WindowVariant.THIN);
    this.flyoutContainer.add(this.flyoutWindow);

    this.flyoutWindowHeader = addWindow(
      this.flyoutWidth / 2,
      0,
      this.flyoutWidth / 2,
      14,
      false,
      false,
      0,
      0,
      WindowVariant.XTHIN,
    );
    this.flyoutWindowHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutWindowHeader);

    this.flyoutTextHeader = addTextObject(
      this.flyoutWidth / 2,
      0,
      i18next.t("arenaFlyout:activeBattleEffects"),
      TextStyle.BATTLE_INFO,
    );
    this.flyoutTextHeader.setFontSize(54);
    this.flyoutTextHeader.setAlign("center");
    this.flyoutTextHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutTextHeader);

    this.timeOfDayWidget = new TimeOfDayWidget(this.flyoutWidth / 2 + this.flyoutWindowHeader.displayWidth / 2);
    this.flyoutContainer.add(this.timeOfDayWidget);

    this.flyoutTextHeaderPlayer = addTextObject(6, 5, i18next.t("arenaFlyout:player"), TextStyle.SUMMARY_BLUE);
    this.flyoutTextHeaderPlayer.setFontSize(54);
    this.flyoutTextHeaderPlayer.setAlign("left");
    this.flyoutTextHeaderPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderPlayer);

    this.flyoutTextHeaderField = addTextObject(
      this.flyoutWidth / 2,
      5,
      i18next.t("arenaFlyout:field"),
      TextStyle.SUMMARY_GREEN,
    );
    this.flyoutTextHeaderField.setFontSize(54);
    this.flyoutTextHeaderField.setAlign("center");
    this.flyoutTextHeaderField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderField);

    this.flyoutTextHeaderEnemy = addTextObject(
      this.flyoutWidth - 6,
      5,
      i18next.t("arenaFlyout:enemy"),
      TextStyle.SUMMARY_RED,
    );
    this.flyoutTextHeaderEnemy.setFontSize(54);
    this.flyoutTextHeaderEnemy.setAlign("right");
    this.flyoutTextHeaderEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderEnemy);

    this.flyoutTextPlayer = addTextObject(6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextPlayer.setLineSpacing(-1);
    this.flyoutTextPlayer.setFontSize(48);
    this.flyoutTextPlayer.setAlign("left");
    this.flyoutTextPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextPlayer);

    this.flyoutTextField = addTextObject(this.flyoutWidth / 2, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextField.setLineSpacing(-1);
    this.flyoutTextField.setFontSize(48);
    this.flyoutTextField.setAlign("center");
    this.flyoutTextField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextField);

    this.flyoutTextEnemy = addTextObject(this.flyoutWidth - 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextEnemy.setLineSpacing(-1);
    this.flyoutTextEnemy.setFontSize(48);
    this.flyoutTextEnemy.setAlign("right");
    this.flyoutTextEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextEnemy);

    this.name = "Fight Flyout";
    this.flyoutParent.name = "Fight Flyout Parent";

    // Subscribes to required events available on game start
    globalScene.eventTarget.addEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    globalScene.eventTarget.addEventListener(BattleSceneEventType.TURN_END, this.onTurnEndEvent);
  }

  private onNewArena(_event: Event) {
    this.fieldEffectInfo.length = 0;

    // Subscribes to required events available on battle start
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.WEATHER_CHANGED, this.onFieldEffectChangedEvent);
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.TERRAIN_CHANGED, this.onFieldEffectChangedEvent);
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.TAG_ADDED, this.onFieldEffectChangedEvent);
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.TAG_REMOVED, this.onFieldEffectChangedEvent);
  }

  /** Clears out the current string stored in all arena effect texts */
  private clearText() {
    this.flyoutTextPlayer.text = "";
    this.flyoutTextField.text = "";
    this.flyoutTextEnemy.text = "";
  }

  /** Parses through all set Arena Effects and puts them into the proper {@linkcode Phaser.GameObjects.Text} object */
  private updateFieldText() {
    this.clearText();

    this.fieldEffectInfo.sort((infoA, infoB) => infoA.duration - infoB.duration);

    for (const fieldEffectInfo of this.fieldEffectInfo) {
      // Creates a proxy object to decide which text object needs to be updated
      let textObject: Phaser.GameObjects.Text;
      switch (fieldEffectInfo.effectType) {
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

      textObject.text += fieldEffectInfo.name;

      if (fieldEffectInfo.maxDuration !== 0) {
        textObject.text += "  " + fieldEffectInfo.duration + "/" + fieldEffectInfo.maxDuration;
      }

      textObject.text += "\n";
    }
  }

  /**
   * Parses the {@linkcode Event} being passed and updates the state of the fieldEffectInfo array
   * @param event {@linkcode Event} being sent
   */
  private onFieldEffectChanged(event: Event) {
    const arenaEffectChangedEvent = event as ArenaEvent;
    if (!arenaEffectChangedEvent) {
      return;
    }

    let foundIndex: number;
    switch (arenaEffectChangedEvent.constructor) {
      case TagAddedEvent: {
        const tagAddedEvent = arenaEffectChangedEvent as TagAddedEvent;
        const isArenaTrapTag = globalScene.arena.getTag(tagAddedEvent.arenaTagType) instanceof EntryHazardTag;
        let arenaEffectType: ArenaEffectType;

        if (tagAddedEvent.arenaTagSide === ArenaTagSide.BOTH) {
          arenaEffectType = ArenaEffectType.FIELD;
        } else if (tagAddedEvent.arenaTagSide === ArenaTagSide.PLAYER) {
          arenaEffectType = ArenaEffectType.PLAYER;
        } else {
          arenaEffectType = ArenaEffectType.ENEMY;
        }

        const existingTrapTagIndex = isArenaTrapTag
          ? this.fieldEffectInfo.findIndex(
              e => tagAddedEvent.arenaTagType === e.tagType && arenaEffectType === e.effectType,
            )
          : -1;
        let name: string = getFieldEffectText(ArenaTagType[tagAddedEvent.arenaTagType]);

        if (isArenaTrapTag) {
          if (existingTrapTagIndex !== -1) {
            const layers = tagAddedEvent.arenaTagMaxLayers > 1 ? ` (${tagAddedEvent.arenaTagLayers})` : "";
            this.fieldEffectInfo[existingTrapTagIndex].name = `${name}${layers}`;
            break;
          }
          if (tagAddedEvent.arenaTagMaxLayers > 1) {
            name = `${name} (${tagAddedEvent.arenaTagLayers})`;
          }
        }

        this.fieldEffectInfo.push({
          name,
          effectType: arenaEffectType,
          maxDuration: tagAddedEvent.duration,
          duration: tagAddedEvent.duration,
          tagType: tagAddedEvent.arenaTagType,
        });
        break;
      }
      case TagRemovedEvent: {
        const tagRemovedEvent = arenaEffectChangedEvent as TagRemovedEvent;
        foundIndex = this.fieldEffectInfo.findIndex(info => info.tagType === tagRemovedEvent.arenaTagType);

        if (foundIndex !== -1) {
          // If the tag was being tracked, remove it
          this.fieldEffectInfo.splice(foundIndex, 1);
        }
        break;
      }

      case WeatherChangedEvent:
      case TerrainChangedEvent: {
        const fieldEffectChangedEvent = arenaEffectChangedEvent as WeatherChangedEvent | TerrainChangedEvent;

        // Stores the old Weather/Terrain name in case it's in the array already
        const oldName = getFieldEffectText(
          fieldEffectChangedEvent instanceof WeatherChangedEvent
            ? WeatherType[fieldEffectChangedEvent.oldWeatherType]
            : TerrainType[fieldEffectChangedEvent.oldTerrainType],
        );
        // Stores the new Weather/Terrain info
        const newInfo = {
          name: getFieldEffectText(
            fieldEffectChangedEvent instanceof WeatherChangedEvent
              ? WeatherType[fieldEffectChangedEvent.newWeatherType]
              : TerrainType[fieldEffectChangedEvent.newTerrainType],
          ),
          effectType:
            fieldEffectChangedEvent instanceof WeatherChangedEvent ? ArenaEffectType.WEATHER : ArenaEffectType.TERRAIN,
          maxDuration: fieldEffectChangedEvent.duration,
          duration: fieldEffectChangedEvent.duration,
        };

        foundIndex = this.fieldEffectInfo.findIndex(info => [newInfo.name, oldName].includes(info.name));
        if (foundIndex === -1) {
          if (newInfo.name !== undefined) {
            this.fieldEffectInfo.push(newInfo); // Adds the info to the array if it doesn't already exist and is defined
          }
        } else if (!newInfo.name) {
          this.fieldEffectInfo.splice(foundIndex, 1); // Removes the old info if the new one is undefined
        } else {
          this.fieldEffectInfo[foundIndex] = newInfo; // Otherwise, replace the old info
        }
        break;
      }
    }

    this.updateFieldText();
  }

  /**
   * Iterates through the fieldEffectInfo array and decrements the duration of each item
   * @param event {@linkcode Event} being sent
   */
  private onTurnEnd(event: Event) {
    const turnEndEvent = event as TurnEndEvent;
    if (!turnEndEvent) {
      return;
    }

    const fieldEffectInfo: ArenaEffectInfo[] = [];
    this.fieldEffectInfo.forEach(i => fieldEffectInfo.push(i));

    for (const info of fieldEffectInfo) {
      if (info.maxDuration === 0) {
        continue;
      }

      --info.duration;
      if (info.duration <= 0) {
        // Removes the item if the duration has expired
        this.fieldEffectInfo.splice(this.fieldEffectInfo.indexOf(info), 1);
      }
    }

    this.updateFieldText();
  }

  /**
   * Animates the flyout to either show or hide it by applying a fade and translation
   * @param visible Should the flyout be shown?
   */
  public toggleFlyout(visible: boolean): void {
    globalScene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
      onComplete: () => (this.timeOfDayWidget.parentVisible = visible),
    });
  }

  public destroy(fromScene?: boolean): void {
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.TURN_END, this.onTurnEndEvent);

    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.WEATHER_CHANGED, this.onFieldEffectChangedEvent);
    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.TERRAIN_CHANGED, this.onFieldEffectChangedEvent);
    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.TAG_ADDED, this.onFieldEffectChangedEvent);
    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.TAG_REMOVED, this.onFieldEffectChangedEvent);

    super.destroy(fromScene);
  }
}
