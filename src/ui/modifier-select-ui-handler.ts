import { globalScene } from "#app/global-scene";
import type { ModifierTypeOption } from "../modifier/modifier-type";
import { getPlayerShopModifierTypeOptionsForWave, TmModifierType } from "../modifier/modifier-type";
import { getPokeballAtlasKey } from "#app/data/pokeball";
import { addTextObject, getTextStyleOptions, getModifierTierTextTint, getTextColor, TextStyle } from "./text";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { UiMode } from "#enums/ui-mode";
import { LockModifierTiersModifier, PokemonHeldItemModifier, HealShopCostModifier } from "../modifier/modifier";
import { handleTutorial, Tutorial } from "../tutorial";
import { Button } from "#enums/buttons";
import MoveInfoOverlay from "./move-info-overlay";
import { allMoves } from "#app/data/data-lists";
import { formatMoney, NumberHolder } from "#app/utils/common";
import Overrides from "#app/overrides";
import i18next from "i18next";
import { ShopCursorTarget } from "#app/enums/shop-cursor-target";
import Phaser from "phaser";
import type { PokeballType } from "#enums/pokeball";

export const SHOP_OPTIONS_ROW_LIMIT = 7;
const SINGLE_SHOP_ROW_YOFFSET = 12;
const DOUBLE_SHOP_ROW_YOFFSET = 24;
const OPTION_BUTTON_YPOSITION = -62;

export default class ModifierSelectUiHandler extends AwaitableUiHandler {
  private modifierContainer: Phaser.GameObjects.Container;
  private rerollButtonContainer: Phaser.GameObjects.Container;
  private lockRarityButtonContainer: Phaser.GameObjects.Container;
  private transferButtonContainer: Phaser.GameObjects.Container;
  private checkButtonContainer: Phaser.GameObjects.Container;
  private continueButtonContainer: Phaser.GameObjects.Container;
  private rerollCostText: Phaser.GameObjects.Text;
  private lockRarityButtonText: Phaser.GameObjects.Text;
  private moveInfoOverlay: MoveInfoOverlay;
  private moveInfoOverlayActive = false;

  private rowCursor = 0;
  private player: boolean;
  /**
   * If reroll cost is negative, it is assumed there are 0 items in the shop.
   * It will cause reroll button to be disabled, and a "Continue" button to show in the place of shop items
   */
  private rerollCost: number;
  private transferButtonWidth: number;
  private checkButtonWidth: number;

  public options: ModifierOption[];
  public shopOptionsRows: ModifierOption[][];

  private cursorObj: Phaser.GameObjects.Image | null;

  constructor() {
    super(UiMode.CONFIRM);

    this.options = [];
    this.shopOptionsRows = [];
  }

  setup() {
    const ui = this.getUi();

    this.modifierContainer = globalScene.add.container(0, 0);
    ui.add(this.modifierContainer);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const styleOptions = getTextStyleOptions(TextStyle.PARTY, globalScene.uiTheme).styleOptions;

    if (context) {
      context.font = styleOptions.fontSize + "px " + styleOptions.fontFamily;
      this.transferButtonWidth = context.measureText(i18next.t("modifierSelectUiHandler:transfer")).width;
      this.checkButtonWidth = context.measureText(i18next.t("modifierSelectUiHandler:checkTeam")).width;
    }

    this.transferButtonContainer = globalScene.add.container(
      (globalScene.game.canvas.width - this.checkButtonWidth) / 6 - 21,
      OPTION_BUTTON_YPOSITION,
    );
    this.transferButtonContainer.setName("transfer-btn");
    this.transferButtonContainer.setVisible(false);
    ui.add(this.transferButtonContainer);

    const transferButtonText = addTextObject(-4, -2, i18next.t("modifierSelectUiHandler:transfer"), TextStyle.PARTY);
    transferButtonText.setName("text-transfer-btn");
    transferButtonText.setOrigin(1, 0);
    this.transferButtonContainer.add(transferButtonText);

    this.checkButtonContainer = globalScene.add.container(
      globalScene.game.canvas.width / 6 - 1,
      OPTION_BUTTON_YPOSITION,
    );
    this.checkButtonContainer.setName("use-btn");
    this.checkButtonContainer.setVisible(false);
    ui.add(this.checkButtonContainer);

    const checkButtonText = addTextObject(-4, -2, i18next.t("modifierSelectUiHandler:checkTeam"), TextStyle.PARTY);
    checkButtonText.setName("text-use-btn");
    checkButtonText.setOrigin(1, 0);
    this.checkButtonContainer.add(checkButtonText);

    this.rerollButtonContainer = globalScene.add.container(16, OPTION_BUTTON_YPOSITION);
    this.rerollButtonContainer.setName("reroll-brn");
    this.rerollButtonContainer.setVisible(false);
    ui.add(this.rerollButtonContainer);

    const rerollButtonText = addTextObject(-4, -2, i18next.t("modifierSelectUiHandler:reroll"), TextStyle.PARTY);
    rerollButtonText.setName("text-reroll-btn");
    rerollButtonText.setOrigin(0, 0);
    this.rerollButtonContainer.add(rerollButtonText);

    this.rerollCostText = addTextObject(0, 0, "", TextStyle.MONEY);
    this.rerollCostText.setName("text-reroll-cost");
    this.rerollCostText.setOrigin(0, 0);
    this.rerollCostText.setPositionRelative(rerollButtonText, rerollButtonText.displayWidth + 5, 1);
    this.rerollButtonContainer.add(this.rerollCostText);

    this.lockRarityButtonContainer = globalScene.add.container(16, OPTION_BUTTON_YPOSITION);
    this.lockRarityButtonContainer.setVisible(false);
    ui.add(this.lockRarityButtonContainer);

    this.lockRarityButtonText = addTextObject(
      -4,
      -2,
      i18next.t("modifierSelectUiHandler:lockRarities"),
      TextStyle.PARTY,
    );
    this.lockRarityButtonText.setOrigin(0, 0);
    this.lockRarityButtonContainer.add(this.lockRarityButtonText);

    this.continueButtonContainer = globalScene.add.container(
      globalScene.game.canvas.width / 12,
      -(globalScene.game.canvas.height / 12),
    );
    this.continueButtonContainer.setVisible(false);
    ui.add(this.continueButtonContainer);

    // Create continue button
    const continueButtonText = addTextObject(
      -24,
      5,
      i18next.t("modifierSelectUiHandler:continueNextWaveButton"),
      TextStyle.MESSAGE,
    );
    continueButtonText.setName("text-continue-btn");
    this.continueButtonContainer.add(continueButtonText);

    // prepare move overlay
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay({
      delayVisibility: true,
      scale: overlayScale,
      onSide: true,
      right: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(overlayScale, true) - 1,
      width: globalScene.game.canvas.width / 6 - 2,
    });
    ui.add(this.moveInfoOverlay);
    // register the overlay to receive toggle events
    globalScene.addInfoToggle(this.moveInfoOverlay);
  }

  show(args: any[]): boolean {
    globalScene.disableMenu = false;

    if (this.active) {
      if (args.length >= 3) {
        this.awaitingActionInput = true;
        this.onActionInput = args[2];
      }
      this.moveInfoOverlay.active = this.moveInfoOverlayActive;
      return false;
    }

    if (args.length !== 4 || !Array.isArray(args[1]) || !(args[2] instanceof Function)) {
      return false;
    }

    super.show(args);

    this.getUi().clearText();

    this.player = args[0];

    const partyHasHeldItem =
      this.player && !!globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.isTransferable).length;
    const canLockRarities = !!globalScene.findModifier(m => m instanceof LockModifierTiersModifier);

    this.transferButtonContainer.setVisible(false);
    this.transferButtonContainer.setAlpha(0);

    this.checkButtonContainer.setVisible(false);
    this.checkButtonContainer.setAlpha(0);

    this.rerollButtonContainer.setVisible(false);
    this.rerollButtonContainer.setAlpha(0);

    this.lockRarityButtonContainer.setVisible(false);
    this.lockRarityButtonContainer.setAlpha(0);

    this.continueButtonContainer.setVisible(false);
    this.continueButtonContainer.setAlpha(0);

    this.rerollButtonContainer.setPositionRelative(this.lockRarityButtonContainer, 0, canLockRarities ? -12 : 0);

    this.rerollCost = args[3] as number;

    this.updateRerollCostText();

    const typeOptions = args[1] as ModifierTypeOption[];
    const removeHealShop = globalScene.gameMode.hasNoShop;
    const baseShopCost = new NumberHolder(globalScene.getWaveMoneyAmount(1));
    globalScene.applyModifier(HealShopCostModifier, true, baseShopCost);
    const shopTypeOptions = !removeHealShop
      ? getPlayerShopModifierTypeOptionsForWave(globalScene.currentBattle.waveIndex, baseShopCost.value)
      : [];
    const optionsYOffset =
      shopTypeOptions.length > SHOP_OPTIONS_ROW_LIMIT ? -SINGLE_SHOP_ROW_YOFFSET : -DOUBLE_SHOP_ROW_YOFFSET;

    for (let m = 0; m < typeOptions.length; m++) {
      const sliceWidth = globalScene.game.canvas.width / 6 / (typeOptions.length + 2);
      const option = new ModifierOption(
        sliceWidth * (m + 1) + sliceWidth * 0.5,
        -globalScene.game.canvas.height / 12 + optionsYOffset,
        typeOptions[m],
      );
      option.setScale(0.5);
      globalScene.add.existing(option);
      this.modifierContainer.add(option);
      this.options.push(option);
    }

    // Set "Continue" button height based on number of rows in healing items shop
    const continueButton = this.continueButtonContainer.getAt<Phaser.GameObjects.Text>(0);
    continueButton.y = optionsYOffset - 5;
    continueButton.setVisible(this.options.length === 0);

    for (let m = 0; m < shopTypeOptions.length; m++) {
      const row = m < SHOP_OPTIONS_ROW_LIMIT ? 0 : 1;
      const col = m < SHOP_OPTIONS_ROW_LIMIT ? m : m - SHOP_OPTIONS_ROW_LIMIT;
      const rowOptions = shopTypeOptions.slice(
        row ? SHOP_OPTIONS_ROW_LIMIT : 0,
        row ? undefined : SHOP_OPTIONS_ROW_LIMIT,
      );
      const sliceWidth = globalScene.game.canvas.width / 6 / (rowOptions.length + 2);
      const option = new ModifierOption(
        sliceWidth * (col + 1) + sliceWidth * 0.5,
        -globalScene.game.canvas.height / 12 - globalScene.game.canvas.height / 32 - (42 - (28 * row - 1)),
        shopTypeOptions[m],
      );
      option.setScale(0.375);
      globalScene.add.existing(option);
      this.modifierContainer.add(option);

      if (row >= this.shopOptionsRows.length) {
        this.shopOptionsRows.push([]);
      }
      this.shopOptionsRows[row].push(option);
    }

    const maxUpgradeCount = typeOptions.map(to => to.upgradeCount).reduce((max, current) => Math.max(current, max), 0);

    /* Force updateModifiers without pokemonSpecificModifiers */
    globalScene.getModifierBar().updateModifiers(globalScene.modifiers, true);

    /* Multiplies the appearance duration by the speed parameter so that it is always constant, and avoids "flashbangs" at game speed x5 */
    globalScene.showShopOverlay(750 * globalScene.gameSpeed);
    globalScene.updateAndShowText(750);
    globalScene.updateBiomeWaveText();
    globalScene.updateMoneyText();

    let i = 0;

    globalScene.tweens.addCounter({
      ease: "Sine.easeIn",
      duration: 1250,
      onUpdate: t => {
        const value = t.getValue();
        const index = Math.floor(value * typeOptions.length);
        if (index > i && index <= typeOptions.length) {
          const option = this.options[i];
          option?.show(
            Math.floor((1 - value) * 1250) * 0.325 + 2000 * maxUpgradeCount,
            -(maxUpgradeCount - typeOptions[i].upgradeCount),
          );
          i++;
        }
      },
    });

    globalScene.time.delayedCall(1000 + maxUpgradeCount * 2000, () => {
      for (const shopOption of this.shopOptionsRows.flat()) {
        shopOption.show(0, 0);
      }
    });

    globalScene.time.delayedCall(4000 + maxUpgradeCount * 2000, () => {
      if (partyHasHeldItem) {
        this.transferButtonContainer.setAlpha(0);
        this.transferButtonContainer.setVisible(true);
        globalScene.tweens.add({
          targets: this.transferButtonContainer,
          alpha: 1,
          duration: 250,
        });
      }

      this.rerollButtonContainer.setAlpha(0);
      this.checkButtonContainer.setAlpha(0);
      this.lockRarityButtonContainer.setAlpha(0);
      this.continueButtonContainer.setAlpha(0);
      this.rerollButtonContainer.setVisible(true);
      this.checkButtonContainer.setVisible(true);
      this.continueButtonContainer.setVisible(this.rerollCost < 0);
      this.lockRarityButtonContainer.setVisible(canLockRarities);

      globalScene.tweens.add({
        targets: [this.checkButtonContainer, this.continueButtonContainer],
        alpha: 1,
        duration: 250,
      });

      globalScene.tweens.add({
        targets: [this.rerollButtonContainer, this.lockRarityButtonContainer],
        alpha: this.rerollCost < 0 ? 0.5 : 1,
        duration: 250,
      });

      const updateCursorTarget = () => {
        if (globalScene.shopCursorTarget === ShopCursorTarget.CHECK_TEAM) {
          this.setRowCursor(0);
          this.setCursor(2);
        } else if (globalScene.shopCursorTarget === ShopCursorTarget.SHOP && globalScene.gameMode.hasNoShop) {
          this.setRowCursor(ShopCursorTarget.REWARDS);
          this.setCursor(0);
        } else {
          this.setRowCursor(globalScene.shopCursorTarget);
          this.setCursor(0);
        }
      };

      updateCursorTarget();

      handleTutorial(Tutorial.Select_Item).then(res => {
        if (res) {
          updateCursorTarget();
        }
        this.awaitingActionInput = true;
        this.onActionInput = args[2];
      });
    });

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    if (!this.awaitingActionInput) {
      return false;
    }

    let success = false;

    if (button === Button.ACTION) {
      success = true;
      if (this.onActionInput) {
        const originalOnActionInput = this.onActionInput;
        this.awaitingActionInput = false;
        this.onActionInput = null;
        if (!originalOnActionInput(this.rowCursor, this.cursor)) {
          this.awaitingActionInput = true;
          this.onActionInput = originalOnActionInput;
        } else {
          this.moveInfoOverlayActive = this.moveInfoOverlay.active;
          this.moveInfoOverlay.setVisible(false);
          this.moveInfoOverlay.active = false; // this is likely unnecessary, but it should help future prove the UI
        }
      }
    } else if (button === Button.CANCEL) {
      if (this.player) {
        success = true;
        if (this.onActionInput) {
          const originalOnActionInput = this.onActionInput;
          this.awaitingActionInput = false;
          this.onActionInput = null;
          originalOnActionInput(-1);
          this.moveInfoOverlayActive = this.moveInfoOverlay.active;
          this.moveInfoOverlay.setVisible(false);
          this.moveInfoOverlay.active = false; // don't clear here as we might need to restore the UI in case the user cancels the action
        }
      }
    } else {
      switch (button) {
        case Button.UP:
          if (this.rowCursor === 0 && this.cursor === 3) {
            success = this.setCursor(0);
          } else if (this.rowCursor < this.shopOptionsRows.length + 1) {
            success = this.setRowCursor(this.rowCursor + 1);
          } else {
            success = this.setRowCursor(0);
          }
          break;
        case Button.DOWN:
          if (this.rowCursor) {
            success = this.setRowCursor(this.rowCursor - 1);
          } else if (this.lockRarityButtonContainer.visible && this.cursor === 0) {
            success = this.setCursor(3);
          } else {
            success = this.setRowCursor(this.shopOptionsRows.length + 1);
          }
          break;
        case Button.LEFT:
          if (!this.rowCursor) {
            switch (this.cursor) {
              case 0:
                success = this.setCursor(2);
                break;
              case 1:
                if (this.lockRarityButtonContainer.visible) {
                  success = this.setCursor(3);
                } else {
                  success = this.rerollButtonContainer.visible && this.setCursor(0);
                }
                break;
              case 2:
                if (this.transferButtonContainer.visible) {
                  success = this.setCursor(1);
                } else if (this.rerollButtonContainer.visible) {
                  success = this.setCursor(0);
                } else {
                  success = false;
                }
                break;
              case 3:
                if (this.lockRarityButtonContainer.visible) {
                  success = this.setCursor(2);
                } else {
                  success = false;
                }
            }
          } else if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          } else {
            if (this.rowCursor === 1 && this.options.length === 0) {
              success = false;
            } else {
              success = this.setCursor(this.getRowItems(this.rowCursor) - 1);
            }
          }
          break;
        case Button.RIGHT:
          if (!this.rowCursor) {
            switch (this.cursor) {
              case 0:
                if (this.transferButtonContainer.visible) {
                  success = this.setCursor(1);
                } else {
                  success = this.setCursor(2);
                }
                break;
              case 1:
                success = this.setCursor(2);
                break;
              case 2:
                success = this.setCursor(0);
                break;
              case 3:
                if (this.transferButtonContainer.visible) {
                  success = this.setCursor(1);
                } else {
                  success = this.setCursor(2);
                }
                break;
            }
          } else if (this.cursor < this.getRowItems(this.rowCursor) - 1) {
            success = this.setCursor(this.cursor + 1);
          } else {
            if (this.rowCursor === 1 && this.options.length === 0) {
              success = this.setRowCursor(0);
            } else {
              success = this.setCursor(0);
            }
          }
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: number): boolean {
    const ui = this.getUi();
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.modifierContainer.add(this.cursorObj);
    }

    const options =
      this.rowCursor === 1 ? this.options : this.shopOptionsRows[this.shopOptionsRows.length - (this.rowCursor - 1)];

    this.cursorObj.setScale(this.rowCursor === 1 ? 2 : this.rowCursor >= 2 ? 1.5 : 1);

    // the modifier selection has been updated, always hide the overlay
    this.moveInfoOverlay.clear();
    if (this.rowCursor) {
      if (this.rowCursor === 1 && options.length === 0) {
        // Continue button when no shop items
        this.cursorObj.setScale(1.25);
        this.cursorObj.setPosition(
          globalScene.game.canvas.width / 18 + 23,
          -globalScene.game.canvas.height / 12 -
            (this.shopOptionsRows.length > 1 ? SINGLE_SHOP_ROW_YOFFSET - 2 : DOUBLE_SHOP_ROW_YOFFSET - 2),
        );
        ui.showText(i18next.t("modifierSelectUiHandler:continueNextWaveDescription"));
        return ret;
      }

      const sliceWidth = globalScene.game.canvas.width / 6 / (options.length + 2);
      if (this.rowCursor < 2) {
        // Cursor on free items
        this.cursorObj.setPosition(
          sliceWidth * (cursor + 1) + sliceWidth * 0.5 - 20,
          -globalScene.game.canvas.height / 12 -
            (this.shopOptionsRows.length > 1 ? SINGLE_SHOP_ROW_YOFFSET - 2 : DOUBLE_SHOP_ROW_YOFFSET - 2),
        );
      } else {
        // Cursor on paying items
        this.cursorObj.setPosition(
          sliceWidth * (cursor + 1) + sliceWidth * 0.5 - 16,
          -globalScene.game.canvas.height / 12 -
            globalScene.game.canvas.height / 32 -
            (-14 + 28 * (this.rowCursor - (this.shopOptionsRows.length - 1))),
        );
      }

      const type = options[this.cursor].modifierTypeOption.type;
      type && ui.showText(type.getDescription());
      if (type instanceof TmModifierType) {
        // prepare the move overlay to be shown with the toggle
        this.moveInfoOverlay.show(allMoves[type.moveId]);
      }
    } else if (cursor === 0) {
      this.cursorObj.setPosition(
        6,
        this.lockRarityButtonContainer.visible ? OPTION_BUTTON_YPOSITION - 8 : OPTION_BUTTON_YPOSITION + 4,
      );
      ui.showText(i18next.t("modifierSelectUiHandler:rerollDesc"));
    } else if (cursor === 1) {
      this.cursorObj.setPosition(
        (globalScene.game.canvas.width - this.transferButtonWidth - this.checkButtonWidth) / 6 - 30,
        OPTION_BUTTON_YPOSITION + 4,
      );
      ui.showText(i18next.t("modifierSelectUiHandler:transferDesc"));
    } else if (cursor === 2) {
      this.cursorObj.setPosition(
        (globalScene.game.canvas.width - this.checkButtonWidth) / 6 - 10,
        OPTION_BUTTON_YPOSITION + 4,
      );
      ui.showText(i18next.t("modifierSelectUiHandler:checkTeamDesc"));
    } else {
      this.cursorObj.setPosition(6, OPTION_BUTTON_YPOSITION + 4);
      ui.showText(i18next.t("modifierSelectUiHandler:lockRaritiesDesc"));
    }

    return ret;
  }

  setRowCursor(rowCursor: number): boolean {
    const lastRowCursor = this.rowCursor;

    if (rowCursor !== lastRowCursor) {
      this.rowCursor = rowCursor;
      let newCursor = Math.round(
        (this.cursor / Math.max(this.getRowItems(lastRowCursor) - 1, 1)) * (this.getRowItems(rowCursor) - 1),
      );
      if (rowCursor === 1 && this.options.length === 0) {
        // Handle empty shop
        newCursor = 0;
      }
      if (rowCursor === 0) {
        if (this.options.length === 0) {
          newCursor = 1;
        }
        if (newCursor === 0 && !this.rerollButtonContainer.visible) {
          newCursor = 1;
        }
        if (newCursor === 1 && !this.transferButtonContainer.visible) {
          newCursor = 2;
        }
      }
      // Allows to find lock rarity button when looping from the top
      if (rowCursor === 0 && lastRowCursor > 1 && newCursor === 0 && this.lockRarityButtonContainer.visible) {
        newCursor = 3;
      }
      // Allows to loop to top when lock rarity button is shown
      if (rowCursor === this.shopOptionsRows.length + 1 && lastRowCursor === 0 && this.cursor === 3) {
        newCursor = 0;
      }
      this.cursor = -1;
      this.setCursor(newCursor);
      return true;
    }

    return false;
  }

  private getRowItems(rowCursor: number): number {
    switch (rowCursor) {
      case 0:
        return 3;
      case 1:
        return this.options.length;
      default:
        return this.shopOptionsRows[this.shopOptionsRows.length - (rowCursor - 1)].length;
    }
  }

  setRerollCost(rerollCost: number): void {
    this.rerollCost = rerollCost;
  }

  updateCostText(): void {
    const shopOptions = this.shopOptionsRows.flat();
    for (const shopOption of shopOptions) {
      shopOption.updateCostText();
    }

    this.updateRerollCostText();
  }

  updateRerollCostText(): void {
    const rerollDisabled = this.rerollCost < 0;
    if (rerollDisabled) {
      this.rerollCostText.setVisible(false);
      return;
    }
    this.rerollCostText.setVisible(true);
    const canReroll = globalScene.money >= this.rerollCost;

    const formattedMoney = formatMoney(globalScene.moneyFormat, this.rerollCost);

    this.rerollCostText.setText(i18next.t("modifierSelectUiHandler:rerollCost", { formattedMoney }));
    this.rerollCostText.setColor(this.getTextColor(canReroll ? TextStyle.MONEY : TextStyle.PARTY_RED));
    this.rerollCostText.setShadowColor(this.getTextColor(canReroll ? TextStyle.MONEY : TextStyle.PARTY_RED, true));
  }

  updateLockRaritiesText(): void {
    const textStyle = globalScene.lockModifierTiers ? TextStyle.SUMMARY_BLUE : TextStyle.PARTY;
    this.lockRarityButtonText.setColor(this.getTextColor(textStyle));
    this.lockRarityButtonText.setShadowColor(this.getTextColor(textStyle, true));
  }

  clear() {
    super.clear();

    this.moveInfoOverlay.clear();
    this.moveInfoOverlayActive = false;
    this.awaitingActionInput = false;
    this.onActionInput = null;
    this.getUi().clearText();
    this.eraseCursor();

    // Reset cursor positions
    this.cursor = 0;
    this.rowCursor = 0;

    /* Multiplies the fade time duration by the speed parameter so that it is always constant, and avoids "flashbangs" at game speed x5 */
    globalScene.hideShopOverlay(750 * globalScene.gameSpeed);
    globalScene.hideLuckText(250);

    /* Normally already called just after the shop, but not sure if it happens in 100% of cases */
    globalScene.getModifierBar().updateModifiers(globalScene.modifiers);

    const options = this.options.concat(this.shopOptionsRows.flat());
    this.options.splice(0, this.options.length);
    this.shopOptionsRows.splice(0, this.shopOptionsRows.length);

    globalScene.tweens.add({
      targets: options,
      scale: 0.01,
      duration: 250,
      ease: "Cubic.easeIn",
      onComplete: () => options.forEach(o => o.destroy()),
    });

    [
      this.rerollButtonContainer,
      this.checkButtonContainer,
      this.transferButtonContainer,
      this.lockRarityButtonContainer,
      this.continueButtonContainer,
    ].forEach(container => {
      if (container.visible) {
        globalScene.tweens.add({
          targets: container,
          alpha: 0,
          duration: 250,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (!this.options.length) {
              container.setVisible(false);
            } else {
              container.setAlpha(1);
            }
          },
        });
      }
    });
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}

class ModifierOption extends Phaser.GameObjects.Container {
  public modifierTypeOption: ModifierTypeOption;
  private pb: Phaser.GameObjects.Sprite;
  private pbTint: Phaser.GameObjects.Sprite;
  private itemContainer: Phaser.GameObjects.Container;
  private item: Phaser.GameObjects.Sprite;
  private itemTint: Phaser.GameObjects.Sprite;
  private itemText: Phaser.GameObjects.Text;
  private itemCostText: Phaser.GameObjects.Text;

  constructor(x: number, y: number, modifierTypeOption: ModifierTypeOption) {
    super(globalScene, x, y);

    this.modifierTypeOption = modifierTypeOption;

    this.setup();
  }

  setup() {
    if (!this.modifierTypeOption.cost) {
      const getPb = (): Phaser.GameObjects.Sprite => {
        const pb = globalScene.add.sprite(0, -182, "pb", this.getPbAtlasKey(-this.modifierTypeOption.upgradeCount));
        pb.setScale(2);
        return pb;
      };

      this.pb = getPb();
      this.add(this.pb);

      this.pbTint = getPb();
      this.pbTint.setVisible(false);
      this.add(this.pbTint);
    }

    this.itemContainer = globalScene.add.container(0, 0);
    this.itemContainer.setScale(0.5);
    this.itemContainer.setAlpha(0);
    this.add(this.itemContainer);

    const getItem = () => {
      const item = globalScene.add.sprite(0, 0, "items", this.modifierTypeOption.type?.iconImage);
      return item;
    };

    this.item = getItem();
    this.itemContainer.add(this.item);

    if (!this.modifierTypeOption.cost) {
      this.itemTint = getItem();
      this.itemTint.setTintFill(Phaser.Display.Color.GetColor(255, 192, 255));
      this.itemContainer.add(this.itemTint);
    }

    this.itemText = addTextObject(0, 35, this.modifierTypeOption.type?.name!, TextStyle.PARTY, { align: "center" }); // TODO: is this bang correct?
    this.itemText.setOrigin(0.5, 0);
    this.itemText.setAlpha(0);
    this.itemText.setTint(
      this.modifierTypeOption.type?.tier ? getModifierTierTextTint(this.modifierTypeOption.type?.tier) : undefined,
    );
    this.add(this.itemText);

    if (this.modifierTypeOption.cost) {
      this.itemCostText = addTextObject(0, 45, "", TextStyle.MONEY, {
        align: "center",
      });

      this.itemCostText.setOrigin(0.5, 0);
      this.itemCostText.setAlpha(0);
      this.add(this.itemCostText);

      this.updateCostText();
    }
  }

  show(remainingDuration: number, upgradeCountOffset: number) {
    if (!this.modifierTypeOption.cost) {
      globalScene.tweens.add({
        targets: this.pb,
        y: 0,
        duration: 1250,
        ease: "Bounce.Out",
      });

      let lastValue = 1;
      let bounceCount = 0;
      let bounce = false;

      globalScene.tweens.addCounter({
        from: 1,
        to: 0,
        duration: 1250,
        ease: "Bounce.Out",
        onUpdate: t => {
          if (!globalScene) {
            return;
          }
          const value = t.getValue();
          if (!bounce && value > lastValue) {
            globalScene.playSound("se/pb_bounce_1", {
              volume: 1 / ++bounceCount,
            });
            bounce = true;
          } else if (bounce && value < lastValue) {
            bounce = false;
          }
          lastValue = value;
        },
      });

      for (let u = 0; u < this.modifierTypeOption.upgradeCount; u++) {
        const upgradeIndex = u;
        globalScene.time.delayedCall(
          remainingDuration - 2000 * (this.modifierTypeOption.upgradeCount - (upgradeIndex + 1 + upgradeCountOffset)),
          () => {
            globalScene.playSound("se/upgrade", {
              rate: 1 + 0.25 * upgradeIndex,
            });
            this.pbTint.setPosition(this.pb.x, this.pb.y);
            this.pbTint.setTintFill(0xffffff);
            this.pbTint.setAlpha(0);
            this.pbTint.setVisible(true);
            globalScene.tweens.add({
              targets: this.pbTint,
              alpha: 1,
              duration: 1000,
              ease: "Sine.easeIn",
              onComplete: () => {
                this.pb.setTexture(
                  "pb",
                  this.getPbAtlasKey(-this.modifierTypeOption.upgradeCount + (upgradeIndex + 1)),
                );
                globalScene.tweens.add({
                  targets: this.pbTint,
                  alpha: 0,
                  duration: 750,
                  ease: "Sine.easeOut",
                  onComplete: () => {
                    this.pbTint.setVisible(false);
                  },
                });
              },
            });
          },
        );
      }
    }

    globalScene.time.delayedCall(remainingDuration + 2000, () => {
      if (!globalScene) {
        return;
      }

      if (!this.modifierTypeOption.cost) {
        this.pb.setTexture("pb", `${this.getPbAtlasKey(0)}_open`);
        globalScene.playSound("se/pb_rel");

        globalScene.tweens.add({
          targets: this.pb,
          duration: 500,
          delay: 250,
          ease: "Sine.easeIn",
          alpha: 0,
          onComplete: () => this.pb.destroy(),
        });
      }

      globalScene.tweens.add({
        targets: this.itemContainer,
        duration: 500,
        ease: "Elastic.Out",
        scale: 2,
        alpha: 1,
      });
      if (!this.modifierTypeOption.cost) {
        globalScene.tweens.add({
          targets: this.itemTint,
          alpha: 0,
          duration: 500,
          ease: "Sine.easeIn",
          onComplete: () => this.itemTint.destroy(),
        });
      }
      globalScene.tweens.add({
        targets: this.itemText,
        duration: 500,
        alpha: 1,
        y: 25,
        ease: "Cubic.easeInOut",
      });
      if (this.itemCostText) {
        globalScene.tweens.add({
          targets: this.itemCostText,
          duration: 500,
          alpha: 1,
          y: 35,
          ease: "Cubic.easeInOut",
        });
      }
    });
  }

  getPbAtlasKey(tierOffset = 0) {
    return getPokeballAtlasKey((this.modifierTypeOption.type?.tier! + tierOffset) as number as PokeballType); // TODO: is this bang correct?
  }

  updateCostText(): void {
    const cost = Overrides.WAIVE_ROLL_FEE_OVERRIDE ? 0 : this.modifierTypeOption.cost;
    const textStyle = cost <= globalScene.money ? TextStyle.MONEY : TextStyle.PARTY_RED;

    const formattedMoney = formatMoney(globalScene.moneyFormat, cost);

    this.itemCostText.setText(i18next.t("modifierSelectUiHandler:itemCost", { formattedMoney }));
    this.itemCostText.setColor(getTextColor(textStyle, false, globalScene.uiTheme));
    this.itemCostText.setShadowColor(getTextColor(textStyle, true, globalScene.uiTheme));
  }
}
