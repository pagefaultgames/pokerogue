import { getPokeballName } from "../data/pokeball";
import { addTextObject, getTextStyleOptions, TextStyle } from "./text";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import { Button } from "#enums/buttons";
import type { CommandPhase } from "#app/phases/command-phase";
import { globalScene } from "#app/global-scene";

export default class BallUiHandler extends UiHandler {
  private pokeballSelectContainer: Phaser.GameObjects.Container;
  private pokeballSelectBg: Phaser.GameObjects.NineSlice;
  private countsText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.Image | null;

  private scale: number = 0.1666666667;

  constructor() {
    super(Mode.BALL);
  }

  setup() {
    const ui = this.getUi();

    this.scale = getTextStyleOptions(TextStyle.WINDOW, globalScene.uiTheme).scale;

    let optionsTextContent = "";

    for (let pb = 0; pb < Object.keys(globalScene.pokeballCounts).length; pb++) {
      optionsTextContent += `${getPokeballName(pb)}\n`;
    }
    optionsTextContent += "Cancel";
    const optionsText = addTextObject(0, 0, optionsTextContent, TextStyle.WINDOW, { align: "right", maxLines: 6 });
    const optionsTextWidth = optionsText.displayWidth;
    this.pokeballSelectContainer = globalScene.add.container((globalScene.game.canvas.width / 6) - 51 - Math.max(64, optionsTextWidth), -49);
    this.pokeballSelectContainer.setVisible(false);
    ui.add(this.pokeballSelectContainer);

    this.pokeballSelectBg = addWindow(0, 0, 50 + Math.max(64, optionsTextWidth), 32 + 480 * this.scale);
    this.pokeballSelectBg.setOrigin(0, 1);
    this.pokeballSelectContainer.add(this.pokeballSelectBg);
    this.pokeballSelectContainer.add(optionsText);
    optionsText.setOrigin(0, 0);
    optionsText.setPositionRelative(this.pokeballSelectBg, 42, 9);
    optionsText.setLineSpacing(this.scale * 72);

    this.countsText = addTextObject(0, 0, "", TextStyle.WINDOW, { maxLines: 5 });
    this.countsText.setPositionRelative(this.pokeballSelectBg, 18, 9);
    this.countsText.setLineSpacing(this.scale * 72);
    this.pokeballSelectContainer.add(this.countsText);

    this.setCursor(0);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.updateCounts();
    this.pokeballSelectContainer.setVisible(true);
    this.setCursor(this.cursor);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const pokeballTypeCount = Object.keys(globalScene.pokeballCounts).length;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const commandPhase = globalScene.getCurrentPhase() as CommandPhase;
      success = true;
      if (button === Button.ACTION && this.cursor < pokeballTypeCount) {
        if (globalScene.pokeballCounts[this.cursor]) {
          if (commandPhase.handleCommand(Command.BALL, this.cursor)) {
            globalScene.ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
            globalScene.ui.setMode(Mode.MESSAGE);
            success = true;
          }
        } else {
          ui.playError();
        }
      } else {
        ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
        success = true;
      }
    } else {
      switch (button) {
        case Button.UP:
          success = this.setCursor(this.cursor ? this.cursor - 1 : pokeballTypeCount);
          break;
        case Button.DOWN:
          success = this.setCursor(this.cursor < pokeballTypeCount ? this.cursor + 1 : 0);
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  updateCounts() {
    this.countsText.setText(Object.values(globalScene.pokeballCounts).map(c => `x${c}`).join("\n"));
  }

  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.pokeballSelectContainer.add(this.cursorObj);
    }

    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.pokeballSelectBg, 12, 15 + (6 + this.cursor * 96) * this.scale);

    return ret;
  }

  clear() {
    super.clear();
    this.pokeballSelectContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
