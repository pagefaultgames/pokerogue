import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { MoveId } from "#enums/move-id";
import { TextStyle } from "#enums/text-style";
import { UiTheme } from "#enums/ui-theme";
import type { MovesetChangedEvent, SummonDataResetEvent } from "#events/battle-scene";
import { BattleSceneEventType } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
import type { BattleInfo } from "#ui/battle-info";
import { addTextObject } from "#ui/text";
import { fixedInt } from "#utils/common";
import type { TupleOf } from "type-fest";

/**
 * A 4-length tuple consisting of all moves that each {@linkcode Pokemon} has used in the given battle. \
 * Entries that are `undefined` indicate moves which have not been used yet.
 */
type MoveInfoTuple = Partial<TupleOf<4, PokemonMove>>;

/** The restricted width of the flyout which should be drawn to */
const FLYOUT_WIDTH = 118;
/** The restricted height of the flyout which should be drawn to */
const FLYOUT_HEIGHT = 23;

/**
 * A Flyout Menu attached to each Pokemon's {@linkcode BattleInfo} object,
 * showing all revealed moves and their current PP counts.
 */
// TODO: Stop tracking player move uses in this flyout
export class BattleFlyout extends Phaser.GameObjects.Container {
  /** The Pokemon this object is linked to. */
  private pokemon: Pokemon;

  /** The amount of translation animation on the x-axis */
  private readonly translationX: number;
  /** The x-axis point where the flyout should sit when activated */
  private readonly anchorX: number;
  /** The y-axis point where the flyout should sit when activated */
  private readonly anchorY: number;

  /** The background {@linkcode Phaser.GameObjects.Sprite} for the flyout */
  private readonly flyoutBackground: Phaser.GameObjects.Sprite;

  /** The container which defines the drawable dimensions of the flyout */
  private readonly flyoutContainer: Phaser.GameObjects.Container;

  /** The array of {@linkcode Phaser.GameObjects.Text} objects which are drawn on the flyout */
  private readonly flyoutText: Phaser.GameObjects.Text[] = [];
  /** An array of {@linkcode PokemonMove}s used to track moves used by the attached Pokemon. */
  private readonly moveInfo: MoveInfoTuple = [];
  /**
   * A sparse array of {@linkcode PokemonMove}s used to track move slots
   * temporarily overridden by Transform or Mimic-like effects.
   *
   * Reset once `pokemon` switches out via a {@linkcode SummonDataResetEvent}.
   */
  private readonly tempMoveInfo: MoveInfoTuple = [];

  constructor(isPlayer: boolean) {
    super(globalScene, 0, 0);

    this.translationX = isPlayer ? -FLYOUT_WIDTH : FLYOUT_WIDTH;
    this.anchorX = isPlayer ? -130 : -40;
    this.anchorY = -2.5 + (isPlayer ? -18.5 : -13);

    this.setPosition(this.anchorX - this.translationX, this.anchorY) //
      .setAlpha(0);

    this.flyoutBackground = globalScene.add
      .sprite(0, 0, "pbinfo_enemy_boss_stats") //
      .setOrigin(0, 0);

    this.flyoutContainer = globalScene.add.container(44 + (isPlayer ? -FLYOUT_WIDTH : 0), 2);
    this.add([this.flyoutBackground, this.flyoutContainer]);

    // Create a 2x2 grid of text objects for move infos
    for (let i = 0; i < 4; i++) {
      this.flyoutText[i] = addTextObject(
        FLYOUT_WIDTH / 4 + (FLYOUT_WIDTH / 2) * (i % 2),
        FLYOUT_HEIGHT / 4 + (FLYOUT_HEIGHT / 2) * (i < 2 ? 0 : 1),
        "???",
        TextStyle.BATTLE_INFO,
      )
        .setFontSize(45)
        .setLineSpacing(-10)
        .setAlign("center")
        .setOrigin(0.5, 0.5);
    }

    this.flyoutContainer
      .add(this.flyoutText)
      // TODO: What are these rectangles for?
      .add(
        new Phaser.GameObjects.Rectangle(
          globalScene,
          FLYOUT_WIDTH / 2,
          0,
          1,
          FLYOUT_HEIGHT + (globalScene.uiTheme === UiTheme.LEGACY ? 1 : 0),
          0x212121,
        ).setOrigin(0.5, 0),
      )
      .add(
        new Phaser.GameObjects.Rectangle(globalScene, 0, FLYOUT_HEIGHT / 2, FLYOUT_WIDTH + 6, 1, 0x212121) //
          .setOrigin(0, 0.5),
      );
  }

  /**
   * Link the given `Pokemon` to this flyout and subscribe to the {@linkcode BattleSceneEventType.MOVESET_CHANGED} event.
   * @param pokemon - The {@linkcode Pokemon} to link to this flyout
   */
  public initInfo(pokemon: Pokemon): void {
    this.pokemon = pokemon;

    this.name = `Flyout ${getPokemonNameWithAffix(this.pokemon)}`;

    globalScene.eventTarget.addEventListener(BattleSceneEventType.MOVESET_CHANGED, this.#onMovesetChanged);
    globalScene.eventTarget.addEventListener(BattleSceneEventType.SUMMON_DATA_RESET, this.#onSummonDataReset);
  }

  /**
   * Set and format the text of a given {@linkcode Phaser.GameObjects.Text} in the `flyoutText` array.
   * @param index - The 0-indexed position of the flyout text object to update
   */
  private updateText(index: number): void {
    const move = this.tempMoveInfo[index] ?? this.moveInfo[index];
    if (move == null) {
      return;
    }

    const flyoutText = this.flyoutText[index];
    const maxPp = move.getMovePp();
    const currentPp = maxPp - move.ppUsed;
    flyoutText.text = `${move.getName()}  ${currentPp}/${maxPp}`;
  }

  /**
   * Update the corresponding {@linkcode MoveInfo} object in the moveInfo array.
   * @param event - The {@linkcode MovesetChangedEvent} having been emitted
   */
  readonly #onMovesetChanged = (event: MovesetChangedEvent): void => {
    const { pokemonId, move: movesetMove } = event;
    if (pokemonId !== this.pokemon.id || movesetMove.moveId === MoveId.NONE || movesetMove.moveId === MoveId.STRUGGLE) {
      return;
    }

    // Push to either the temporary or permanent move arrays, depending on which array the move was found in.
    const isPermanent = this.pokemon.getMoveset(true).includes(movesetMove);
    const infoArray = isPermanent ? this.moveInfo : this.tempMoveInfo;

    const moveset = this.pokemon.getMoveset(isPermanent);
    const index = moveset.indexOf(movesetMove);
    if (index === -1) {
      console.warn(
        "Updated move passed to move flyout was not found in moveset!",
        movesetMove.getName(),
        moveset.map(p => p.getName()),
      );
      return;
    }

    infoArray[index] = movesetMove;
    this.updateText(index);
  };

  /**
   * Reset the linked Pokemon's temporary moveset data when it is switched out.
   * @param event - The {@linkcode SummonDataResetEvent} having been emitted
   */
  readonly #onSummonDataReset = (event: SummonDataResetEvent) => {
    if (event.pokemonId !== this.pokemon.id) {
      return;
    }

    this.tempMoveInfo.splice(0, this.tempMoveInfo.length);
  };

  /**
   * Animate the flyout to either show or hide the modal.
   * @param visible - Whether the flyout should be shown
   */
  public toggleFlyout(visible: boolean): void {
    // TODO: Figure out how to get this to use Phaser's `visible` property without messing with the animation
    globalScene.tweens.add({
      targets: this,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
  }

  /** @returns Whether the flyout is currently visible. */
  public get isVisible(): boolean {
    return this.alpha > 0;
  }

  public override destroy(fromScene?: boolean): void {
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.MOVESET_CHANGED, this.#onMovesetChanged);
    globalScene.eventTarget.removeEventListener(BattleSceneEventType.SUMMON_DATA_RESET, this.#onSummonDataReset);

    super.destroy(fromScene);
  }
}
