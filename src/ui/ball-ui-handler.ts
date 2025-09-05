import { globalScene } from "#app/global-scene";
import { getPokeballName } from "#data/pokeball";
import { Button } from "#enums/buttons";
import { Command } from "#enums/command";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { CommandPhase } from "#phases/command-phase";
import { addTextObject, getTextStyleOptions } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

export class BallUiHandler extends UiHandler {
  private pokeballSelectContainer: Phaser.GameObjects.Container;
  private pokeballSelectBg: Phaser.GameObjects.NineSlice;
  private countsText: Phaser.GameObjects.Text;
  private optionsText: Phaser.GameObjects.Text;
  private cursorOffSet: number = 0;

  private cursorObj: Phaser.GameObjects.Image | null;

  private scale = 0.1666666667;

  constructor() {
    super(UiMode.BALL);
  }

  setup() {
    const ui = this.getUi();

    this.scale = getTextStyleOptions(TextStyle.WINDOW).scale;

    let optionsTextContent = "";

    for (let pb = 0; pb < 6; pb++) {
      optionsTextContent += `${getPokeballName(pb)}\n`;
    }
    optionsTextContent += i18next.t("commandUiHandler:ballCancel");
    this.optionsText = addTextObject(0, 0, optionsTextContent, TextStyle.WINDOW, { align: "right", maxLines: 6 });
    const optionsTextWidth = this.optionsText.displayWidth;
    this.pokeballSelectContainer = globalScene.add.container(
      globalScene.scaledCanvas.width - 51 - Math.max(64, optionsTextWidth),
      -49,
    );
    this.pokeballSelectContainer.setVisible(false);
    ui.add(this.pokeballSelectContainer);

    this.pokeballSelectBg = addWindow(0, 0, 50 + Math.max(64, optionsTextWidth), 32 + 480 * this.scale);
    this.pokeballSelectBg.setOrigin(0, 1);
    this.pokeballSelectContainer.add(this.pokeballSelectBg);
    this.pokeballSelectContainer.add(this.optionsText);
    this.optionsText.setOrigin(0, 0);
    this.optionsText.setPositionRelative(this.pokeballSelectBg, 42, 9);
    this.optionsText.setLineSpacing(this.scale * 72);

    this.countsText = addTextObject(0, 0, "", TextStyle.WINDOW, {
      maxLines: 6,
    });
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
      const commandPhase = globalScene.phaseManager.getCurrentPhase() as CommandPhase;
      success = true;
      if (button === Button.ACTION && this.cursor < pokeballTypeCount) {
        if (globalScene.pokeballCounts[this.cursor]) {
          if (commandPhase.handleCommand(Command.BALL, this.cursor)) {
            globalScene.ui.setMode(UiMode.COMMAND, commandPhase.getFieldIndex());
            globalScene.ui.setMode(UiMode.MESSAGE);
            success = true;
          }
        } else {
          ui.playError();
        }
      } else {
        ui.setMode(UiMode.COMMAND, commandPhase.getFieldIndex());
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
    this.countsText.setText(
      Object.values(globalScene.pokeballCounts)
        .slice(this.cursorOffSet)
        .map(c => `×${c}`)
        .join("\n"),
    );
  }

  updatePokeballs() {
    let optionsTextContent = "";
    let totalDisplayed = Object.keys(globalScene.pokeballCounts).length - this.cursorOffSet > 5 ? 6 : 5;
    
    for (let pb = 0; pb < totalDisplayed; pb++) {
      optionsTextContent += `${getPokeballName(pb + this.cursorOffSet)}\n`;
    }
    if (totalDisplayed == 5){
      optionsTextContent += i18next.t("commandUiHandler:ballCancel");
    }
    this.optionsText.setText(
      optionsTextContent
    );
  }

  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.pokeballSelectContainer.add(this.cursorObj);
    }
    if (this.cursor > this.cursorOffSet + 5){
      this.cursorOffSet = this.cursor - 5
    }
    else if (this.cursor < this.cursorOffSet){
      this.cursorOffSet = this.cursor;
    }
    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.pokeballSelectBg, 12, 15 + (6 + (this.cursor - this.cursorOffSet) * 96) * this.scale);
    this.updateCounts();
    this.updatePokeballs();
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
