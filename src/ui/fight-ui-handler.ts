import BattleScene, { Button } from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import { Type } from "../data/type";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { CommandPhase } from "../battle-phases";

export default class FightUiHandler extends UiHandler {
  private movesContainer: Phaser.GameObjects.Container;
  private typeIcon: Phaser.GameObjects.Sprite;
  private ppText: Phaser.GameObjects.Text;
  private cursorObj: Phaser.GameObjects.Image;

  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;

  constructor(scene: BattleScene) {
    super(scene, Mode.FIGHT);
  }

  setup() {
    const ui = this.getUi();
    
    this.movesContainer = this.scene.add.container(18, -38.7);
    ui.add(this.movesContainer);

    this.typeIcon = this.scene.add.sprite((this.scene.game.canvas.width / 6) - 33, -31, 'types', 'unknown');
    this.typeIcon.setVisible(false);
    ui.add(this.typeIcon);

    this.ppText = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 18, -15.5, '    /    ', TextStyle.WINDOW);
    this.ppText.setOrigin(1, 0.5);
    this.ppText.setVisible(false);
    ui.add(this.ppText);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.fieldIndex = args.length ? args[0] as integer : 0;

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.commandWindow.setVisible(false);
    messageHandler.movesWindowContainer.setVisible(true);
    this.setCursor(this.getCursor());
    this.displayMoves();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        if ((this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, cursor, false))
          success = true;
        else
          ui.playError();
      } else {
        ui.setMode(Mode.COMMAND, this.fieldIndex);
        success = true;
      }
    } else {
      switch (button) {
        case Button.UP:
          if (cursor >= 2)
            success = this.setCursor(cursor - 2);
          break;
        case Button.DOWN:
          if (cursor < 2)
            success = this.setCursor(cursor + 2);
          break;
        case Button.LEFT:
          if (cursor % 2 === 1)
            success = this.setCursor(cursor - 1);
          break;
        case Button.RIGHT:
          if (cursor % 2 === 0)
            success = this.setCursor(cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();

    return success;
  }

  getCursor(): integer {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();

    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex)
        this.cursor = cursor;
      else
        this.cursor2 = cursor;
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      ui.add(this.cursorObj);
    }

    const moveset = (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getMoveset();

    const hasMove = cursor < moveset.length;

    if (hasMove) {
      const pokemonMove = moveset[cursor];
      this.typeIcon.setTexture('types', Type[pokemonMove.getMove().type].toLowerCase());

      const maxPP = pokemonMove.getMovePp();
      const pp = maxPP - pokemonMove.ppUsed;

      this.ppText.setText(`${Utils.padInt(pp, 2, '  ')}/${Utils.padInt(maxPP, 2, '  ')}`);
    }

    this.typeIcon.setVisible(hasMove);
    this.ppText.setVisible(hasMove);

    this.cursorObj.setPosition(13 + (cursor % 2 === 1 ? 100 : 0), -31 + (cursor >= 2 ? 15 : 0));

    return changed;
  }

  displayMoves() {
    const moveset = (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getMoveset();
    for (let m = 0; m < 4; m++) {
      const moveText = addTextObject(this.scene, m % 2 === 0 ? 0 : 100, m < 2 ? 0 : 16, '-', TextStyle.WINDOW);
      if (m < moveset.length)
        moveText.setText(moveset[m].getName());
      this.movesContainer.add(moveText);
    }
  }

  clear() {
    super.clear();
    this.clearMoves();
    this.typeIcon.setVisible(false);
    this.ppText.setVisible(false);
    this.eraseCursor();
  }

  clearMoves() {
    this.movesContainer.removeAll(true);
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}