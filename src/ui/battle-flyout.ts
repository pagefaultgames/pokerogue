import { default as Pokemon } from "../field/pokemon";
import { addTextObject, TextStyle } from "./text";
import * as Utils from "../utils";
import BattleScene from "#app/battle-scene.js";
import { UiTheme } from "#app/enums/ui-theme.js";
import Move from "#app/data/move.js";
import { BattleSceneEventType, BerryUsedEvent, MoveUsedEvent } from "#app/battle-scene-events.js";
import { BerryType } from "#app/data/enums/berry-type.js";
import { Moves } from "#app/data/enums/moves.js";

/** Container for info about a {@linkcode Move} */
interface MoveInfo {
  /** The {@linkcode Move} itself */
  move: Move,

  /** The maximum PP of the {@linkcode Move} */
  maxPp: number,
  /** The amount of PP used by the {@linkcode Move} */
  ppUsed: number,
}

/** A Flyout Menu attached to each {@linkcode BattleInfo} object on the field UI */
export default class BattleFlyout extends Phaser.GameObjects.Container {
  /** An alias for the scene typecast to a {@linkcode BattleScene} */
  private battleScene: BattleScene;

  /** Is this object linked to a player's Pokemon? */
  private player: boolean;

  /** The Pokemon this object is linked to */
  private pokemon: Pokemon;

  /** The restricted width of the flyout which should be drawn to */
  private flyoutWidth = 118;
  /** The restricted height of the flyout which should be drawn to */
  private flyoutHeight = 23;

  /** The amount of translation animation on the x-axis */
  private translationX: number;
  /** The x-axis point where the flyout should sit when activated */
  private anchorX: number;
  /** The y-axis point where the flyout should sit when activated */
  private anchorY: number;

  /** The initial container which defines where the flyout should be attached */
  private flyoutParent: Phaser.GameObjects.Container;
  /** The background {@linkcode Phaser.GameObjects.Sprite;} for the flyout */
  private flyoutBackground: Phaser.GameObjects.Sprite;

  /** The container which defines the drawable dimensions of the flyout */
  private flyoutContainer: Phaser.GameObjects.Container;

  /** The array of {@linkcode Phaser.GameObjects.Text} objects which are drawn on the flyout */
  private flyoutText: Phaser.GameObjects.Text[] = new Array(4);
  /** The array of {@linkcode MoveInfo} used to track moves for the {@linkcode Pokemon} linked to the flyout */
  private moveInfo: MoveInfo[] = new Array();

  // Stores callbacks in a variable so they can be unsubscribed from when destroyed
  private readonly onMoveUsedEvent = (event: Event) => this.onMoveUsed(event);
  private readonly onBerryUsedEvent = (event: Event) => this.onBerryUsed(event);

  constructor(scene: Phaser.Scene, player: boolean) {
    super(scene, 0, 0);
    this.battleScene = scene as BattleScene;

    // Note that all player based flyouts are disabled. This is included in case of future development
    this.player = player;

    this.translationX = this.player ? -this.flyoutWidth : this.flyoutWidth;
    this.anchorX = (this.player ? -130 : -40);
    this.anchorY = -2.5 + (this.player ? -18.5 : -13);

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    // Load the background image
    this.flyoutBackground = this.scene.add.sprite(0, 0, "pbinfo_enemy_boss_stats");
    this.flyoutBackground.setOrigin(0, 0);

    this.flyoutParent.add(this.flyoutBackground);

    this.flyoutContainer = this.scene.add.container(44 + (this.player ? -this.flyoutWidth : 0), 2);
    this.flyoutParent.add(this.flyoutContainer);

    // Loops through and sets the position of each text object according to the width and height of the flyout
    for (let i = 0; i < 4; i++) {
      this.flyoutText[i] = addTextObject(
        this.scene,
        (this.flyoutWidth / 4) + (this.flyoutWidth / 2) * (i % 2),
        (this.flyoutHeight / 4) + (this.flyoutHeight / 2) * (i < 2 ? 0 : 1), "???", TextStyle.BATTLE_INFO);
      this.flyoutText[i].setFontSize(45);
      this.flyoutText[i].setLineSpacing(-10);
      this.flyoutText[i].setAlign("center");
      this.flyoutText[i].setOrigin();
    }

    this.flyoutContainer.add(this.flyoutText);

    this.flyoutContainer.add(
      new Phaser.GameObjects.Rectangle(this.scene, this.flyoutWidth / 2, 0, 1, this.flyoutHeight + (this.battleScene.uiTheme === UiTheme.LEGACY ? 1 : 0), 0x212121).setOrigin(0.5, 0));
    this.flyoutContainer.add(
      new Phaser.GameObjects.Rectangle(this.scene, 0, this.flyoutHeight / 2, this.flyoutWidth + 6, 1, 0x212121).setOrigin(0, 0.5));
  }

  /**
   * Links the given {@linkcode Pokemon} and subscribes to the {@linkcode BattleSceneEventType.MOVE_USED} event
   * @param pokemon {@linkcode Pokemon} to link to this flyout
   */
  initInfo(pokemon: Pokemon) {
    this.pokemon = pokemon;

    this.name = `Flyout ${this.pokemon.name}`;
    this.flyoutParent.name = `Flyout Parent ${this.pokemon.name}`;

    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.MOVE_USED, this.onMoveUsedEvent);
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.BERRY_USED, this.onBerryUsedEvent);
  }

  /** Sets and formats the text property for all {@linkcode Phaser.GameObjects.Text} in the flyoutText array */
  private setText() {
    for (let i = 0; i < this.flyoutText.length; i++) {
      const flyoutText = this.flyoutText[i];
      const moveInfo = this.moveInfo[i];

      if (!moveInfo) {
        continue;
      }

      const currentPp = moveInfo.maxPp - moveInfo.ppUsed;
      flyoutText.text = `${moveInfo.move.name}  ${currentPp}/${moveInfo.maxPp}`;
    }
  }

  /** Updates all of the {@linkcode MoveInfo} objects in the moveInfo array */
  private onMoveUsed(event: Event) {
    const moveUsedEvent = event as MoveUsedEvent;
    if (!moveUsedEvent
      || moveUsedEvent.pokemonId !== this.pokemon?.id
      || moveUsedEvent.move.id === Moves.STRUGGLE) { // Ignore Struggle
      return;
    }

    const foundInfo = this.moveInfo.find(x => x?.move.id === moveUsedEvent.move.id);
    if (foundInfo) {
      foundInfo.ppUsed = Math.min(foundInfo.ppUsed + moveUsedEvent.ppUsed, foundInfo.maxPp);
    } else {
      this.moveInfo.push({move: moveUsedEvent.move, maxPp: moveUsedEvent.move.pp, ppUsed: moveUsedEvent.ppUsed});
    }

    this.setText();
  }

  private onBerryUsed(event: Event) {
    const berryUsedEvent = event as BerryUsedEvent;
    if (!berryUsedEvent
      || berryUsedEvent.berryModifier.pokemonId !== this.pokemon?.id
      || berryUsedEvent.berryModifier.berryType !== BerryType.LEPPA) { // We only care about Leppa berries
      return;
    }

    const foundInfo = this.moveInfo.find(info => info.ppUsed === info.maxPp);
    if (!foundInfo) { // This will only happen on a de-sync of PP tracking
      return;
    }
    foundInfo.ppUsed = Math.max(foundInfo.ppUsed - 10, 0);

    this.setText();
  }

  /** Animates the flyout to either show or hide it by applying a fade and translation */
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
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.MOVE_USED, this.onMoveUsedEvent);
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.BERRY_USED, this.onBerryUsedEvent);

    super.destroy(fromScene);
  }
}
