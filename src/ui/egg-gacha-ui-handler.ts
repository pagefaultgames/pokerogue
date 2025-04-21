import { UiMode } from "#enums/ui-mode";
import { TextStyle, addTextObject, getEggTierTextTint, getTextStyleOptions } from "./text";
import MessageUiHandler from "./message-ui-handler";
import { getEnumValues, getEnumKeys, fixedInt, randSeedShuffle } from "#app/utils/common";
import type { IEggOptions } from "../data/egg";
import { Egg, getLegendaryGachaSpeciesForTimestamp } from "../data/egg";
import { VoucherType, getVoucherTypeIcon } from "../system/voucher";
import { getPokemonSpecies } from "../data/pokemon-species";
import { addWindow } from "./ui-theme";
import { Tutorial, handleTutorial } from "../tutorial";
import { Button } from "#enums/buttons";
import Overrides from "#app/overrides";
import { GachaType } from "#app/enums/gacha-types";
import i18next from "i18next";
import { EggTier } from "#enums/egg-type";
import { globalScene } from "#app/global-scene";

export default class EggGachaUiHandler extends MessageUiHandler {
  private eggGachaContainer: Phaser.GameObjects.Container;
  private eggGachaMessageBox: Phaser.GameObjects.NineSlice;
  private eggGachaOptionsContainer: Phaser.GameObjects.Container;
  private eggGachaOptionSelectBg: Phaser.GameObjects.NineSlice;

  private gachaContainers: Phaser.GameObjects.Container[];
  private gachaKnobs: Phaser.GameObjects.Sprite[];
  private gachaHatches: Phaser.GameObjects.Sprite[];
  private gachaInfoContainers: Phaser.GameObjects.Container[];
  private eggGachaOverlay: Phaser.GameObjects.Rectangle;
  private eggGachaSummaryContainer: Phaser.GameObjects.Container;

  private voucherCountLabels: Phaser.GameObjects.Text[];

  private gachaCursor: number;

  private cursorObj: Phaser.GameObjects.Image;
  private transitioning: boolean;
  private transitionCancelled: boolean;
  private summaryFinished: boolean;
  private defaultText: string;

  private scale = 0.1666666667;

  constructor() {
    super(UiMode.EGG_GACHA);

    this.gachaContainers = [];
    this.gachaKnobs = [];
    this.gachaHatches = [];
    this.gachaInfoContainers = [];

    this.voucherCountLabels = [];
    this.defaultText = i18next.t("egg:selectMachine");
  }

  setup() {
    this.gachaCursor = 0;
    this.scale = getTextStyleOptions(TextStyle.WINDOW, globalScene.uiTheme).scale;

    const ui = this.getUi();

    this.eggGachaContainer = globalScene.add.container(0, -globalScene.game.canvas.height / 6);
    this.eggGachaContainer.setVisible(false);
    ui.add(this.eggGachaContainer);

    const bg = globalScene.add.nineslice(0, 0, "default_bg", undefined, 320, 180, 0, 0, 16, 0);
    bg.setOrigin(0, 0);

    this.eggGachaContainer.add(bg);

    const hatchFrameNames = globalScene.anims.generateFrameNames("gacha_hatch", { suffix: ".png", start: 1, end: 4 });
    if (!globalScene.anims.exists("open")) {
      globalScene.anims.create({
        key: "open",
        frames: hatchFrameNames,
        frameRate: 12,
      });
    }
    if (!globalScene.anims.exists("close")) {
      globalScene.anims.create({
        key: "close",
        frames: hatchFrameNames.reverse(),
        frameRate: 12,
      });
    }

    getEnumValues(GachaType).forEach((gachaType, g) => {
      const gachaTypeKey = GachaType[gachaType].toString().toLowerCase();
      const gachaContainer = globalScene.add.container(180 * g, 18);

      const gacha = globalScene.add.sprite(0, 0, `gacha_${gachaTypeKey}`);
      gacha.setOrigin(0, 0);

      const gachaUnderlay = globalScene.add.sprite(115, 80, `gacha_underlay_${gachaTypeKey}`);
      gachaUnderlay.setOrigin(0, 0);

      const gachaEggs = globalScene.add.sprite(0, 0, "gacha_eggs");
      gachaEggs.setOrigin(0, 0);

      const gachaGlass = globalScene.add.sprite(0, 0, "gacha_glass");
      gachaGlass.setOrigin(0, 0);

      const gachaInfoContainer = globalScene.add.container(160, 46);

      const currentLanguage = i18next.resolvedLanguage ?? "en";
      let gachaTextStyle = TextStyle.WINDOW_ALT;
      let gachaX = 4;
      let gachaY = 0;
      let pokemonIconX = -20;
      let pokemonIconY = 6;

      if (["de", "es-ES", "fr", "ko", "pt-BR"].includes(currentLanguage)) {
        gachaTextStyle = TextStyle.SMALLER_WINDOW_ALT;
        gachaX = 2;
        gachaY = 2;
      }

      let legendaryLabelX = gachaX;
      let legendaryLabelY = gachaY;
      if (["de", "es-ES"].includes(currentLanguage)) {
        pokemonIconX = -25;
        pokemonIconY = 10;
        legendaryLabelX = -6;
        legendaryLabelY = 0;
      }

      const gachaUpLabel = addTextObject(gachaX, gachaY, i18next.t("egg:legendaryUPGacha"), gachaTextStyle);
      gachaUpLabel.setOrigin(0, 0);
      gachaInfoContainer.add(gachaUpLabel);

      switch (gachaType as GachaType) {
        case GachaType.LEGENDARY:
          if (["de", "es-ES"].includes(currentLanguage)) {
            gachaUpLabel.setAlign("center");
            gachaUpLabel.setY(0);
          }
          if (["pt-BR"].includes(currentLanguage)) {
            gachaUpLabel.setX(legendaryLabelX - 2);
          } else {
            gachaUpLabel.setX(legendaryLabelX);
          }
          gachaUpLabel.setY(legendaryLabelY);

          const pokemonIcon = globalScene.add.sprite(pokemonIconX, pokemonIconY, "pokemon_icons_0");
          if (["pt-BR"].includes(currentLanguage)) {
            pokemonIcon.setX(pokemonIconX - 2);
          }
          pokemonIcon.setScale(0.5);
          pokemonIcon.setOrigin(0, 0.5);

          gachaInfoContainer.add(pokemonIcon);
          break;
        case GachaType.MOVE:
          if (["de", "es-ES", "fr", "pt-BR"].includes(currentLanguage)) {
            gachaUpLabel.setAlign("center");
            gachaUpLabel.setY(0);
          }

          gachaUpLabel.setText(i18next.t("egg:moveUPGacha"));
          gachaUpLabel.setX(0);
          gachaUpLabel.setOrigin(0.5, 0);
          break;
        case GachaType.SHINY:
          if (["de", "fr", "ko"].includes(currentLanguage)) {
            gachaUpLabel.setAlign("center");
            gachaUpLabel.setY(0);
          }

          gachaUpLabel.setText(i18next.t("egg:shinyUPGacha"));
          gachaUpLabel.setX(0);
          gachaUpLabel.setOrigin(0.5, 0);
          break;
      }

      const gachaKnob = globalScene.add.sprite(191, 89, "gacha_knob");

      const gachaHatch = globalScene.add.sprite(115, 73, "gacha_hatch");
      gachaHatch.setOrigin(0, 0);

      gachaContainer.add(gachaEggs);
      gachaContainer.add(gachaUnderlay);
      gachaContainer.add(gacha);
      gachaContainer.add(gachaGlass);
      gachaContainer.add(gachaKnob);
      gachaContainer.add(gachaHatch);
      gachaContainer.add(gachaInfoContainer);

      gachaGlass.setAlpha(0.5);
      gachaHatch.setAlpha(0.9);

      gachaHatch.on("animationupdate", (_anim, frame) =>
        gachaUnderlay.setFrame(frame.textureFrame === "4.png" ? "open_hatch" : "default"),
      );

      this.gachaContainers.push(gachaContainer);
      this.gachaKnobs.push(gachaKnob);
      this.gachaHatches.push(gachaHatch);
      this.gachaInfoContainers.push(gachaInfoContainer);

      this.eggGachaContainer.add(gachaContainer);

      this.updateGachaInfo(g);
    });

    this.eggGachaOptionsContainer = globalScene.add.container();

    this.eggGachaOptionsContainer = globalScene.add.container(globalScene.game.canvas.width / 6, 148);
    this.eggGachaContainer.add(this.eggGachaOptionsContainer);

    this.eggGachaOptionSelectBg = addWindow(0, 0, 96, 16 + 576 * this.scale);
    this.eggGachaOptionSelectBg.setOrigin(1, 1);
    this.eggGachaOptionsContainer.add(this.eggGachaOptionSelectBg);

    const multiplierOne = "x1";
    const multiplierTen = "x10";
    const pullOptions = [
      {
        multiplier: multiplierOne,
        description: `1 ${i18next.t("egg:pull")}`,
        icon: getVoucherTypeIcon(VoucherType.REGULAR),
      },
      {
        multiplier: multiplierTen,
        description: `10 ${i18next.t("egg:pulls")}`,
        icon: getVoucherTypeIcon(VoucherType.REGULAR),
      },
      {
        multiplier: multiplierOne,
        description: `5 ${i18next.t("egg:pulls")}`,
        icon: getVoucherTypeIcon(VoucherType.PLUS),
      },
      {
        multiplier: multiplierOne,
        description: `10 ${i18next.t("egg:pulls")}`,
        icon: getVoucherTypeIcon(VoucherType.PREMIUM),
      },
      {
        multiplier: multiplierOne,
        description: `25 ${i18next.t("egg:pulls")}`,
        icon: getVoucherTypeIcon(VoucherType.GOLDEN),
      },
    ];

    const resolvedLanguage = i18next.resolvedLanguage ?? "en";
    const pullOptionsText = pullOptions
      .map(option => {
        const desc = option.description.split(" ");
        if (desc[0].length < 2) {
          desc[0] += ["zh", "ko"].includes(resolvedLanguage.substring(0, 2)) ? " " : "  ";
        }
        if (option.multiplier === multiplierOne) {
          desc[0] = " " + desc[0];
        }
        return `     ${option.multiplier.padEnd(5)}${desc.join(" ")}`;
      })
      .join("\n");

    const optionText = addTextObject(0, 0, `${pullOptionsText}\n${i18next.t("menu:cancel")}`, TextStyle.WINDOW);

    optionText.setLineSpacing(28);
    optionText.setFontSize("80px");

    this.eggGachaOptionsContainer.add(optionText);

    optionText.setPositionRelative(this.eggGachaOptionSelectBg, 16, 9);

    pullOptions.forEach((option, i) => {
      const icon = globalScene.add.sprite(0, 0, "items", option.icon);
      icon.setScale(3 * this.scale);
      icon.setPositionRelative(this.eggGachaOptionSelectBg, 20, 9 + (48 + i * 96) * this.scale);
      this.eggGachaOptionsContainer.add(icon);
    });

    this.eggGachaContainer.add(this.eggGachaOptionsContainer);

    new Array(getEnumKeys(VoucherType).length).fill(null).map((_, i) => {
      const container = globalScene.add.container(globalScene.game.canvas.width / 6 - 56 * i, 0);

      const bg = addWindow(0, 0, 56, 22);
      bg.setOrigin(1, 0);
      container.add(bg);

      const countLabel = addTextObject(-48, 3, "0", TextStyle.WINDOW);
      countLabel.setOrigin(0, 0);
      container.add(countLabel);

      this.voucherCountLabels.push(countLabel);

      const iconImage = getVoucherTypeIcon(i as VoucherType);

      const icon = globalScene.add.sprite(-19, 2, "items", iconImage);
      icon.setOrigin(0, 0);
      icon.setScale(0.5);
      container.add(icon);

      this.eggGachaContainer.add(container);
    });

    this.eggGachaOverlay = globalScene.add.rectangle(0, 0, bg.displayWidth, bg.displayHeight, 0x000000);
    this.eggGachaOverlay.setOrigin(0, 0);
    this.eggGachaOverlay.setAlpha(0);

    this.eggGachaContainer.add(this.eggGachaOverlay);

    this.eggGachaSummaryContainer = globalScene.add.container(0, 0);
    this.eggGachaSummaryContainer.setVisible(false);
    this.eggGachaContainer.add(this.eggGachaSummaryContainer);

    const gachaMessageBoxContainer = globalScene.add.container(0, 148);

    const gachaMessageBox = addWindow(0, 0, 320, 32);
    gachaMessageBox.setOrigin(0, 0);
    gachaMessageBoxContainer.add(gachaMessageBox);

    this.eggGachaMessageBox = gachaMessageBox;

    const gachaMessageText = addTextObject(8, 8, "", TextStyle.WINDOW, {
      maxLines: 2,
    });
    gachaMessageText.setOrigin(0, 0);
    gachaMessageBoxContainer.add(gachaMessageText);

    this.message = gachaMessageText;

    this.initTutorialOverlay(this.eggGachaContainer);
    this.eggGachaContainer.add(gachaMessageBoxContainer);

    this.initPromptSprite(gachaMessageBoxContainer);

    this.setCursor(0);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.getUi().showText(this.defaultText, 0);

    this.setGachaCursor(1);

    for (let g = 0; g < this.gachaContainers.length; g++) {
      this.updateGachaInfo(g);
    }

    this.updateVoucherCounts();

    this.getUi().bringToTop(this.eggGachaContainer);

    this.eggGachaContainer.setVisible(true);

    handleTutorial(Tutorial.Egg_Gacha);

    return true;
  }

  getDelayValue(delay: number) {
    if (this.transitioning && this.transitionCancelled) {
      delay = Math.ceil(delay / 5);
    }
    return fixedInt(delay);
  }

  pull(pullCount = 0, count = 0, eggs?: Egg[]): void {
    if (Overrides.EGG_GACHA_PULL_COUNT_OVERRIDE && !count) {
      pullCount = Overrides.EGG_GACHA_PULL_COUNT_OVERRIDE;
    }

    this.eggGachaOptionsContainer.setVisible(false);
    this.setTransitioning(true);

    const doPull = () => {
      if (this.transitionCancelled) {
        return this.showSummary(eggs!);
      }

      const egg = globalScene.add.sprite(127, 75, "egg", `egg_${eggs![count].getKey()}`);
      egg.setScale(0.5);

      this.gachaContainers[this.gachaCursor].add(egg);
      this.gachaContainers[this.gachaCursor].moveTo(egg, 2);

      const doPullAnim = () => {
        globalScene.playSound("se/gacha_running", { loop: true });
        globalScene.time.delayedCall(this.getDelayValue(count ? 500 : 1250), () => {
          globalScene.playSound("se/gacha_dispense");
          globalScene.time.delayedCall(this.getDelayValue(750), () => {
            globalScene.sound.stopByKey("se/gacha_running");
            globalScene.tweens.add({
              targets: egg,
              duration: this.getDelayValue(350),
              y: 95,
              ease: "Bounce.easeOut",
              onComplete: () => {
                globalScene.time.delayedCall(this.getDelayValue(125), () => {
                  globalScene.playSound("se/pb_catch");
                  this.gachaHatches[this.gachaCursor].play("open");
                  globalScene.tweens.add({
                    targets: egg,
                    duration: this.getDelayValue(350),
                    scale: 0.75,
                    ease: "Sine.easeIn",
                  });
                  globalScene.tweens.add({
                    targets: egg,
                    y: 110,
                    duration: this.getDelayValue(350),
                    ease: "Back.easeOut",
                    onComplete: () => {
                      this.gachaHatches[this.gachaCursor].play("close");
                      globalScene.tweens.add({
                        targets: egg,
                        y: 200,
                        duration: this.getDelayValue(350),
                        ease: "Cubic.easeIn",
                        onComplete: () => {
                          if (++count < pullCount) {
                            this.pull(pullCount, count, eggs);
                          } else {
                            this.showSummary(eggs!);
                          }
                        },
                      });
                    },
                  });
                });
              },
            });
          });
        });
      };

      if (!count) {
        globalScene.playSound("se/gacha_dial");
        globalScene.tweens.add({
          targets: this.gachaKnobs[this.gachaCursor],
          duration: this.getDelayValue(350),
          angle: 90,
          ease: "Cubic.easeInOut",
          onComplete: () => {
            globalScene.tweens.add({
              targets: this.gachaKnobs[this.gachaCursor],
              duration: this.getDelayValue(350),
              angle: 0,
              ease: "Sine.easeInOut",
            });
            globalScene.time.delayedCall(this.getDelayValue(350), doPullAnim);
          },
        });
      } else {
        doPullAnim();
      }
    };

    if (!pullCount) {
      pullCount = 1;
    }
    if (!count) {
      count = 0;
    }
    if (!eggs) {
      eggs = [];
      for (let i = 1; i <= pullCount; i++) {
        const eggOptions: IEggOptions = {
          pulled: true,
          sourceType: this.gachaCursor,
        };

        // Before creating the last egg, check if the guaranteed egg tier was already generated
        // if not, override the egg tier
        if (i === pullCount) {
          const guaranteedEggTier = this.getGuaranteedEggTierFromPullCount(pullCount);
          if (!eggs.some(egg => egg.tier >= guaranteedEggTier) && guaranteedEggTier !== EggTier.COMMON) {
            eggOptions.tier = guaranteedEggTier;
          }
        }

        const egg = new Egg(eggOptions);
        eggs.push(egg);
      }
      // Shuffle the eggs in case the guaranteed one got added as last egg
      eggs = randSeedShuffle<Egg>(eggs);

      (globalScene.currentBattle
        ? globalScene.gameData.saveAll(true, true, true)
        : globalScene.gameData.saveSystem()
      ).then(success => {
        if (!success) {
          return globalScene.reset(true);
        }
        doPull();
      });
      return;
    }

    doPull();
  }

  getGuaranteedEggTierFromPullCount(pullCount: number): EggTier {
    switch (pullCount) {
      case 10:
        return EggTier.RARE;
      case 25:
        return EggTier.EPIC;
      default:
        return EggTier.COMMON;
    }
  }

  showSummary(eggs: Egg[]): void {
    // the overlay will appear faster if the egg pulling animation was skipped
    const overlayEaseInDuration = this.getDelayValue(750);

    this.summaryFinished = false;
    this.transitionCancelled = false;
    this.setTransitioning(true);
    this.eggGachaSummaryContainer.setVisible(true);

    const eggScale = eggs.length < 20 ? 1 : 0.5;

    globalScene.tweens.add({
      targets: this.eggGachaOverlay,
      alpha: 0.5,
      ease: "Sine.easeOut",
      duration: overlayEaseInDuration,
      onComplete: () => {
        const rowItems = 5;
        const rows = Math.ceil(eggs.length / rowItems);
        const cols = Math.min(eggs.length, rowItems);
        const height = this.eggGachaOverlay.displayHeight - this.eggGachaMessageBox.displayHeight;

        // Create sprites for each egg
        const eggContainers = eggs.map((egg, t) => {
          const col = t % rowItems;
          const row = Math.floor(t / rowItems);
          const sliceWidth = this.eggGachaOverlay.displayWidth / (cols + 2);
          const sliceHeight = height / (rows + 2);
          const yOffset = (sliceHeight / 2) * (row / Math.max(rows - 1, 1)) + sliceHeight / 4;
          const ret = globalScene.add.container(
            sliceWidth * (col + 1) + sliceWidth * 0.5,
            sliceHeight * (row + 1) + yOffset,
          );
          ret.setScale(0.0001);

          const eggSprite = globalScene.add.sprite(0, 0, "egg", `egg_${egg.getKey()}`);
          ret.add(eggSprite);

          const eggText = addTextObject(0, 14, egg.getEggDescriptor(), TextStyle.PARTY, { align: "center" });
          eggText.setOrigin(0.5, 0);
          eggText.setTint(getEggTierTextTint(!egg.isManaphyEgg() ? egg.tier : EggTier.EPIC));
          ret.add(eggText);

          this.eggGachaSummaryContainer.addAt(ret, 0);
          return ret;
        });

        // If action/cancel was pressed when the overlay was easing in, show all eggs at once
        // Otherwise show the eggs one by one with a small delay between each
        eggContainers.forEach((eggContainer, index) => {
          const delay = !this.transitionCancelled ? this.getDelayValue(index * 100) : 0;
          globalScene.time.delayedCall(delay, () =>
            globalScene.tweens.add({
              targets: eggContainer,
              duration: this.getDelayValue(350),
              scale: eggScale,
              ease: "Sine.easeOut",
              onComplete: () => {
                if (index === eggs.length - 1) {
                  this.setTransitioning(false);
                  this.summaryFinished = true;
                }
              },
            }),
          );
        });
      },
    });
  }

  hideSummary() {
    this.setTransitioning(true);
    globalScene.tweens.add({
      targets: [this.eggGachaOverlay, this.eggGachaSummaryContainer],
      alpha: 0,
      duration: this.getDelayValue(250),
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.eggGachaSummaryContainer.setVisible(false);
        this.eggGachaSummaryContainer.setAlpha(1);
        this.eggGachaSummaryContainer.removeAll(true);
        this.setTransitioning(false);
        this.summaryFinished = false;
        this.eggGachaOptionsContainer.setVisible(true);
      },
    });
  }

  updateGachaInfo(gachaType: GachaType): void {
    const infoContainer = this.gachaInfoContainers[gachaType];
    switch (gachaType as GachaType) {
      case GachaType.LEGENDARY:
        const species = getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(new Date().getTime()));
        const pokemonIcon = infoContainer.getAt(1) as Phaser.GameObjects.Sprite;
        pokemonIcon.setTexture(species.getIconAtlasKey(), species.getIconId(false));
        break;
    }
  }

  consumeVouchers(voucherType: VoucherType, count: number): void {
    globalScene.gameData.voucherCounts[voucherType] = Math.max(
      globalScene.gameData.voucherCounts[voucherType] - count,
      0,
    );
    this.updateVoucherCounts();
  }

  updateVoucherCounts(): void {
    this.voucherCountLabels.forEach((label, type) => {
      label.setText(globalScene.gameData.voucherCounts[type].toString());
    });
  }

  showText(
    text: string,
    delay?: number,
    callback?: Function,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ): void {
    if (!text) {
      text = this.defaultText;
    }

    if (text?.indexOf("\n") === -1) {
      this.eggGachaMessageBox.setSize(320, 32);
      this.eggGachaMessageBox.setY(0);
      this.message.setY(8);
    } else {
      this.eggGachaMessageBox.setSize(320, 46);
      this.eggGachaMessageBox.setY(-14);
      this.message.setY(-6);
    }

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showError(text: string): void {
    this.showText(text, undefined, () => this.showText(this.defaultText), fixedInt(1500));
  }

  setTransitioning(transitioning: boolean): void {
    if (this.transitioning === transitioning) {
      return;
    }
    this.transitioning = transitioning;
    this.transitionCancelled = false;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (this.transitioning) {
      if (!this.transitionCancelled && (button === Button.ACTION || button === Button.CANCEL)) {
        this.transitionCancelled = true;
        success = true;
      } else {
        return false;
      }
    } else {
      if (this.eggGachaSummaryContainer.visible) {
        if (this.summaryFinished && (button === Button.ACTION || button === Button.CANCEL)) {
          this.hideSummary();
          success = true;
        }
      } else {
        switch (button) {
          case Button.ACTION:
            switch (this.cursor) {
              case 0:
                if (
                  !globalScene.gameData.voucherCounts[VoucherType.REGULAR] &&
                  !Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE
                ) {
                  error = true;
                  this.showError(i18next.t("egg:notEnoughVouchers"));
                } else if (globalScene.gameData.eggs.length < 99 || Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
                  if (!Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) {
                    this.consumeVouchers(VoucherType.REGULAR, 1);
                  }
                  this.pull();
                  success = true;
                } else {
                  error = true;
                  this.showError(i18next.t("egg:tooManyEggs"));
                }
                break;
              case 2:
                if (!globalScene.gameData.voucherCounts[VoucherType.PLUS] && !Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) {
                  error = true;
                  this.showError(i18next.t("egg:notEnoughVouchers"));
                } else if (globalScene.gameData.eggs.length < 95 || Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
                  if (!Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) {
                    this.consumeVouchers(VoucherType.PLUS, 1);
                  }
                  this.pull(5);
                  success = true;
                } else {
                  error = true;
                  this.showError(i18next.t("egg:tooManyEggs"));
                }
                break;
              case 1:
              case 3:
                if (
                  (this.cursor === 1 &&
                    globalScene.gameData.voucherCounts[VoucherType.REGULAR] < 10 &&
                    !Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) ||
                  (this.cursor === 3 &&
                    !globalScene.gameData.voucherCounts[VoucherType.PREMIUM] &&
                    !Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE)
                ) {
                  error = true;
                  this.showError(i18next.t("egg:notEnoughVouchers"));
                } else if (globalScene.gameData.eggs.length < 90 || Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
                  if (this.cursor === 3) {
                    if (!Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) {
                      this.consumeVouchers(VoucherType.PREMIUM, 1);
                    }
                  } else {
                    if (!Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) {
                      this.consumeVouchers(VoucherType.REGULAR, 10);
                    }
                  }
                  this.pull(10);
                  success = true;
                } else {
                  error = true;
                  this.showError(i18next.t("egg:tooManyEggs"));
                }
                break;
              case 4:
                if (
                  !globalScene.gameData.voucherCounts[VoucherType.GOLDEN] &&
                  !Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE
                ) {
                  error = true;
                  this.showError(i18next.t("egg:notEnoughVouchers"));
                } else if (globalScene.gameData.eggs.length < 75 || Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
                  if (!Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE) {
                    this.consumeVouchers(VoucherType.GOLDEN, 1);
                  }
                  this.pull(25);
                  success = true;
                } else {
                  error = true;
                  this.showError(i18next.t("egg:tooManyEggs"));
                }
                break;
              case 5:
                ui.revertMode();
                success = true;
                break;
            }
            break;
          case Button.CANCEL:
            this.getUi().revertMode();
            success = true;
            break;
          case Button.UP:
            if (this.cursor) {
              success = this.setCursor(this.cursor - 1);
            }
            break;
          case Button.DOWN:
            if (this.cursor < 5) {
              success = this.setCursor(this.cursor + 1);
            }
            break;
          case Button.LEFT:
            if (this.gachaCursor) {
              success = this.setGachaCursor(this.gachaCursor - 1);
            }
            break;
          case Button.RIGHT:
            if (this.gachaCursor < getEnumKeys(GachaType).length - 1) {
              success = this.setGachaCursor(this.gachaCursor + 1);
            }
            break;
        }
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.eggGachaOptionsContainer.add(this.cursorObj);
    }

    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.eggGachaOptionSelectBg, 10, 9 + (48 + this.cursor * 96) * this.scale);

    return ret;
  }

  setGachaCursor(cursor: number): boolean {
    const oldCursor = this.gachaCursor;

    const changed = oldCursor !== cursor;

    if (changed) {
      this.gachaCursor = cursor;

      this.setTransitioning(true);

      globalScene.tweens.add({
        targets: this.gachaContainers,
        duration: this.eggGachaContainer.visible ? 500 : 0,
        x: (_target, _key, _value, index) => 180 * (index - cursor),
        ease: "Cubic.easeInOut",
        onComplete: () => this.setTransitioning(false),
      });
    }

    return changed;
  }

  clear(): void {
    super.clear();
    this.setGachaCursor(-1);
    this.eggGachaContainer.setVisible(false);
  }
}
