import { globalScene } from "#app/global-scene";
import type { ArenaTag } from "#data/arena-tag";
import { type Terrain, TerrainType } from "#data/terrain";
import type { Weather } from "#data/weather";
import { ArenaEventType } from "#enums/arena-event-type";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { TextStyle } from "#enums/text-style";
import { WeatherType } from "#enums/weather-type";
import type { ArenaTagAddedEvent, ArenaTagRemovedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#events/arena";
import { BattleSceneEventType } from "#events/battle-scene";
import { addTextObject } from "#ui/text";
import { TimeOfDayWidget } from "#ui/time-of-day-widget";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

// #region Interfaces

/** Base container for info about the currently active {@linkcode Weather}. */
interface WeatherInfo {
  /** The localized name of the weather. */
  readonly name: string;
  /** The initial duration of the weather effect, or `0` if it should last indefinitely. */
  readonly maxDuration: number;
  /** The current duration left on the weather. */
  duration: number;
  /** The current {@linkcode WeatherType}. */
  readonly weatherType: WeatherType;
}

/** Base container for info about the currently active {@linkcode Terrain}. */
interface TerrainInfo {
  /** The localized name of the terrain. */
  readonly name: string;
  /** The initial duration of the terrain effect, or `0` if it should last indefinitely. */
  readonly maxDuration: number;
  /** The current duration left on the terrain. */
  duration: number;
  /** The current {@linkcode TerrainType}. */
  readonly terrainType: TerrainType;
}

/** Interface for info about an {@linkcode ArenaTag}'s effects. */
interface ArenaTagInfo {
  /**
   * The localized name of the tag.
   * @privateRemarks
   * Made mutable to allow for updating entry hazard layer counts.
   */
  name: string;
  /** The {@linkcode ArenaTagSide} to which the tag applies. */
  readonly side: ArenaTagSide;
  /** The maximum duration of the tag, or `0` if it should last indefinitely. */
  readonly maxDuration: number;
  /** The current duration left on the tag. */
  duration: number;
  /** The tag's {@linkcode ArenaTagType}. */
  readonly tagType: ArenaTagType;
}

// #endregion Interfaces

// #region Constants
/** The restricted width of the flyout which should be drawn to */
const FLYOUT_WIDTH = 170;
/** The restricted height of the flyout which should be drawn to */
const FLYOUT_HEIGHT = 51;
/** The amount of translation animation on the x-axis */
const FLYOUT_TRANSLATION_X = FLYOUT_WIDTH;
/** The x-axis point where the flyout should sit when activated */
const FLYOUT_ANCHOR_X = 0;
/** The y-axis point where the flyout should sit when activated */
const FLYOUT_ANCHOR_Y = -98;
// #endregion Constants

/**
 * Class to display and update the on-screen arena flyout.
 */
export class ArenaFlyout extends Phaser.GameObjects.Container {
  /** The initial container which defines where the flyout should be attached */
  private readonly flyoutParent: Phaser.GameObjects.Container;
  /** The container which defines the drawable dimensions of the flyout */
  private readonly flyoutContainer: Phaser.GameObjects.Container;

  /** The background {@linkcode Phaser.GameObjects.NineSlice} window for the flyout */
  private readonly flyoutWindow: Phaser.GameObjects.NineSlice;

  /** The header {@linkcode Phaser.GameObjects.NineSlice} window for the flyout */
  private readonly flyoutWindowHeader: Phaser.GameObjects.NineSlice;
  /** The {@linkcode Phaser.GameObjects.Text} that goes inside of the header */
  private readonly flyoutTextHeader: Phaser.GameObjects.Text;

  private readonly timeOfDayWidget: TimeOfDayWidget;

  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the player's effects */
  private readonly flyoutTextHeaderPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the enemy's effects */
  private readonly flyoutTextHeaderEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate field effects */
  private readonly flyoutTextHeaderField: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the player's effects */
  private readonly flyoutTextPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the enemy's effects */
  private readonly flyoutTextEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate field effects */
  private readonly flyoutTextField: Phaser.GameObjects.Text;

  /** Holds info about the current active {@linkcode Weather}, if any are active. */
  private weatherInfo?: WeatherInfo | undefined;
  /** Holds info about the current active {@linkcode Terrain}, if any are active. */
  private terrainInfo?: TerrainInfo | undefined;

  /** Container for all {@linkcode ArenaTag}s observed by this object. */
  private arenaTags: ArenaTagInfo[] = [];

  constructor() {
    super(globalScene, 0, 0);

    this.setName("arena-flyout");

    this.flyoutParent = globalScene.add
      .container(FLYOUT_ANCHOR_X - FLYOUT_TRANSLATION_X, FLYOUT_ANCHOR_Y)
      .setAlpha(0)
      .setName("arena-flyout-parent");
    this.add(this.flyoutParent);

    this.flyoutContainer = globalScene.add.container(0, 0);
    this.flyoutParent.add(this.flyoutContainer);

    this.flyoutWindow = addWindow(0, 0, FLYOUT_WIDTH, FLYOUT_HEIGHT, false, false, 0, 0, WindowVariant.THIN);

    this.flyoutWindowHeader = addWindow(
      FLYOUT_WIDTH / 2,
      0,
      FLYOUT_WIDTH / 2,
      14,
      false,
      false,
      0,
      0,
      WindowVariant.XTHIN,
    ).setOrigin();

    this.flyoutTextHeader = addTextObject(
      FLYOUT_WIDTH / 2,
      0,
      i18next.t("arenaFlyout:activeBattleEffects"),
      TextStyle.BATTLE_INFO,
    )
      .setFontSize(54)
      .setAlign("center")
      .setOrigin();

    this.timeOfDayWidget = new TimeOfDayWidget(FLYOUT_WIDTH / 2 + this.flyoutWindowHeader.displayWidth / 2);

    this.flyoutTextHeaderPlayer = addTextObject(6, 5, i18next.t("arenaFlyout:player"), TextStyle.SUMMARY_BLUE)
      .setFontSize(54)
      .setAlign("left")
      .setOrigin(0, 0);

    this.flyoutTextHeaderField = addTextObject(
      FLYOUT_WIDTH / 2,
      5,
      i18next.t("arenaFlyout:field"),
      TextStyle.SUMMARY_GREEN,
    )
      .setFontSize(54)
      .setAlign("center")
      .setOrigin(0.5, 0);

    this.flyoutTextHeaderEnemy = addTextObject(
      FLYOUT_WIDTH - 6,
      5,
      i18next.t("arenaFlyout:enemy"),
      TextStyle.SUMMARY_RED,
    )
      .setFontSize(54)
      .setAlign("right")
      .setOrigin(1, 0);

    this.flyoutTextPlayer = addTextObject(6, 13, "", TextStyle.BATTLE_INFO)
      .setLineSpacing(-1)
      .setFontSize(48)
      .setAlign("left")
      .setOrigin(0, 0);

    this.flyoutTextField = addTextObject(FLYOUT_WIDTH / 2, 13, "", TextStyle.BATTLE_INFO)
      .setLineSpacing(-1)
      .setFontSize(48)
      .setAlign("center")
      .setOrigin(0.5, 0);

    this.flyoutTextEnemy = addTextObject(FLYOUT_WIDTH - 6, 13, "", TextStyle.BATTLE_INFO)
      .setLineSpacing(-1)
      .setFontSize(48)
      .setAlign("right")
      .setOrigin(1, 0);

    this.flyoutContainer.add([
      this.flyoutWindow,
      this.flyoutWindowHeader,
      this.flyoutTextHeader,
      this.timeOfDayWidget,
      this.flyoutTextHeaderPlayer,
      this.flyoutTextHeaderField,
      this.flyoutTextHeaderEnemy,
      this.flyoutTextPlayer,
      this.flyoutTextField,
      this.flyoutTextEnemy,
    ]);

    // NB: We have to use function properties instead of methods to ensure proper `this` scoping
    const { eventTarget } = globalScene;
    eventTarget.addEventListener(BattleSceneEventType.NEW_ARENA, this.#onNewArena);
    eventTarget.addEventListener(BattleSceneEventType.TURN_END, this.#onTurnEnd);
  }

  // #region Setup/Teardown

  /**
   * Initialize listeners upon creating a new arena.
   */
  readonly #onNewArena = (): void => {
    this.arenaTags = [];
    const { eventTarget } = globalScene.arena;

    eventTarget.addEventListener(ArenaEventType.WEATHER_CHANGED, this.#onWeatherChanged);
    eventTarget.addEventListener(ArenaEventType.TERRAIN_CHANGED, this.#onTerrainChanged);
    eventTarget.addEventListener(ArenaEventType.ARENA_TAG_ADDED, this.#onArenaTagAdded);
    eventTarget.addEventListener(ArenaEventType.ARENA_TAG_REMOVED, this.#onArenaTagRemoved);
  };

  /**
   * Iterate through all currently present tags effects and decrement their durations, removing all tags expiring in this manner..
   */
  readonly #onTurnEnd = (): void => {
    this.arenaTags = this.arenaTags.filter(info => info.maxDuration === 0 || --info.duration >= 0);

    this.updateFieldText();
  };

  /** Destroy this element and remove all associated listeners. */
  public override destroy(fromScene?: boolean): void {
    const { eventTarget } = globalScene;
    const { eventTarget: arenaEventTarget } = globalScene.arena;
    eventTarget.removeEventListener(BattleSceneEventType.NEW_ARENA, this.#onNewArena);
    eventTarget.removeEventListener(BattleSceneEventType.TURN_END, this.#onTurnEnd);

    arenaEventTarget.removeEventListener(ArenaEventType.WEATHER_CHANGED, this.#onWeatherChanged);
    arenaEventTarget.removeEventListener(ArenaEventType.TERRAIN_CHANGED, this.#onTerrainChanged);
    arenaEventTarget.removeEventListener(ArenaEventType.ARENA_TAG_ADDED, this.#onArenaTagAdded);
    arenaEventTarget.removeEventListener(ArenaEventType.ARENA_TAG_REMOVED, this.#onArenaTagRemoved);

    super.destroy(fromScene);
  }

  // #endregion Setup/Teardown

  // #region ArenaTags

  /**
   * Add a recently-created {@linkcode ArenaTag} to the flyout.
   * @param event - The {@linkcode ArenaTagAddedEvent} having been emitted
   */
  readonly #onArenaTagAdded = (event: ArenaTagAddedEvent) => {
    const { trapLayers, tagType, side, maxDuration, duration } = event;
    const name = this.localizeEffectName(ArenaTagType[tagType]);
    if (trapLayers == null) {
      this.arenaTags.push({
        name,
        side,
        maxDuration,
        duration,
        tagType,
      });
      this.updateFieldText();
      return;
    }

    const existingTrapTag = this.arenaTags.find(e => e.tagType === tagType && e.side === side);
    if (existingTrapTag) {
      this.updateTrapLayers(existingTrapTag, trapLayers, name);
    } else {
      this.arenaTags.push({
        name,
        side,
        maxDuration,
        duration,
        tagType,
      });
    }
    this.updateFieldText();
  };

  /**
   * Update an existing trap tag with an updated layer count whenever one is overlapped.
   * @param existingTag - The existing {@linkcode ArenaTagInfo} being updated
   * @param layers - The base number of layers of the new tag
   * @param maxLayers - The maximum number of layers of the new tag; will not show layer count if `<=0`
   * @param name - The name of the tag
   */
  private updateTrapLayers(existingTag: ArenaTagInfo, [layers, maxLayers]: [number, number], name: string): void {
    const layerStr = maxLayers === 1 ? "" : ` (${layers})`;
    existingTag.name = `${name}${layerStr}`;
  }

  /**
   * Remove a recently-culled {@linkcode ArenaTag} from the flyout.
   * @param event - The {@linkcode ArenaTagRemovedEvent} having been emitted
   */
  readonly #onArenaTagRemoved = (event: ArenaTagRemovedEvent): void => {
    const foundIndex = this.arenaTags.findIndex(info => info.tagType === event.tagType && info.side === event.side);

    if (foundIndex > -1) {
      this.arenaTags.splice(foundIndex, 1);
      this.updateFieldText();
    }
  };

  // #endregion ArenaTags

  // #region Weather/Terrain

  /**
   * Update the current weather text when the weather changes.
   * @param event - The {@linkcode WeatherChangedEvent} having been emitted
   */
  readonly #onWeatherChanged = (event: WeatherChangedEvent): void => {
    if (event.weatherType === WeatherType.NONE) {
      this.weatherInfo = undefined;
      this.updateFieldText();
      return;
    }

    this.weatherInfo = {
      name: this.localizeEffectName(WeatherType[event.weatherType]),
      maxDuration: event.maxDuration,
      duration: event.duration,
      weatherType: event.weatherType,
    };

    this.updateFieldText();
  };

  /**
   * Update the current terrain text when the terrain changes.
   * @param event - The {@linkcode TerrainChangedEvent} having been emitted
   */
  readonly #onTerrainChanged = (event: TerrainChangedEvent): void => {
    if (event.terrainType === TerrainType.NONE) {
      this.terrainInfo = undefined;
      this.updateFieldText();
      return;
    }

    this.terrainInfo = {
      name: this.localizeEffectName(TerrainType[event.terrainType]),
      maxDuration: event.maxDuration,
      duration: event.duration,
      terrainType: event.terrainType,
    };

    this.updateFieldText();
  };

  // #endregion Weather/Terrain

  // #region Text display functions
  /** Clear out the contents of all arena texts. */
  private clearText(this: ArenaFlyout): void {
    this.flyoutTextPlayer.text = "";
    this.flyoutTextField.text = "";
    this.flyoutTextEnemy.text = "";
  }

  /**
   * Iterate over all field effects and update the corresponding {@linkcode Phaser.GameObjects.Text} objects.
   */
  // TODO: Make this use scrolling text objects per individual effect to allow for longer messages and allow
  // Future Sight and similar to appear on the flyout again
  private updateFieldText(this: ArenaFlyout): void {
    this.clearText();

    if (this.weatherInfo) {
      this.flyoutTextField.text += this.getTagText(this.weatherInfo);
    }
    if (this.terrainInfo) {
      this.flyoutTextField.text += this.getTagText(this.terrainInfo);
    }

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

  // #endregion Text display functions

  // #region Misc

  /**
   * Animate the flyout to either show or hide the modal.
   * @param visible - Whether the the flyout should be shown
   */
  public toggleFlyout(visible: boolean): void {
    globalScene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? FLYOUT_ANCHOR_X : FLYOUT_ANCHOR_X - FLYOUT_TRANSLATION_X,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: +visible,
      onComplete: () => {
        this.timeOfDayWidget.parentVisible = visible;
      },
    });
  }

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

  // #endregion Misc
}
