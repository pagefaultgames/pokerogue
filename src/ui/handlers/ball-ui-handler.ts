import { globalScene } from "#app/global-scene";
import { getPokeballAtlasKey, getPokeballName } from "#data/pokeball";
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
  private optionsText: Phaser.GameObjects.Text;
  private cancelText: Phaser.GameObjects.Text;
  private countsText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.Image | null;

  private scale = 0.1666666667;

  setup() {
    const ui = this.getUi();

    this.scale = getTextStyleOptions(TextStyle.WINDOW).scale;

    let optionsTextContent = "";

    for (let pb = 0; pb < Object.keys(globalScene.pokeballCounts).length; pb++) {
      optionsTextContent += `${pb > 0 ? "\n" : ""}${getPokeballName(pb)}`;
    }
    this.optionsText = addTextObject(0, 0, optionsTextContent, TextStyle.WINDOW, { maxLines: 6 });
    this.cancelText = addTextObject(0, 0, i18next.t("commandUiHandler:ballCancel"), TextStyle.WINDOW);
    this.countsText = addTextObject(
      0,
      0,
      Object.values(globalScene.pokeballCounts)
        .map(count => `×${count}`)
        .join("\n"),
      TextStyle.WINDOW,
      { align: "right", maxLines: 5 },
    );
    this.pokeballSelectContainer = globalScene.add.container(0, -49);
    this.pokeballSelectContainer.setVisible(false);
    ui.add(this.pokeballSelectContainer);

    this.pokeballSelectBg = addWindow(0, 0, 0, 32 + 480 * this.scale);
    this.pokeballSelectBg.setOrigin(0, 1);
    this.pokeballSelectContainer.add(this.pokeballSelectBg);
    for (let pb = 0; pb < Object.keys(globalScene.pokeballCounts).length; pb++) {
      const ballImage = globalScene.add
        .image(0, 0, "pb", getPokeballAtlasKey(pb))
        .setScale(this.scale * 6)
        .setPositionRelative(this.pokeballSelectBg, 24, 7 + (48 + pb * 96) * this.scale);
      this.pokeballSelectContainer.add(ballImage);
    }
    this.pokeballSelectContainer.add(this.optionsText);
    this.optionsText.setOrigin(0, 0);
    this.optionsText.setPositionRelative(this.pokeballSelectBg, 36, 9);
    this.optionsText.setLineSpacing(this.scale * 72);

    this.cancelText.setPositionRelative(this.pokeballSelectBg, 18, 9 + this.optionsText.displayHeight);
    this.pokeballSelectContainer.add(this.cancelText);

    this.countsText.setPositionRelative(this.pokeballSelectBg, 0, 9);
    this.countsText.setLineSpacing(this.scale * 72);
    this.pokeballSelectContainer.add(this.countsText);
    this.updateLayout();

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
        .map(c => `×${c}`)
        .join("\n"),
    );
    this.updateLayout();
  }

  private updateLayout() {
    const contentWidth = Math.max(
      64,
      this.optionsText.displayWidth + 4 + this.countsText.displayWidth,
      this.cancelText.displayWidth,
    );
    this.pokeballSelectBg.setSize(50 + contentWidth, 32 + 480 * this.scale);
    this.pokeballSelectContainer.setX(globalScene.scaledCanvas.width - 51 - contentWidth);
    this.countsText.setPositionRelative(this.pokeballSelectBg, 36 + this.optionsText.displayWidth + 4, 9);
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
