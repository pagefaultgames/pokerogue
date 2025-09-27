import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import { Button } from "#enums/buttons";
import type { RibbonData, RibbonFlag } from "#system/ribbons/ribbon-data";
import type { MessageUiHandler } from "#ui/message-ui-handler";
import { addWindow } from "#ui/ui-theme";
import { getAvailableRibbons } from "#utils/ribbon-utils";

export class RibbonTray extends Phaser.GameObjects.Container {
  private trayBg: Phaser.GameObjects.NineSlice;
  private ribbons: RibbonFlag[] = [];
  private trayIcons: Phaser.GameObjects.Image[] = [];
  private trayNumIcons: number;
  private trayRows: number;
  private trayColumns: number;
  private trayCursorObj: Phaser.GameObjects.Image;
  private trayCursor = 0;

  private handler: MessageUiHandler;

  private ribbonData: RibbonData;

  private maxColumns = 6;

  constructor(handler: MessageUiHandler, x: number, y: number) {
    super(globalScene, x, y);
    this.handler = handler;

    this.setup();
  }

  setup() {
    this.trayBg = addWindow(0, 0, 0, 0);
    this.trayBg.setOrigin(0, 0);
    this.add(this.trayBg);

    this.trayCursorObj = globalScene.add.image(0, 0, "select_cursor");
    this.trayCursorObj.setOrigin(0, 0);
    this.add(this.trayCursorObj);
  }

  processInput(button: Button) {
    let success = false;

    const numberOfIcons = this.trayIcons.length;
    const numOfRows = Math.ceil(numberOfIcons / this.maxColumns);
    const currentTrayRow = Math.floor(this.trayCursor / this.maxColumns);
    switch (button) {
      case Button.UP:
        if (currentTrayRow > 0) {
          success = this.setTrayCursor(this.trayCursor - this.maxColumns);
        } else {
          const targetCol = this.trayCursor;
          if (numberOfIcons % this.maxColumns > targetCol) {
            success = this.setTrayCursor(numberOfIcons - (numberOfIcons % this.maxColumns) + targetCol);
          } else {
            success = this.setTrayCursor(
              Math.max(numberOfIcons - (numberOfIcons % this.maxColumns) + targetCol - this.maxColumns, 0),
            );
          }
        }
        break;
      case Button.DOWN:
        if (currentTrayRow < numOfRows - 1 && this.trayCursor + this.maxColumns < numberOfIcons) {
          success = this.setTrayCursor(this.trayCursor + this.maxColumns);
        } else {
          success = this.setTrayCursor(this.trayCursor % this.maxColumns);
        }
        break;
      case Button.LEFT:
        if (this.trayCursor % this.maxColumns !== 0) {
          success = this.setTrayCursor(this.trayCursor - 1);
        } else {
          success = this.setTrayCursor(
            currentTrayRow < numOfRows - 1 ? (currentTrayRow + 1) * this.maxColumns - 1 : numberOfIcons - 1,
          );
        }
        break;
      case Button.RIGHT:
        if (
          this.trayCursor % this.maxColumns
          < (currentTrayRow < numOfRows - 1 ? 8 : (numberOfIcons - 1) % this.maxColumns)
        ) {
          success = this.setTrayCursor(this.trayCursor + 1);
        } else {
          success = this.setTrayCursor(currentTrayRow * this.maxColumns);
        }
        break;
      case Button.CANCEL:
        success = this.close();
        break;
    }
    return success;
  }

  setTrayCursor(cursor: number): boolean {
    cursor = Phaser.Math.Clamp(this.trayIcons.length - 1, cursor, 0);
    const changed = this.trayCursor !== cursor;
    if (changed) {
      this.trayCursor = cursor;
    }

    this.trayCursorObj.setPosition(5 + (cursor % this.maxColumns) * 18, 4 + Math.floor(cursor / this.maxColumns) * 17);

    const ribbonDescription = this.ribbonData.has(this.ribbons[cursor])
      ? "Description will show up here"
      : "Ribbon not unlocked";

    this.handler.showText(ribbonDescription);

    return changed;
  }

  open(species: PokemonSpecies): boolean {
    this.ribbons = getAvailableRibbons(species);

    this.ribbonData = globalScene.gameData.dexData[species.speciesId].ribbons;

    this.trayNumIcons = this.ribbons.length;
    this.trayRows =
      Math.floor(this.trayNumIcons / this.maxColumns) + (this.trayNumIcons % this.maxColumns === 0 ? 0 : 1);
    this.trayColumns = Math.min(this.trayNumIcons, this.maxColumns);

    this.trayBg.setSize(15 + this.trayColumns * 17, 8 + this.trayRows * 18);

    this.trayIcons = [];
    for (const [index, ribbon] of this.ribbons.entries()) {
      const hasRibbon = this.ribbonData.has(ribbon);

      const icon = globalScene.add.image(0, 0, "champion_ribbon");

      if (hasRibbon || globalScene.dexForDevs) {
        icon.clearTint();
      } else {
        icon.setTint(0);
      }

      icon.setPosition(14 + (index % this.maxColumns) * 18, 14 + Math.floor(index / this.maxColumns) * 17);

      this.add(icon);
      this.trayIcons.push(icon);
    }

    this.setVisible(true);

    this.setTrayCursor(0);

    return true;
  }

  close(): boolean {
    this.trayIcons.forEach(obj => {
      this.remove(obj, true); // Removes from container and destroys it
    });

    this.trayIcons = [];
    this.ribbons = [];
    this.setVisible(false);

    //    this.exitCallback();
    return true;
  }
}
