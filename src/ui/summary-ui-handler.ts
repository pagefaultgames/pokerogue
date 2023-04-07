import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";
import * as Utils from "../utils";
import { PlayerPokemon } from "../pokemon";
import { Type } from "../type";
import { TextStyle, addTextObject } from "../text";
import Move from "../move";

enum Page {
  PROFILE,
  MOVES
}

export enum SummaryUiMode {
  DEFAULT,
  LEARN_MOVE
}

export default class SummaryUiHandler extends UiHandler {
  private summaryUiMode: SummaryUiMode;

  private summaryContainer: Phaser.GameObjects.Container;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private summaryPageContainer: Phaser.GameObjects.Container;
  private movesContainer: Phaser.GameObjects.Container;
  private moveDescriptionText: Phaser.GameObjects.Text;
  private moveCursorObj: Phaser.GameObjects.Sprite;
  private selectedMoveCursorObj: Phaser.GameObjects.Sprite;
  private moveRowsContainer: Phaser.GameObjects.Container;
  private extraMoveRowContainer: Phaser.GameObjects.Container;
  private summaryPageTransitionContainer: Phaser.GameObjects.Container;

  private moveDescriptionScrollTween: Phaser.Tweens.Tween;
  private moveCursorBlinkTimer: Phaser.Time.TimerEvent;

  private pokemon: PlayerPokemon;
  private newMove: Move;
  private moveSelectFunction: Function;
  private transitioning: boolean;

  private moveSelect: boolean;
  private moveCursor: integer;
  private selectedMoveIndex: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.SUMMARY);
  }

  setup() {
    const ui = this.getUi();

    this.summaryContainer = this.scene.add.container(0, 0);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    const summaryBg = this.scene.add.image(0, 0, 'summary_bg');
    summaryBg.setOrigin(0, 1);
    this.summaryContainer.add(summaryBg);

    this.pokemonSprite = this.scene.add.sprite(56, -106, `pkmn__sub`);
    this.summaryContainer.add(this.pokemonSprite);

    const getSummaryPageBg = () => {
      const ret = this.scene.add.sprite(0, 0, this.getPageKey(0));
      ret.setOrigin(0, 1);
      return ret;
    };

    this.summaryContainer.add((this.summaryPageContainer = this.scene.add.container(106, 0)));
    this.summaryPageContainer.add(getSummaryPageBg());
    this.summaryPageContainer.setVisible(false);
    this.summaryContainer.add((this.summaryPageTransitionContainer = this.scene.add.container(106, 0)));
    this.summaryPageTransitionContainer.add(getSummaryPageBg());
    this.summaryPageTransitionContainer.setVisible(false);
  }

  getPageKey(page?: integer) {
    if (page === undefined)
      page = this.cursor;
    return `summary_${Page[page].toLowerCase()}`;
  }

  show(args: any[]) {
    super.show(args);

    this.pokemon = args[0] as PlayerPokemon;
    this.summaryUiMode = args.length > 1 ? args[1] as SummaryUiMode : SummaryUiMode.DEFAULT;

    this.summaryContainer.setVisible(true);
    this.cursor = -1;

    this.pokemonSprite.play(this.pokemon.getSpriteKey());
    this.pokemon.cry();

    switch (this.summaryUiMode) {
      case SummaryUiMode.DEFAULT:
        this.setCursor(Page.PROFILE);
        break;
      case SummaryUiMode.LEARN_MOVE:
        this.newMove = args[2] as Move;
        this.moveSelectFunction = args[3] as Function;

        this.setCursor(Page.MOVES);
        this.showMoveSelect();
        break;
    }
  }

  processInput(keyCode: integer) {
    if (this.transitioning)
      return;

    const ui = this.getUi();
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;

    let success = false;

    if (this.moveSelect) {
      if (keyCode === keyCodes.Z) {
        if (this.moveCursor < this.pokemon.moveset.length) {
          if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE)
            this.moveSelectFunction(this.moveCursor);
          else {
            if (this.selectedMoveIndex === -1) {
              this.selectedMoveIndex = this.moveCursor;
              this.setCursor(this.moveCursor);
            } else {
              if (this.selectedMoveIndex !== this.moveCursor) {
                const tempMove = this.pokemon.moveset[this.selectedMoveIndex];
                this.pokemon.moveset[this.selectedMoveIndex] = this.pokemon.moveset[this.moveCursor];
                this.pokemon.moveset[this.moveCursor] = tempMove;
                
                const selectedMoveRow = this.moveRowsContainer.getAt(this.selectedMoveIndex) as Phaser.GameObjects.Container;
                const switchMoveRow = this.moveRowsContainer.getAt(this.moveCursor) as Phaser.GameObjects.Container;

                this.moveRowsContainer.moveTo(selectedMoveRow, this.moveCursor);
                this.moveRowsContainer.moveTo(switchMoveRow, this.selectedMoveIndex);

                selectedMoveRow.setY(this.moveCursor * 16);
                switchMoveRow.setY(this.selectedMoveIndex * 16);
              }

              this.selectedMoveIndex = -1;
              if (this.selectedMoveCursorObj) {
                this.selectedMoveCursorObj.destroy();
                this.selectedMoveCursorObj = null;
              }
            }
          }
          success = true;
        } else if (this.moveCursor === 4)
          this.processInput(keyCodes.X);
        else
          ui.playError();
      } else if (keyCode === keyCodes.X) {
        this.hideMoveSelect();
        success = true;
      } else {
        switch (keyCode) {
          case keyCodes.UP:
            success = this.setCursor(this.moveCursor ? this.moveCursor - 1 : 4);
            break;
          case keyCodes.DOWN:
            success = this.setCursor(this.moveCursor < 4 ? this.moveCursor + 1 : 0);
            break;
        }
      }
    } else {
      if (keyCode === keyCodes.Z) {
        if (this.cursor === Page.MOVES) {
          this.showMoveSelect();
          success = true;
        }
      } else if (keyCode === keyCodes.X) {
        ui.setMode(Mode.PARTY);
        success = true;
      } else {
        const pages = Utils.getEnumValues(Page);
        switch (keyCode) {
          case keyCodes.LEFT:
            if (this.cursor)
              success = this.setCursor(this.cursor - 1);
            break;
          case keyCodes.RIGHT:
            if (this.cursor < pages.length - 1)
              success = this.setCursor(this.cursor + 1);
            break;
        }
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    let changed: boolean;
    
    if (this.moveSelect) {
      changed = this.moveCursor !== cursor;
      if (changed) {
        this.moveCursor = cursor;

        const selectedMove = this.getSelectedMove();

        this.moveDescriptionText.setText(selectedMove?.effect || '');
        const moveDescriptionLineCount = Math.floor(this.moveDescriptionText.displayHeight / 14.83);

        if (this.moveDescriptionScrollTween) {
          this.moveDescriptionScrollTween.remove();
          this.moveDescriptionScrollTween = null;
        }

        if (moveDescriptionLineCount > 3) {
          this.moveDescriptionText.setY(84);
          this.moveDescriptionScrollTween = this.scene.tweens.add({
            targets: this.moveDescriptionText,
            delay: 2000,
            loop: -1,
            loopDelay: 2000,
            duration: (moveDescriptionLineCount - 3) * 2000,
            y: `-=${14.83 * (moveDescriptionLineCount - 3)}`,
            onLoop: () => {
              this.moveDescriptionText.setY(84);
            }
          });
        }
      }

      if (!this.moveCursorObj) {
        this.moveCursorObj = this.scene.add.sprite(-2, 0, 'summary_moves_cursor', 'highlight');
        this.moveCursorObj.setOrigin(0, 1);
        this.movesContainer.add(this.moveCursorObj);
      }

      this.moveCursorObj.setY(16 * this.moveCursor + 1);

      if (this.moveCursorBlinkTimer)
        this.moveCursorBlinkTimer.destroy();
      this.moveCursorObj.setVisible(true);
      this.moveCursorBlinkTimer = this.scene.time.addEvent({
        loop: true,
        delay: 600,
        callback: () => {
          this.moveCursorObj.setVisible(false);
          this.scene.time.delayedCall(100, () => {
            this.moveCursorObj.setVisible(true);
          });
        }
      });

      if (this.selectedMoveIndex > -1) {
        if (!this.selectedMoveCursorObj) {
          this.selectedMoveCursorObj = this.scene.add.sprite(-2, 0, 'summary_moves_cursor', 'select');
          this.selectedMoveCursorObj.setOrigin(0, 1);
          this.movesContainer.add(this.selectedMoveCursorObj);
          this.movesContainer.moveBelow(this.selectedMoveCursorObj, this.moveCursorObj);
        }

        this.selectedMoveCursorObj.setY(16 * this.selectedMoveIndex + 1);
      }
    } else {
      changed = this.cursor !== cursor;
      if (changed) {
        const forward = this.cursor < cursor;
        this.cursor = cursor;

        if (this.summaryPageContainer.visible) {
          this.transitioning = true;
          this.populatePageContainer(this.summaryPageTransitionContainer, forward ? cursor : cursor + 1);
          if (forward)
            this.summaryPageTransitionContainer.x += 214;
          else
            this.populatePageContainer(this.summaryPageContainer);
          this.scene.tweens.add({
            targets: this.summaryPageTransitionContainer,
            x: forward ? '-=214' : '+=214',
            duration: 250,
            onComplete: () => {
              if (forward)
                this.populatePageContainer(this.summaryPageContainer);
              else
                this.summaryPageTransitionContainer.x -= 214;
              this.summaryPageTransitionContainer.setVisible(false);
              this.transitioning = false;
            }
          });
          this.summaryPageTransitionContainer.setVisible(true);
        } else {
          this.populatePageContainer(this.summaryPageContainer);
          this.summaryPageContainer.setVisible(true);
        }
      }
    }

    return changed;
  }

  populatePageContainer(pageContainer: Phaser.GameObjects.Container, page?: Page) {
    if (page === undefined)
      page = this.cursor;

    if (pageContainer.getAll().length > 1) {
      if (this.movesContainer)
        this.movesContainer.removeAll(true);
      pageContainer.removeBetween(1, undefined, true);
    }
    const pageBg =  (pageContainer.getAt(0) as Phaser.GameObjects.Sprite);
    pageBg.setTexture(this.getPageKey(page));
    
    switch (page) {
      case Page.MOVES:
        this.movesContainer = this.scene.add.container(5, -pageBg.height + 26);
        pageContainer.add(this.movesContainer);

        this.extraMoveRowContainer = this.scene.add.container(0, 64);
        this.extraMoveRowContainer.setVisible(false);
        this.movesContainer.add(this.extraMoveRowContainer);

        const extraRowOverlay = this.scene.add.image(-2, 1, 'summary_moves_overlay_row');
        extraRowOverlay.setOrigin(0, 1);
        this.extraMoveRowContainer.add(extraRowOverlay);

        const extraRowText = addTextObject(this.scene, 35, 0, this.summaryUiMode === SummaryUiMode.LEARN_MOVE ? this.newMove.name : 'CANCEL',
          this.summaryUiMode === SummaryUiMode.LEARN_MOVE ? TextStyle.SUMMARY_RED : TextStyle.SUMMARY);
        extraRowText.setOrigin(0, 1);
        this.extraMoveRowContainer.add(extraRowText);

        this.moveRowsContainer = this.scene.add.container(0, 0);
        this.movesContainer.add(this.moveRowsContainer);

        for (let m = 0; m < 4; m++) {
          const move = m < this.pokemon.moveset.length ? this.pokemon.moveset[m] : null;
          const moveRowContainer = this.scene.add.container(0, 16 * m);
          this.moveRowsContainer.add(moveRowContainer);

          if (move) {
            const typeIcon = this.scene.add.sprite(0, 0, 'types', Type[move.getMove().type].toLowerCase());
            typeIcon.setOrigin(0, 1);
            moveRowContainer.add(typeIcon);
          }

          const moveText = addTextObject(this.scene, 35, 0, move ? move.getName() : '-', TextStyle.SUMMARY);
          moveText.setOrigin(0, 1);
          moveRowContainer.add(moveText);
        }

        this.moveDescriptionText = addTextObject(this.scene, 2, 84, '', TextStyle.WINDOW, { wordWrap: { width: 900 } });
        this.movesContainer.add(this.moveDescriptionText);

        const maskRect = this.scene.make.graphics({});
        maskRect.setScale(6);
        maskRect.fillStyle(0xFFFFFF);
        maskRect.beginPath();
        maskRect.fillRect(112, 130, 150, 46);

        const moveDescriptionTextMask = maskRect.createGeometryMask();

        this.moveDescriptionText.setMask(moveDescriptionTextMask);
        break;
    }
  }

  getSelectedMove(): Move {
    if (this.cursor !== Page.MOVES)
      return null;

    if (this.moveCursor < 4 && this.moveCursor < this.pokemon.moveset.length)
      return this.pokemon.moveset[this.moveCursor].getMove();
    else if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.moveCursor === 4)
      return this.newMove;
    return null;
  }

  showMoveSelect() {
    this.moveSelect = true;
    this.extraMoveRowContainer.setVisible(true);
    this.selectedMoveIndex = -1;
    this.setCursor(0);
  }

  hideMoveSelect() {
    if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
      this.moveSelectFunction(4);
      return;
    }

    this.moveSelect = false;
    this.extraMoveRowContainer.setVisible(false);
    if (this.moveCursorBlinkTimer) {
      this.moveCursorBlinkTimer.destroy();
      this.moveCursorBlinkTimer = null;
    }
    if (this.moveCursorObj) {
      this.moveCursorObj.destroy();
      this.moveCursorObj = null;
    }
    if (this.selectedMoveCursorObj) {
      this.selectedMoveCursorObj.destroy();
      this.selectedMoveCursorObj = null;
    }
  }

  clear() {
    super.clear();
    this.pokemon = null;
    this.cursor = -1;
    this.newMove = null;
    this.moveSelectFunction = null;
    this.summaryContainer.setVisible(false);
    this.summaryPageContainer.setVisible(false);
  }
}
