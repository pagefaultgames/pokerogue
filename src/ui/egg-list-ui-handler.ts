import BattleScene from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "#app/ui/pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "#app/ui/text";
import MessageUiHandler from "#app/ui/message-ui-handler";
import { addWindow } from "#app/ui/ui-theme";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import ScrollableGridUiHandler from "#app/ui/scrollable-grid-handler";
import { ScrollBar } from "#app/ui/scroll-bar";

export default class EggListUiHandler extends MessageUiHandler {
  private readonly ROWS = 9;
  private readonly COLUMNS = 11;

  private eggListContainer: Phaser.GameObjects.Container;
  private eggListIconContainer: Phaser.GameObjects.Container;
  private eggIcons: Phaser.GameObjects.Sprite[];
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggNameText: Phaser.GameObjects.Text;
  private eggDateText: Phaser.GameObjects.Text;
  private eggHatchWavesText: Phaser.GameObjects.Text;
  private eggGachaInfoText: Phaser.GameObjects.Text;
  private eggListMessageBoxContainer: Phaser.GameObjects.Container;

  private cursorObj: Phaser.GameObjects.Image;
  private scrollGridHandler : ScrollableGridUiHandler;

  private iconAnimHandler: PokemonIconAnimHandler;

  constructor(scene: BattleScene) {
    super(scene, Mode.EGG_LIST);
  }

  setup() {
    const ui = this.getUi();

    this.eggListContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.eggListContainer.setVisible(false);
    ui.add(this.eggListContainer);

    const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.eggListContainer.add(bgColor);

    const eggListBg = this.scene.add.image(0, 0, "egg_list_bg");
    eggListBg.setOrigin(0, 0);
    this.eggListContainer.add(eggListBg);

    this.eggListContainer.add(addWindow(this.scene, 1, 85, 106, 22));
    this.eggListContainer.add(addWindow(this.scene, 1, 102, 106, 50, true));
    this.eggListContainer.add(addWindow(this.scene, 1, 147, 106, 32, true));
    this.eggListContainer.add(addWindow(this.scene, 107, 1, 212, 178));

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.eggNameText = addTextObject(this.scene, 8, 68, "", TextStyle.SUMMARY);
    this.eggNameText.setOrigin(0, 0);
    this.eggListContainer.add(this.eggNameText);

    this.eggDateText = addTextObject(this.scene, 8, 91, "", TextStyle.TOOLTIP_CONTENT);
    this.eggListContainer.add(this.eggDateText);

    this.eggHatchWavesText = addTextObject(this.scene, 8, 108, "", TextStyle.TOOLTIP_CONTENT);
    this.eggHatchWavesText.setWordWrapWidth(540);
    this.eggListContainer.add(this.eggHatchWavesText);

    this.eggGachaInfoText = addTextObject(this.scene, 8, 152, "", TextStyle.TOOLTIP_CONTENT);
    this.eggGachaInfoText.setWordWrapWidth(540);
    this.eggListContainer.add(this.eggGachaInfoText);

    this.eggListIconContainer = this.scene.add.container(113, 5);
    this.eggListContainer.add(this.eggListIconContainer);

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.eggListContainer.add(this.cursorObj);

    this.eggSprite = this.scene.add.sprite(54, 37, "egg");
    this.eggListContainer.add(this.eggSprite);

    const scrollBar = new ScrollBar(this.scene, 310, 5, 4, 170, this.ROWS);
    this.eggListContainer.add(scrollBar);

    this.scrollGridHandler = new ScrollableGridUiHandler(this, this.ROWS, this.COLUMNS)
      .withScrollBar(scrollBar)
      .withUpdateGridCallBack(() => this.updateEggIcons())
      .withUpdateSingleElementCallback((i:number) => this.setEggDetails(i));

    this.eggListMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.eggListMessageBoxContainer.setVisible(false);
    this.eggListContainer.add(this.eggListMessageBoxContainer);

    const eggListMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    eggListMessageBox.setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(eggListMessageBox);

    this.message = addTextObject(this.scene, 8, -8, "", TextStyle.WINDOW, { maxLines: 1 });
    this.message.setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(this.message);

    this.cursor = -1;
  }

  show(args: any[]): boolean {
    super.show(args);

    this.initEggIcons();

    this.getUi().bringToTop(this.eggListContainer);

    this.eggListContainer.setVisible(true);

    this.scrollGridHandler.setTotalElements(this.scene.gameData.eggs.length);

    this.updateEggIcons();
    this.setCursor(0);

    return true;
  }

  /**
   * Create the grid of egg icons to display
   */
  private initEggIcons() {
    this.eggIcons = [];
    for (let i = 0; i < Math.min(this.ROWS * this.COLUMNS, this.scene.gameData.eggs.length); i++) {
      const x = (i % this.COLUMNS) * 18;
      const y = Math.floor(i / this.COLUMNS) * 18;
      const icon = this.scene.add.sprite(x - 2, y + 2, "egg_icons");
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      this.eggListIconContainer.add(icon);
      this.eggIcons.push(icon);
    }
  }

  /**
   * Show the grid of egg icons
   */
  private updateEggIcons() {
    const indexOffset = this.scrollGridHandler.getItemOffset();
    const eggsToShow = Math.min(this.eggIcons.length, this.scene.gameData.eggs.length - indexOffset);

    this.eggIcons.forEach((icon, i) => {
      if (i !== this.cursor) {
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
      }
      if (i < eggsToShow) {
        const egg = this.scene.gameData.eggs[i + indexOffset];
        icon.setFrame(egg.getKey());
        icon.setVisible(true);
      } else {
        icon.setVisible(false);
      }
    });
  }

  /**
   * Update the information panel with the information of the given egg
   * @param index which egg in the list to display the info for
   */
  private setEggDetails(index: number): void {
    const egg = this.scene.gameData.eggs[index];
    this.eggSprite.setFrame(`egg_${egg.getKey()}`);
    this.eggNameText.setText(`${i18next.t("egg:egg")} (${egg.getEggDescriptor()})`);
    this.eggDateText.setText(
      new Date(egg.timestamp).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric"
      })
    );
    this.eggHatchWavesText.setText(egg.getEggHatchWavesMessage());
    this.eggGachaInfoText.setText(egg.getEggTypeDescriptor(this.scene));
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if (button === Button.CANCEL) {
      ui.revertMode();
      success = true;
    } else {
      success = this.scrollGridHandler.processInput(button);
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setCursor(cursor: number): boolean {
    let changed = false;

    const lastCursor = this.cursor;

    changed = super.setCursor(cursor);

    if (changed) {
      const icon = this.eggIcons[cursor];
      this.cursorObj.setPositionRelative(icon, 114, 5);

      if (lastCursor > -1) {
        this.iconAnimHandler.addOrUpdate(this.eggIcons[lastCursor], PokemonIconAnimMode.NONE);
      }
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.ACTIVE);

      this.setEggDetails(cursor + this.scrollGridHandler.getItemOffset());
    }

    return changed;
  }

  clear(): void {
    super.clear();
    this.scrollGridHandler.reset();
    this.cursor = -1;
    this.eggListContainer.setVisible(false);
    this.iconAnimHandler.removeAll();
    this.eggListIconContainer.removeAll(true);
    this.eggIcons = [];
  }
}
