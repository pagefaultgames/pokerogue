import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { MoveId } from "#enums/move-id";
import { UiTheme } from "#enums/ui-theme";
import type { MovesetChangedEvent } from "#events/battle-scene";
import { BattleSceneEventType } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { BattleInfo } from "#ui/battle-info";
import { addTextObject, TextStyle } from "#ui/text";
import { fixedInt } from "#utils/common";

/** Container for info about the {@linkcode PokemonMove}s having been */
interface MoveInfo {
  /** The name of the {@linkcode Move} having been used. */
  name: string;
  /** The {@linkcode PokemonMove} having been used. */
  move: PokemonMove;
}

type MoveInfoTuple = [MoveInfo?, MoveInfo?, MoveInfo?, MoveInfo?];

/** A Flyout Menu attached to each {@linkcode BattleInfo} object on the field UI */
export class BattleFlyout extends Phaser.GameObjects.Container {
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
  /** An array of {@linkcode MoveInfo}s used to track moves for the {@linkcode Pokemon} linked to the flyout. */
  private moveInfo: MoveInfoTuple = [];

  /** Current state of the flyout's visibility */
  public flyoutVisible = false;

  // Stores callbacks in a variable so they can be unsubscribed from when destroyed
  private readonly onMovesetChangedEvent = (event: MovesetChangedEvent) => this.onMovesetChanged(event);

  constructor(player: boolean) {
    super(globalScene, 0, 0);

    // Note that all player based flyouts are disabled. This is included in case of future development
    this.player = player;

    this.translationX = this.player ? -this.flyoutWidth : this.flyoutWidth;
    this.anchorX = this.player ? -130 : -40;
    this.anchorY = -2.5 + (this.player ? -18.5 : -13);

    this.flyoutParent = globalScene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    // Load the background image
    this.flyoutBackground = globalScene.add.sprite(0, 0, "pbinfo_enemy_boss_stats");
    this.flyoutBackground.setOrigin(0, 0);

    this.flyoutParent.add(this.flyoutBackground);

    this.flyoutContainer = globalScene.add.container(44 + (this.player ? -this.flyoutWidth : 0), 2);
    this.flyoutParent.add(this.flyoutContainer);

    // Loops through and sets the position of each text object according to the width and height of the flyout
    for (let i = 0; i < 4; i++) {
      this.flyoutText[i] = addTextObject(
        this.flyoutWidth / 4 + (this.flyoutWidth / 2) * (i % 2),
        this.flyoutHeight / 4 + (this.flyoutHeight / 2) * (i < 2 ? 0 : 1),
        "???",
        TextStyle.BATTLE_INFO,
      );
      this.flyoutText[i].setFontSize(45);
      this.flyoutText[i].setLineSpacing(-10);
      this.flyoutText[i].setAlign("center");
      this.flyoutText[i].setOrigin();
    }

    this.flyoutContainer.add(this.flyoutText);

    this.flyoutContainer.add(
      new Phaser.GameObjects.Rectangle(
        globalScene,
        this.flyoutWidth / 2,
        0,
        1,
        this.flyoutHeight + (globalScene.uiTheme === UiTheme.LEGACY ? 1 : 0),
        0x212121,
      ).setOrigin(0.5, 0),
    );
    this.flyoutContainer.add(
      new Phaser.GameObjects.Rectangle(
        globalScene,
        0,
        this.flyoutHeight / 2,
        this.flyoutWidth + 6,
        1,
        0x212121,
      ).setOrigin(0, 0.5),
    );
  }

  /**
   * Link the given {@linkcode Pokemon} to this flyout and subscribe to the {@linkcode BattleSceneEventType.MOVESET_CHANGED} event.
   * @param pokemon - The {@linkcode Pokemon} to link to this flyout
   */
  public initInfo(pokemon: Pokemon): void {
    this.pokemon = pokemon;

    this.name = `Flyout ${getPokemonNameWithAffix(this.pokemon)}`;
    this.flyoutParent.name = `Flyout Parent ${getPokemonNameWithAffix(this.pokemon)}`;

    globalScene.eventTarget.addEventListener(BattleSceneEventType.MOVESET_CHANGED, this.onMovesetChangedEvent);
  }

  /**
   * Set and formats the text property for all {@linkcode Phaser.GameObjects.Text} in the flyoutText array.
   * @param index - The 0-indexed position of the flyout text object to update
   */
  private updateText(index: number) {
    const flyoutText = this.flyoutText[index];
    const moveInfo = this.moveInfo[index];
    if (!moveInfo) {
      return;
    }

    const maxPP = moveInfo.move.getMovePp();
    const currentPp = -moveInfo.move.ppUsed;
    flyoutText.text = `${moveInfo.name}  ${currentPp}/${maxPP}`;
  }

  /**
   * Update the corresponding {@linkcode MoveInfo} object in the moveInfo array.
   * @param event - The {@linkcode MovesetChangedEvent} having been emitted
   */
  private onMovesetChanged(event: MovesetChangedEvent): void {
    // Ignore other Pokemon's moves as well as Struggle and MoveId.NONE
    if (
      event.pokemonId !== this.pokemon.id ||
      event.move.moveId === MoveId.NONE ||
      event.move.moveId === MoveId.STRUGGLE
    ) {
      return;
    }

    // If we already have a move in that slot, update the corresponding slot of the Pokemon's moveset.
    const index = this.pokemon.getMoveset().indexOf(event.move);
    if (index === -1) {
      console.error("Updated move passed to move flyout was undefined!");
    }
    if (this.moveInfo[index]) {
      this.moveInfo[index].move = event.move;
    } else {
      this.moveInfo[index] = {
        name: event.move.getMove().name,
        move: event.move,
      };
    }

    this.updateText(index);
  }

  /** Animates the flyout to either show or hide it by applying a fade and translation */
  public toggleFlyout(visible: boolean): void {
    this.flyoutVisible = visible;

    globalScene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
  }

  /** Destroy this element and remove all associated listeners. */
  public destroy(fromScene?: boolean): void {
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.MOVESET_CHANGED, this.onMovesetChangedEvent);

    super.destroy(fromScene);
  }
}
