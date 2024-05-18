import { CommandPhase } from "../phases";
import BattleScene from "../battle-scene";
import { getPokeballName } from "../data/pokeball";
import { addTextObject, TextStyle } from "./text";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import {Button} from "../enums/buttons";
import { IvScannerModifier } from "#app/modifier/modifier.js";

export default class BallUiHandler extends UiHandler {
  private pokeballSelectContainer: Phaser.GameObjects.Container;
  private pokeballSelectBg: Phaser.GameObjects.NineSlice;
  private optionsText: Phaser.GameObjects.Text;
  private countsText: Phaser.GameObjects.Text;

  private ivScannerAdded = false;

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene) {
    super(scene, Mode.BALL);
  }

  setup() {
    const ui = this.getUi();
    
    this.pokeballSelectContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 115, -49);
    this.pokeballSelectContainer.setVisible(false);
    ui.add(this.pokeballSelectContainer);

    this.pokeballSelectBg = addWindow(this.scene, 0, 0, 114, 112);
    this.pokeballSelectBg.setOrigin(0, 1);
    this.pokeballSelectContainer.add(this.pokeballSelectBg);

    let optionsTextContent = '';

    // For every Pokeball, add them to the text content.
    for (let pb = 0; pb < Object.keys(this.scene.pokeballCounts).length; pb++) {
      optionsTextContent += `${getPokeballName(pb)}\n`;
    }
    optionsTextContent += 'Cancel'; // Warning, "Cancel", is used in a RegExp.

    this.optionsText = addTextObject(this.scene, 0, 0, optionsTextContent, TextStyle.WINDOW, { align: 'right', maxLines: 6 });
    this.optionsText.setOrigin(0, 0);
    this.optionsText.setPositionRelative(this.pokeballSelectBg, 42, 9);
    this.optionsText.setLineSpacing(12);
    this.pokeballSelectContainer.add(this.optionsText);

    this.countsText = addTextObject(this.scene, 0, 0, '', TextStyle.WINDOW, { maxLines: 5 });
    this.countsText.setPositionRelative(this.pokeballSelectBg, 18, 9);
    this.countsText.setLineSpacing(12);
    this.pokeballSelectContainer.add(this.countsText);

    this.setCursor(0);
  }

  updatePositions(): void {
    this.optionsText.setPositionRelative(this.pokeballSelectBg, 42, 9);
    this.countsText.setPositionRelative(this.pokeballSelectBg, 18, 9);
  }

  addIvScanner(): void {
    if (this.ivScannerAdded)
      return;

    this.ivScannerAdded = true;
    this.optionsText.setText(
      this.optionsText.text.replace(new RegExp("Cancel", "g"), "IV-Scanner\nCancel")
    );
    this.optionsText.setMaxLines(7);

    this.pokeballSelectBg.height = 112 + 12;
    this.updatePositions();
  }

  show(args: any[]): boolean {
    super.show(args);

    const ivScannerModifier = this.scene.findModifier(m => m instanceof IvScannerModifier) as IvScannerModifier;
    if (ivScannerModifier) {
      this.addIvScanner();
    }

    this.updateCounts();
    this.pokeballSelectContainer.setVisible(true);
    this.setCursor(this.cursor);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const pokeballTypeCount = Object.keys(this.scene.pokeballCounts).length;
    let maxLines = this.optionsText.style.maxLines;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const commandPhase = this.scene.getCurrentPhase() as CommandPhase;
      success = true;
      if (button === Button.ACTION && this.cursor < pokeballTypeCount) {
        if (this.scene.pokeballCounts[this.cursor]) {
          if (commandPhase.handleCommand(Command.BALL, this.cursor)) {
            this.scene.ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
            this.scene.ui.setMode(Mode.MESSAGE);
            success = true;
          }
        } else
          ui.playError();
          
      } else if (button === Button.ACTION && this.cursor < (pokeballTypeCount+1) && this.ivScannerAdded) {
        this.scene.ui.revertMode();
        ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());

        const ivScannerModifier = this.scene.findModifier(m => m instanceof IvScannerModifier) as IvScannerModifier;
        ivScannerModifier.openIvScannerMenu(this.scene);

        success = true;
      } else {
        ui.setMode(Mode.COMMAND, commandPhase.getFieldIndex());
        success = true;
      }
    } else {
      switch (button) {
        case Button.UP:
          success = this.setCursor(this.cursor ? this.cursor - 1 : (maxLines-1));
          break;
        case Button.DOWN:
          success = this.setCursor(this.cursor < (maxLines-1) ? this.cursor + 1 : 0);
          break;
      }
    }

    if (success)
      ui.playSelect();

    return success;
  }

  updateCounts() {
    this.countsText.setText(Object.values(this.scene.pokeballCounts).map(c => `x${c}`).join('\n'));
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.pokeballSelectContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.pokeballSelectBg, 12, 17 + 16 * this.cursor);

    return ret;
  }

  clear() {
    super.clear();
    this.pokeballSelectContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}