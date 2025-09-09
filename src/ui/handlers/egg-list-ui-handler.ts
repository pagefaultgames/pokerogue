import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { ScrollBar } from "#ui/containers/scroll-bar";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { PokemonIconAnimHandler, PokemonIconAnimMode } from "#ui/handlers/pokemon-icon-anim-handler";
import { ScrollableGridUiHandler } from "#ui/handlers/scrollable-grid-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

export class EggListUiHandler extends MessageUiHandler {
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
  private scrollGridHandler: ScrollableGridUiHandler;

  private iconAnimHandler: PokemonIconAnimHandler;

  constructor() {
    super(UiMode.EGG_LIST);
  }

  setup() {
    const ui = this.getUi();

    this.eggListContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height).setVisible(false);
    ui.add(this.eggListContainer);

    const bgColor = globalScene.add
      .rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height, 0x006860)
      .setOrigin(0);

    const eggListBg = globalScene.add.image(0, 0, "egg_list_bg").setOrigin(0);

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup();

    this.eggNameText = addTextObject(8, 68, "", TextStyle.SUMMARY).setOrigin(0);

    this.eggDateText = addTextObject(8, 91, "", TextStyle.EGG_LIST);

    this.eggHatchWavesText = addTextObject(8, 108, "", TextStyle.EGG_LIST).setWordWrapWidth(540);

    this.eggGachaInfoText = addTextObject(8, 152, "", TextStyle.EGG_LIST).setWordWrapWidth(540);

    this.eggListIconContainer = globalScene.add.container(113, 5);

    this.cursorObj = globalScene.add.image(0, 0, "select_cursor").setOrigin(0);

    this.eggSprite = globalScene.add.sprite(54, 37, "egg");

    const scrollBar = new ScrollBar(310, 5, 4, 170, this.ROWS);

    this.scrollGridHandler = new ScrollableGridUiHandler(this, this.ROWS, this.COLUMNS)
      .withScrollBar(scrollBar)
      .withUpdateGridCallBack(() => this.updateEggIcons())
      .withUpdateSingleElementCallback((i: number) => this.setEggDetails(i));

    this.eggListMessageBoxContainer = globalScene.add.container(0, globalScene.scaledCanvas.height).setVisible(false);

    const eggListMessageBox = addWindow(1, -1, 318, 28).setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(eggListMessageBox);

    // Message isn't used, but is expected to exist as this subclasses MessageUiHandler
    this.message = addTextObject(8, -8, "", TextStyle.WINDOW, { maxLines: 1 }).setActive(false).setVisible(false);

    this.cursor = -1;

    this.eggListContainer.add([
      bgColor,
      eggListBg,
      addWindow(1, 85, 106, 22),
      addWindow(1, 102, 106, 50, true),
      addWindow(1, 147, 106, 32, true),
      addWindow(107, 1, 212, 178),
      this.eggNameText,
      this.eggDateText,
      this.eggHatchWavesText,
      this.eggGachaInfoText,
      this.eggListIconContainer,
      this.cursorObj,
      this.eggSprite,
      scrollBar,
    ]);
  }

  override show(args: any[]): boolean {
    super.show(args);

    this.initEggIcons();

    this.getUi().bringToTop(this.eggListContainer);

    this.eggListContainer.setVisible(true);

    this.scrollGridHandler.setTotalElements(globalScene.gameData.eggs.length);

    this.updateEggIcons();
    this.setCursor(0);

    return true;
  }

  /**
   * Create the grid of egg icons to display
   */
  private initEggIcons() {
    this.eggIcons = [];
    for (let i = 0; i < Math.min(this.ROWS * this.COLUMNS, globalScene.gameData.eggs.length); i++) {
      const x = (i % this.COLUMNS) * 18;
      const y = Math.floor(i / this.COLUMNS) * 18;
      const icon = globalScene.add
        .sprite(x - 2, y + 2, "egg_icons")
        .setScale(0.5)
        .setOrigin(0);
      this.eggListIconContainer.add(icon);
      this.eggIcons.push(icon);
    }
  }

  /**
   * Show the grid of egg icons
   */
  private updateEggIcons() {
    const indexOffset = this.scrollGridHandler.getItemOffset();
    const eggsToShow = Math.min(this.eggIcons.length, globalScene.gameData.eggs.length - indexOffset);
    this.eggIcons.forEach((icon, i) => {
      if (i !== this.cursor) {
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
      }
      if (i < eggsToShow) {
        const egg = globalScene.gameData.eggs[i + indexOffset];
        icon.setFrame(egg.getKey()).setVisible(true);
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
    const egg = globalScene.gameData.eggs[index];
    this.eggSprite.setFrame(`egg_${egg.getKey()}`);
    this.eggNameText.setText(`${i18next.t("egg:egg")} (${egg.getEggDescriptor()})`);
    this.eggDateText.setText(
      new Date(egg.timestamp).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric",
      }),
    );
    this.eggHatchWavesText.setText(egg.getEggHatchWavesMessage());
    this.eggGachaInfoText.setText(egg.getEggTypeDescriptor());
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      ui.revertMode();
      success = true;
    } else {
      success = this.scrollGridHandler.processInput(button);
    }

    if (success) {
      ui.playSelect();
    }

    return success;
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
