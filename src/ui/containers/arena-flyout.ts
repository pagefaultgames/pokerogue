import { globalScene } from "#app/global-scene";
// biome-ignore-start lint/correctness/noUnusedImports: TSDocs
import type { ArenaTag } from "#data/arena-tag";
import { type Terrain, TerrainType } from "#data/terrain";
import type { Weather } from "#data/weather";
import { ArenaEventType } from "#enums/arena-event-type";
// biome-ignore-end lint/correctness/noUnusedImports: TSDocs
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { TextStyle } from "#enums/text-style";
import { WeatherType } from "#enums/weather-type";
import type { ArenaTagAddedEvent, ArenaTagRemovedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#events/arena";
import { BattleSceneEventType } from "#events/battle-scene";
import { TimeOfDayWidget } from "#ui/containers/time-of-day-widget";
import { addTextObject } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

// #region Interfaces

/** Base container for info about the currently active {@linkcode Weather}. */
interface WeatherInfo {
  /** The localized name of the weather. */
  name: string;
  /** The initial duration of the weather effect, or `0` if it should last indefinitely. */
  maxDuration: number;
  /** The current duration left on the weather. */
  duration: number;
  /** The current {@linkcode WeatherType}. */
  weatherType: WeatherType;
}

/** Base container for info about the currently active {@linkcode Terrain}. */
interface TerrainInfo {
  /** The localized name of the terrain. */
  name: string;
  /** The initial duration of the terrain effect, or `0` if it should last indefinitely. */
  maxDuration: number;
  /** The current duration left on the terrain. */
  duration: number;
  /** The current {@linkcode TerrainType}. */
  terrainType: TerrainType;
}

/** Interface for info about an {@linkcode ArenaTag}'s effects */
interface ArenaTagInfo {
  /** The localized name of the tag. */
  name: string;
  /** The {@linkcode ArenaTagSide} that the tag applies to. */
  side: ArenaTagSide;
  /** The maximum duration of the tag, or `0` if it should last indefinitely. */
  maxDuration: number;
  /** The current duration left on the tag. */
  duration: number;
  /** The tag's {@linkcode ArenaTagType}. */
  tagType?: ArenaTagType;
}

// #endregion interfaces

/**
 * Class to display and update the on-screen arena flyout.
 */
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

  /** Holds info about the current active {@linkcode Weather}, if any are active. */
  private weatherInfo?: WeatherInfo;
  /** Holds info about the current active {@linkcode Terrain}, if any are active. */
  private terrainInfo?: TerrainInfo;

  /** Container for all {@linkcode ArenaTag}s observed by this object. */
  private arenaTags: ArenaTagInfo[] = [];

  private readonly onNewArenaEvent = () => this.onNewArena();
  private readonly onTurnEndEvent = () => this.onTurnEnd();
  private readonly onWeatherChangedEvent = (event: WeatherChangedEvent) => this.onWeatherChanged(event);
  private readonly onTerrainChangedEvent = (event: TerrainChangedEvent) => this.onTerrainChanged(event);
  private readonly onArenaTagAddedEvent = (event: ArenaTagAddedEvent) => this.onArenaTagAdded(event);
  private readonly onArenaTagRemovedEvent = (event: ArenaTagRemovedEvent) => this.onArenaTagRemoved(event);

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

    // Subscribe to required events available on game start
    globalScene.eventTarget.addEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    globalScene.eventTarget.addEventListener(BattleSceneEventType.TURN_END, this.onTurnEndEvent);
  }

  /**
   * Initialize listeners upon creating a new arena.
   */
  private onNewArena() {
    this.arenaTags = [];

    // Subscribe to required events available on battle start
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.WEATHER_CHANGED, this.onWeatherChangedEvent);
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.TERRAIN_CHANGED, this.onTerrainChangedEvent);
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.ARENA_TAG_ADDED, this.onArenaTagAddedEvent);
    globalScene.arena.eventTarget.addEventListener(ArenaEventType.ARENA_TAG_REMOVED, this.onArenaTagRemovedEvent);
  }

  /**
   * Iterate through all currently present tags effects and decrement their durations.
   */
  private onTurnEnd() {
    // Remove all objects with positive max durations and whose durations have expired.
    this.arenaTags = this.arenaTags.filter(info => info.maxDuration === 0 || --info.duration >= 0);

    this.updateFieldText();
  }

  // #region ArenaTags

  /**
   * Add a recently-created {@linkcode ArenaTag} to the flyout.
   * @param event - The {@linkcode ArenaTagAddedEvent} having been emitted
   */
  private onArenaTagAdded(event: ArenaTagAddedEvent): void {
    const name = this.localizeEffectName(ArenaTagType[event.tagType]);
    // Ternary used to avoid unneeded find
    const existingTrapTag =
      event.trapLayers !== undefined
        ? this.arenaTags.find(e => e.tagType === event.tagType && e.side === event.side)
        : undefined;

    // If we got signalled for a layer count update, update the existing trap's name.
    // Otherwise, push it to the array.
    if (event.trapLayers !== undefined && existingTrapTag) {
      this.updateTrapLayers(existingTrapTag, event.trapLayers, name);
    } else {
      this.arenaTags.push({
        name,
        side: event.side,
        maxDuration: event.duration,
        duration: event.duration,
        tagType: event.tagType,
      });
    }
    this.updateFieldText();
  }

  /**
   * Update an existing trap tag with an updated layer count whenever one is overlapped.
   * @param existingTag - The existing {@linkcode ArenaTagInfo} being updated
   * @param layers - The base number of layers of the new tag
   * @param maxLayers - The maximum number of layers of the new tag; will not show layer count if `<=0`
   * @param name - The name of the tag.
   */
  private updateTrapLayers(existingTag: ArenaTagInfo, [layers, maxLayers]: [number, number], name: string): void {
    const layerStr = maxLayers > 1 ? ` (${layers})` : "";
    existingTag.name = `${name}${layerStr}`;
  }

  /**
   * Remove a recently-culled {@linkcode ArenaTag} from the flyout.
   * @param event - The {@linkcode ArenaTagRemovedEvent} having been emitted
   */
  private onArenaTagRemoved(event: ArenaTagRemovedEvent): void {
    const foundIndex = this.arenaTags.findIndex(info => info.tagType === event.tagType && info.side === event.side);

    if (foundIndex > -1) {
      // If the tag was being tracked, remove it
      this.arenaTags.splice(foundIndex, 1);
      this.updateFieldText();
    }
  }

  // #endregion ArenaTags

  // #region Weather/Terrain

  /**
   * Update the current weather text when the weather changes.
   * @param event - The {@linkcode WeatherChangedEvent} having been emitted
   */
  private onWeatherChanged(event: WeatherChangedEvent) {
    // If weather was reset, clear the current data.
    if (event.weatherType === WeatherType.NONE) {
      this.weatherInfo = undefined;
      this.updateFieldText();
      return;
    }

    this.weatherInfo = {
      name: this.localizeEffectName(WeatherType[event.weatherType]),
      maxDuration: event.duration,
      duration: event.duration,
      weatherType: event.weatherType,
    };

    this.updateFieldText();
  }

  /**
   * Update the current terrain text when the terrain changes.
   * @param event - The {@linkcode TerrainChangedEvent} having been emitted
   */
  private onTerrainChanged(event: TerrainChangedEvent) {
    // If terrain was reset, clear the current data.
    if (event.terrainType === TerrainType.NONE) {
      this.terrainInfo = undefined;
      this.updateFieldText();
      return;
    }

    this.terrainInfo = {
      name: this.localizeEffectName(TerrainType[event.terrainType]),
      maxDuration: event.duration,
      duration: event.duration,
      terrainType: event.terrainType,
    };

    this.updateFieldText();
  }

  // #endregion Weather/Terrain

  /**
   * Animate the flyout to either show or hide the modal.
   * @param visible - Whether the the flyout should be shown
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

  /** Destroy this element and remove all associated listeners. */
  public destroy(fromScene?: boolean): void {
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.TURN_END, this.onTurnEndEvent);

    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.WEATHER_CHANGED, this.onWeatherChanged);
    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.TERRAIN_CHANGED, this.onTerrainChanged);
    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.ARENA_TAG_ADDED, this.onArenaTagAddedEvent);
    globalScene.arena.eventTarget.removeEventListener(ArenaEventType.ARENA_TAG_REMOVED, this.onArenaTagRemovedEvent);

    super.destroy(fromScene);
  }

  /** Clear out the contents of all arena texts. */
  private clearText() {
    this.flyoutTextPlayer.text = "";
    this.flyoutTextField.text = "";
    this.flyoutTextEnemy.text = "";
  }

  // #region Text display functions

  /**
   * Iterate over all field effects and update the corresponding {@linkcode Phaser.GameObjects.Text} object.
   */
  private updateFieldText(): void {
    this.clearText();

    // Weather and terrain go first
    if (this.weatherInfo) {
      this.flyoutTextField.text += this.getTagText(this.weatherInfo);
    }
    if (this.terrainInfo) {
      this.flyoutTextField.text += this.getTagText(this.terrainInfo);
    }

    // Sort and update all arena tag text
    this.arenaTags.sort((infoA, infoB) => infoA.duration - infoB.duration);
    for (const tag of this.arenaTags) {
      this.getArenaTagTargetObj(tag.side).text += this.getTagText(tag);
    }
  }

  /**
   * Helper method to retrieve the flyout text for a given effect's info.
   * @param info - The {@linkcode ArenaTagInfo}, {@linkcode TerrainInfo} or {@linkcode WeatherInfo} being updated
   * @returns The text to be added to the container
   */
  private getTagText(info: ArenaTagInfo | WeatherInfo | TerrainInfo): string {
    let text = info.name;

    if (info.maxDuration > 0) {
      text += `  (${info.duration}/${info.maxDuration})`;
    }

    text += "\n";
    return text;
  }

  /**
   * Helper method to select the text object needing to be updated depending on the current tag's side.
   * @param side - The {@linkcode ArenaTagSide} of the tag being updated
   * @returns The {@linkcode Phaser.GameObjects.Text} to be updated.
   */
  private getArenaTagTargetObj(side: ArenaTagSide): Phaser.GameObjects.Text {
    switch (side) {
      case ArenaTagSide.PLAYER:
        return this.flyoutTextPlayer;
      case ArenaTagSide.ENEMY:
        return this.flyoutTextEnemy;
      case ArenaTagSide.BOTH:
        return this.flyoutTextField;
    }
  }

  // # endregion Text display functions

  // #region Utilities

  /**
   * Return the localized text for a given effect.
   * @param text - The raw text of the effect; assumed to be in `UPPER_SNAKE_CASE` from a reverse mapping.
   * @returns The localized text for the effect.
   */
  private localizeEffectName(text: string): string {
    const effectName = toCamelCase(text);
    const i18nKey = `arenaFlyout:${effectName}`;
    const resultName = i18next.t(i18nKey);
    return resultName;
  }

  // #endregion Utility emthods
}
