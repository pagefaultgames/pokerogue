import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "./text";
import MessageUiHandler from "./message-ui-handler";
import { Egg, getEggGachaTypeDescriptor, getEggHatchWavesMessage, getEggDescriptor } from "../data/egg";
import { addWindow } from "./ui-theme";
import {Button} from "#enums/buttons";
import i18next from "../plugins/i18n";

export default class EggListUiHandler extends MessageUiHandler {
  private eggListContainer: Phaser.GameObjects.Container;
  private eggListIconContainer: Phaser.GameObjects.Container;
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggNameText: Phaser.GameObjects.Text;
  private eggDateText: Phaser.GameObjects.Text;
  private eggHatchWavesText: Phaser.GameObjects.Text;
  private eggGachaInfoText: Phaser.GameObjects.Text;
  private eggListMessageBoxContainer: Phaser.GameObjects.Container;

  private cursorObj: Phaser.GameObjects.Image;

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

    this.eggListIconContainer = this.scene.add.container(115, 9);
    this.eggListContainer.add(this.eggListIconContainer);

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.eggListContainer.add(this.cursorObj);

    this.eggSprite = this.scene.add.sprite(54, 37, "egg");
    this.eggListContainer.add(this.eggSprite);

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

    this.getUi().bringToTop(this.eggListContainer);

    this.eggListContainer.setVisible(true);

    let e = 0;

    for (const egg of this.scene.gameData.eggs) {
      const x = (e % 11) * 18;
      const y = Math.floor(e / 11) * 18;
      const icon = this.scene.add.sprite(x - 2, y + 2, "egg_icons");
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      icon.setFrame(egg.getKey());
      this.eggListIconContainer.add(icon);
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
      e++;
    }

    this.setCursor(0);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if (button === Button.CANCEL) {
      ui.revertMode();
      success = true;
    } else {
      const eggCount = this.eggListIconContainer.getAll().length;
      const rows = Math.ceil(eggCount / 11);
      const row = Math.floor(this.cursor / 11);
      switch (button) {
      case Button.UP:
        if (row) {
          success = this.setCursor(this.cursor - 11);
        }
        break;
      case Button.DOWN:
        if (row < rows - 2 || (row < rows - 1 && this.cursor % 11 <= (eggCount - 1) % 11)) {
          success = this.setCursor(this.cursor + 11);
        }
        break;
      case Button.LEFT:
        if (this.cursor % 11) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor % 11 < (row < rows - 1 ? 10 : (eggCount - 1) % 11)) {
          success = this.setCursor(this.cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setEggDetails(egg: Egg): void {
    this.eggSprite.setFrame(`egg_${egg.getKey()}`);
    this.eggNameText.setText(`${i18next.t("egg:egg")} (${getEggDescriptor(egg)})`);
    this.eggDateText.setText(
      new Date(egg.timestamp).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric"
      })
    );
    this.eggHatchWavesText.setText(getEggHatchWavesMessage(egg.hatchWaves));
    this.eggGachaInfoText.setText(getEggGachaTypeDescriptor(this.scene, egg));
  }

  setCursor(cursor: integer): boolean {
    let changed = false;

    const lastCursor = this.cursor;

    changed = super.setCursor(cursor);

    if (changed) {
      this.cursorObj.setPosition(114 + 18 * (cursor % 11), 10 + 18 * Math.floor(cursor / 11));

      if (lastCursor > -1) {
        this.iconAnimHandler.addOrUpdate(this.eggListIconContainer.getAt(lastCursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.NONE);
      }
      this.iconAnimHandler.addOrUpdate(this.eggListIconContainer.getAt(cursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.ACTIVE);

      this.setEggDetails(this.scene.gameData.eggs[cursor]);
    }

    return changed;
  }

  clear(): void {
    super.clear();
    this.cursor = -1;
    this.eggListContainer.setVisible(false);
    this.iconAnimHandler.removeAll();
    this.eggListIconContainer.removeAll(true);
  }
}
