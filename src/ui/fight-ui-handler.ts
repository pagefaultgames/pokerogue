import BattleScene from "../battle-scene";
import { addTextObject, TextStyle } from "../text";
import { Type } from "../type";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";
import * as Utils from "../utils";
import { CommandPhase } from "../battle-phases";

export default class FightUiHandler extends UiHandler {
  private movesContainer: Phaser.GameObjects.Container;
  private typeIcon: Phaser.GameObjects.Sprite;
  private ppText: Phaser.GameObjects.Text;
  private cursorObj: Phaser.GameObjects.Image;

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

  show(args: any[]) {
    super.show(args);

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.bg.setTexture('bg_fight');
    this.setCursor(this.cursor);
    this.displayMoves();
  }

  processInput(keyCode: integer) {
    const ui = this.getUi();
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;

    let success = false;

    if (keyCode === keyCodes.X || keyCode === keyCodes.Z) {
      if (keyCode === keyCodes.Z) {
        if (((this.scene as BattleScene).getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, this.cursor))
          success = true;
      } else {
        ui.setMode(Mode.COMMAND);
        success = true;
      }
    } else {
      switch (keyCode) {
        case keyCodes.UP:
          if (this.cursor >= 2)
            success = this.setCursor(this.cursor - 2);
          break;
        case keyCodes.DOWN:
          if (this.cursor < 2)
            success = this.setCursor(this.cursor + 2);
          break;
        case keyCodes.LEFT:
          if (this.cursor % 2 === 1)
            success = this.setCursor(this.cursor - 1);
          break;
        case keyCodes.RIGHT:
          if (this.cursor % 2 === 0)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      ui.add(this.cursorObj);
    }

    const moveset = (this.scene as BattleScene).getPlayerPokemon().moveset;

    const hasMove = cursor < moveset.length;

    if (hasMove) {
      const pokemonMove = moveset[cursor];
      this.typeIcon.setTexture('types', Type[pokemonMove.getMove().type].toLowerCase());

      const maxPP = pokemonMove.getMove().pp + pokemonMove.ppUp;
      const pp = maxPP - pokemonMove.ppUsed;

      this.ppText.setText(`${Utils.padInt(pp, 2, '  ')}/${Utils.padInt(maxPP, 2, '  ')}`);
    }

    this.typeIcon.setVisible(hasMove);
    this.ppText.setVisible(hasMove);

    this.cursorObj.setPosition(13 + (cursor % 2 === 1 ? 100 : 0), -31 + (cursor >= 2 ? 15 : 0));

    return ret;
  }

  displayMoves() {
    const moveset = (this.scene as BattleScene).getPlayerPokemon().moveset;
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