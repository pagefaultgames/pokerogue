import { globalScene } from "#app/global-scene";
import type { Egg } from "#data/egg";
import { Button } from "#enums/buttons";
import { PokemonIconAnimMode } from "#enums/pokemon-icon-anim-mode";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { PokemonIconAnimHelper } from "#ui/pokemon-icon-anim-helper";
import { ScrollableGridHelper } from "#ui/scrollable-grid-helper";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

const ROWS = 9;
const COLS = 11;

export class EggListUiHandler extends MessageUiHandler {
  private eggListContainer: Phaser.GameObjects.Container;
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggNameText: Phaser.GameObjects.Text;
  private eggDateText: Phaser.GameObjects.Text;
  private eggHatchWavesText: Phaser.GameObjects.Text;
  private eggGachaInfoText: Phaser.GameObjects.Text;

  private gridHelper: ScrollableGridHelper<Phaser.GameObjects.Sprite, Egg>;
  private iconAnimHandler: PokemonIconAnimHelper;

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

    this.iconAnimHandler = new PokemonIconAnimHelper();

    this.eggNameText = addTextObject(8, 68, "", TextStyle.SUMMARY).setOrigin(0);
    this.eggDateText = addTextObject(8, 91, "", TextStyle.EGG_LIST);
    this.eggHatchWavesText = addTextObject(8, 108, "", TextStyle.EGG_LIST).setWordWrapWidth(540);
    this.eggGachaInfoText = addTextObject(8, 152, "", TextStyle.EGG_LIST).setWordWrapWidth(540);
    this.eggSprite = globalScene.add.sprite(54, 37, "egg");

    this.gridHelper = new ScrollableGridHelper<Phaser.GameObjects.Sprite, Egg>(111, 7, {
      rows: ROWS,
      columns: COLS,
      scrollBar: { offsetX: -1, offsetY: -2, width: 4, height: 170 },
      cells: {
        spacingX: 18,
        spacingY: 18,
        createCell: () => globalScene.add.sprite(0, 0, "egg_icons").setScale(0.5).setOrigin(0),
        renderCell: (cell, egg) => {
          cell.setFrame(egg.getKey());
          this.iconAnimHandler.addOrUpdate(cell, PokemonIconAnimMode.NONE);
        },
      },
      cursor: { offsetX: 1, texture: "select_cursor", width: 18, height: 18 },
      onItemSelected: (cell, egg, previous) => {
        if (previous) {
          this.iconAnimHandler.addOrUpdate(previous.cell, PokemonIconAnimMode.NONE);
        }
        this.iconAnimHandler.addOrUpdate(cell, PokemonIconAnimMode.ACTIVE);
        this.showEggDetails(egg);
      },
    });

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
      this.gridHelper,
      this.eggSprite,
    ]);
  }

  override show(args: any[]): boolean {
    super.show(args);

    this.getUi().bringToTop(this.eggListContainer);
    this.eggListContainer.setVisible(true);

    this.gridHelper.setItems(globalScene.gameData.eggs);

    return true;
  }

  /**
   * Update the information panel for the given egg.
   */
  private showEggDetails(egg: Egg): void {
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
      success = this.gridHelper.processInput(button);
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  clear(): void {
    super.clear();
    this.gridHelper.setItems([]);
    this.gridHelper.reset();
    this.cursor = -1;
    this.eggListContainer.setVisible(false);
    this.iconAnimHandler.removeAll();
  }
}
