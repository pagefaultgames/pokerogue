import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { MoveId } from "#enums/move-id";
import { TextStyle } from "#enums/text-style";
import { UiTheme } from "#enums/ui-theme";
import type { MovesetChangedEvent, SummonDataResetEvent } from "#events/battle-scene";
import { BattleSceneEventType } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { BattleInfo } from "#ui/battle-info";
import { addTextObject } from "#ui/text";
import { fixedInt } from "#utils/common";

/** Container for info about a given {@linkcode PokemonMove} having been used */
interface MoveInfo {
  /** The name of the {@linkcode Move} having been used. */
  name: string;
  /** The {@linkcode PokemonMove} having been used. */
  move: PokemonMove;
}

/**
 * A 4-length tuple consisting of all moves that each {@linkcode Pokemon} has used in the given battle.
 * Entries that are `undefined` indicate moves which have not been used yet.
 */
type MoveInfoTuple = [MoveInfo?, MoveInfo?, MoveInfo?, MoveInfo?];

/**
 * A Flyout Menu attached to each Pokemon's {@linkcode BattleInfo} object,
 * showing all revealed moves and their current PP counts.
 * @todo Stop tracking player move usages
 */
export class BattleFlyout extends Phaser.GameObjects.Container {
  /** Is this object linked to a player's Pokemon? */
  private player: boolean;

  /** The Pokemon this object is linked to. */
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
  /**
   * An array of {@linkcode MoveInfo}s used to track move slots
   * temporarily overridden by {@linkcode MoveId.TRANSFORM} or {@linkcode MoveId.MIMIC}.
   *
   * Reset once {@linkcode pokemon} switches out via a {@linkcode SummonDataResetEvent}.
   */
  private tempMoveInfo: MoveInfoTuple = [];

  /** Current state of the flyout's visibility */
  public flyoutVisible = false;

  // Stores callbacks in a variable so they can be unsubscribed from when destroyed
  private readonly onMovesetChangedEvent = (event: MovesetChangedEvent) => this.onMovesetChanged(event);
  private readonly onSummonDataResetEvent = (event: SummonDataResetEvent) => this.onSummonDataReset(event);

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
    globalScene.eventTarget.addEventListener(BattleSceneEventType.SUMMON_DATA_RESET, this.onSummonDataResetEvent);
  }

  /**
   * Set and formats the text property for all {@linkcode Phaser.GameObjects.Text} in the flyoutText array.
   * @param index - The 0-indexed position of the flyout text object to update
   */
  private updateText(index: number): void {
    // Use temp move info if present, or else the regular move info.
    const moveInfo = this.tempMoveInfo[index] ?? this.moveInfo[index];
    if (!moveInfo) {
      return;
    }

    const flyoutText = this.flyoutText[index];
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
      event.pokemonId !== this.pokemon.id
      || event.move.moveId === MoveId.NONE
      || event.move.moveId === MoveId.STRUGGLE
    ) {
      return;
    }

    // Push to either the temporary or permanent move arrays, depending on which array the move was found in.
    const isPermanent = this.pokemon.getMoveset(true).includes(event.move);
    const infoArray = isPermanent ? this.moveInfo : this.tempMoveInfo;

    const index = this.pokemon.getMoveset(isPermanent).indexOf(event.move);
    if (index === -1) {
      throw new Error("Updated move passed to move flyout was not found in moveset!");
    }

    // Update the corresponding slot in the info array with either a new entry or an updated PP reading.
    if (infoArray[index]) {
      infoArray[index].move = event.move;
    } else {
      infoArray[index] = {
        name: event.move.getMove().name,
        move: event.move,
      };
    }

    this.updateText(index);
  }

  /**
   * Reset the linked Pokemon's temporary moveset override when it is switched out.
   * @param event - The {@linkcode SummonDataResetEvent} having been emitted
   */
  private onSummonDataReset(event: SummonDataResetEvent): void {
    if (event.pokemonId !== this.pokemon.id) {
      // Wrong pokemon
      return;
    }

    this.tempMoveInfo = [];
  }

  /**
   * Animate the flyout to either show or hide the modal.
   * @param visible - Whether the the flyout should be shown
   */
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
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.SUMMON_DATA_RESET, this.onSummonDataResetEvent);

    super.destroy(fromScene);
  }
}
