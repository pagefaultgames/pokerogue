import * as Utils from "../utils";
import BattleScene from "#app/battle-scene.js";
import { TimeOfDay } from "#app/data/enums/time-of-day.js";
import { BattleSceneEventType } from "../events/battle-scene";
import { EaseType } from "./enums/ease-type";

/** A small self contained UI element that displays the time of day as an icon */
export default class TimeOfDayWidget extends Phaser.GameObjects.Container {
  /** An alias for the scene typecast to a {@linkcode BattleScene} */
  private battleScene: BattleScene;

  /** The {@linkcode Phaser.GameObjects.Sprite} that represents the foreground of the current time of day */
  private readonly timeOfDayIconFgs: Phaser.GameObjects.Sprite[] = new Array(2);
  /** The {@linkcode Phaser.GameObjects.Sprite} that represents the middle-ground of the current time of day */
  private readonly timeOfDayIconMgs: Phaser.GameObjects.Sprite[] = new Array(2);
  /** The {@linkcode Phaser.GameObjects.Sprite} that represents the background of the current time of day */
  private readonly timeOfDayIconBgs: Phaser.GameObjects.Sprite[] = new Array(2);

  /** An array containing all timeOfDayIcon objects for easier iteration */
  private timeOfDayIcons: Phaser.GameObjects.Sprite[];

  /** A map containing all timeOfDayIcon arrays with a matching string key for easier iteration */
  private timeOfDayIconPairs: Map<string, Phaser.GameObjects.Sprite[]> = new Map([
    ["bg", this.timeOfDayIconBgs],
    ["mg", this.timeOfDayIconMgs],
    ["fg", this.timeOfDayIconFgs],]);

  /** The current time of day */
  private currentTime: TimeOfDay = TimeOfDay.ALL;
  /** The previous time of day */
  private previousTime: TimeOfDay = TimeOfDay.ALL;

  // Subscribes to required events available on game start
  private readonly onEncounterPhaseEvent = (event: Event) => this.onEncounterPhase(event);

  private _parentVisible: boolean;
  /** Is the parent object visible? */
  public get parentVisible(): boolean {
    return this._parentVisible;
  }
  /** On set, resumes any paused tweens if true */
  public set parentVisible(visible: boolean) {
    if (visible && !this._parentVisible) { // Only resume the tweens if parent is newly visible
      this.timeOfDayIcons?.forEach(
        icon => this.scene.tweens.getTweensOf(icon).forEach(
          tween => tween.resume()));
    }

    this._parentVisible = visible;
  }

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    super(scene, x, y);
    this.battleScene = this.scene as BattleScene;

    this.setVisible(this.battleScene.showTimeOfDayWidget);
    if (!this.battleScene.showTimeOfDayWidget) {
      return;
    }

    // Initialize all sprites
    this.timeOfDayIconPairs.forEach(
      (icons, key) => {
        for (let i = 0; i < icons.length; i++) {
          icons[i] = this.scene.add.sprite(0, 0, "dawn_icon_" + key).setOrigin();
        }
      });
    // Store a flat array of all icons for later
    this.timeOfDayIcons = [this.timeOfDayIconBgs, this.timeOfDayIconMgs, this.timeOfDayIconFgs].flat();
    this.add(this.timeOfDayIcons);

    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.ENCOUNTER_PHASE, this.onEncounterPhaseEvent);
  }

  /**
   * Creates a tween animation based on the 'Back' ease algorithm
   * @returns an array of all tweens in the animation
   */
  private getBackTween(): Phaser.Types.Tweens.TweenBuilderConfig[] {
    const rotate = {
      targets: [this.timeOfDayIconMgs[0], this.timeOfDayIconMgs[1]],
      angle: "+=90",
      duration: Utils.fixedInt(1500),
      ease: "Back.easeOut",
      paused: !this.parentVisible,
    };
    const fade = {
      targets: [this.timeOfDayIconBgs[1], this.timeOfDayIconMgs[1], this.timeOfDayIconFgs[1]],
      alpha: 0,
      duration: Utils.fixedInt(500),
      ease: "Linear",
      paused: !this.parentVisible,
    };

    return [rotate, fade];
  }

  /**
   * Creates a tween animation based on the 'Bounce' ease algorithm
   * @returns an array of all tweens in the animation
   */
  private getBounceTween(): Phaser.Types.Tweens.TweenBuilderConfig[] {
    const bounce = {
      targets: [this.timeOfDayIconMgs[0], this.timeOfDayIconMgs[1]],
      angle: "+=90",
      duration: Utils.fixedInt(2000),
      ease: "Bounce.easeOut",
      paused: !this.parentVisible,
    };
    const fade = {
      targets: [this.timeOfDayIconBgs[1], this.timeOfDayIconMgs[1], this.timeOfDayIconFgs[1]],
      alpha: 0,
      duration: Utils.fixedInt(800),
      ease: "Linear",
      paused: !this.parentVisible,
    };

    return [bounce, fade];
  }

  /** Resets all icons to the proper depth, texture, and alpha so they are ready to tween */
  private resetIcons() {
    this.moveBelow(this.timeOfDayIconBgs[0], this.timeOfDayIconBgs[1]);
    this.moveBelow(this.timeOfDayIconMgs[0], this.timeOfDayIconBgs[1]);
    this.moveBelow(this.timeOfDayIconFgs[0], this.timeOfDayIconFgs[1]);

    this.timeOfDayIconPairs.forEach(
      (icons, key) => {
        icons[0].setTexture(TimeOfDay[this.currentTime].toLowerCase() + "_icon_" + key);
        icons[1].setTexture(TimeOfDay[this.previousTime].toLowerCase() + "_icon_" + key);
      });
    this.timeOfDayIconMgs[0].setRotation(-90 * (3.14/180));

    this.timeOfDayIcons.forEach(icon => icon.setAlpha(1));
  }

  /** Adds the proper tween for all icons */
  private tweenTimeOfDayIcon() {
    this.scene.tweens.killTweensOf(this.timeOfDayIcons);

    this.resetIcons();

    // Tween based on the player setting
    (this.battleScene.timeOfDayAnimation === EaseType.BACK ? this.getBackTween() : this.getBounceTween())
      .forEach(tween => this.scene.tweens.add(tween));

    // Swaps all elements of the icon arrays by shifting the first element onto the end of the array
    // This ensures index[0] is always the new time of day icon and index[1] is always the current one
    this.timeOfDayIconPairs.forEach(
      icons => icons.push(icons.shift()));
  }

  /**
   * Grabs the current time of day from the arena and calls {@linkcode tweenTimeOfDayIcon}
   * @param event {@linkcode Event} being sent
   */
  private onEncounterPhase(event: Event) {
    const newTime = this.battleScene.arena.getTimeOfDay();

    if (this.currentTime === newTime) {
      return;
    }

    this.currentTime = newTime;
    this.previousTime = this.currentTime - 1;
    if (this.previousTime < TimeOfDay.DAWN) {
      this.previousTime = TimeOfDay.NIGHT;
    }

    this.tweenTimeOfDayIcon();
  }
}
