import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import { TextStyle, addTextObject, getEggTierTextTint } from "./text";
import MessageUiHandler from "./message-ui-handler";
import * as Utils from "../utils";
import { EGG_SEED, Egg, GachaType, getEggTierDefaultHatchWaves, getEggDescriptor, getLegendaryGachaSpeciesForTimestamp } from "../data/egg";
import { VoucherType, getVoucherTypeIcon } from "../system/voucher";
import { getPokemonSpecies } from "../data/pokemon-species";
import { addWindow } from "./ui-theme";
import { Tutorial, handleTutorial } from "../tutorial";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import { EggTier } from "#enums/egg-type";

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

  private gachaCursor: integer;

  private cursorObj: Phaser.GameObjects.Image;
  private transitioning: boolean;
  private transitionCancelled: boolean;
  private defaultText: string;

  constructor(scene: BattleScene) {
    super(scene, Mode.EGG_GACHA);

    this.gachaContainers = [];
    this.gachaKnobs = [];
    this.gachaHatches = [];
    this.gachaInfoContainers = [];

    this.voucherCountLabels = [];
    this.defaultText = i18next.t("egg:selectMachine");
  }

  setup() {
    this.gachaCursor = 0;

    const ui = this.getUi();

    this.eggGachaContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.eggGachaContainer.setVisible(false);
    ui.add(this.eggGachaContainer);

    const bg = this.scene.add.nineslice(0, 0, "default_bg", null, 320, 180, 0, 0, 16, 0);
    bg.setOrigin(0, 0);

    this.eggGachaContainer.add(bg);

    const hatchFrameNames = this.scene.anims.generateFrameNames("gacha_hatch", { suffix: ".png", start: 1, end: 4 });
    if (!(this.scene.anims.exists("open"))) {
      this.scene.anims.create({
        key: "open",
        frames: hatchFrameNames,
        frameRate: 12
      });
    }
    if (!(this.scene.anims.exists("close"))) {
      this.scene.anims.create({
        key: "close",
        frames: hatchFrameNames.reverse(),
        frameRate: 12
      });
    }

    Utils.getEnumValues(GachaType).forEach((gachaType, g) => {
      const gachaTypeKey = GachaType[gachaType].toString().toLowerCase();
      const gachaContainer = this.scene.add.container(180 * g, 18);

      const gacha = this.scene.add.sprite(0, 0, `gacha_${gachaTypeKey}`);
      gacha.setOrigin(0, 0);

      const gachaUnderlay = this.scene.add.sprite(115, 80, `gacha_underlay_${gachaTypeKey}`);
      gachaUnderlay.setOrigin(0, 0);

      const gachaEggs = this.scene.add.sprite(0, 0, "gacha_eggs");
      gachaEggs.setOrigin(0, 0);

      const gachaGlass = this.scene.add.sprite(0, 0, "gacha_glass");
      gachaGlass.setOrigin(0, 0);

      const gachaInfoContainer = this.scene.add.container(160, 46);

      const gachaUpLabel = addTextObject(this.scene, 4, 0, "UP!", TextStyle.WINDOW_ALT);
      gachaUpLabel.setOrigin(0, 0);
      gachaInfoContainer.add(gachaUpLabel);

      switch (gachaType as GachaType) {
      case GachaType.LEGENDARY:
        const pokemonIcon = this.scene.add.sprite(-20, 6, "pokemon_icons_0");
        pokemonIcon.setScale(0.5);
        pokemonIcon.setOrigin(0, 0.5);

        gachaInfoContainer.add(pokemonIcon);
        break;
      case GachaType.MOVE:
        gachaUpLabel.setText("Move UP!");
        gachaUpLabel.setX(0);
        gachaUpLabel.setOrigin(0.5, 0);
        break;
      case GachaType.SHINY:
        gachaUpLabel.setText("Shiny UP!");
        gachaUpLabel.setX(0);
        gachaUpLabel.setOrigin(0.5, 0);
        break;
      }

      const gachaKnob = this.scene.add.sprite(191, 89, "gacha_knob");

      const gachaHatch = this.scene.add.sprite(115, 73, "gacha_hatch");
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

      gachaHatch.on("animationupdate", (_anim, frame) => gachaUnderlay.setFrame(frame.textureFrame === "4.png" ? "open_hatch" : "default"));

      this.gachaContainers.push(gachaContainer);
      this.gachaKnobs.push(gachaKnob);
      this.gachaHatches.push(gachaHatch);
      this.gachaInfoContainers.push(gachaInfoContainer);

      this.eggGachaContainer.add(gachaContainer);

      this.updateGachaInfo(g);
    });

    this.eggGachaOptionsContainer = this.scene.add.container();

    this.eggGachaOptionsContainer = this.scene.add.container((this.scene.game.canvas.width / 6), 148);
    this.eggGachaContainer.add(this.eggGachaOptionsContainer);


    this.eggGachaOptionSelectBg = addWindow(this.scene, 0, 0, 96, 112);
    this.eggGachaOptionSelectBg.setOrigin(1, 1);
    this.eggGachaOptionsContainer.add(this.eggGachaOptionSelectBg);

    const multiplierOne = "x1";
    const multiplierTen = "x10";
    const pullOptions = [
      { multiplier: multiplierOne, description: `1 ${i18next.t("egg:pull")}`, icon: getVoucherTypeIcon(VoucherType.REGULAR) },
      { multiplier: multiplierTen, description: `10 ${i18next.t("egg:pulls")}`, icon: getVoucherTypeIcon(VoucherType.REGULAR) },
      { multiplier: multiplierOne, description: `5 ${i18next.t("egg:pulls")}`, icon: getVoucherTypeIcon(VoucherType.PLUS) },
      { multiplier: multiplierOne, description: `10 ${i18next.t("egg:pulls")}`, icon: getVoucherTypeIcon(VoucherType.PREMIUM) },
      { multiplier: multiplierOne, description: `25 ${i18next.t("egg:pulls")}`, icon: getVoucherTypeIcon(VoucherType.GOLDEN) }
    ];

    const { resolvedLanguage } = i18next;
    const pullOptionsText = pullOptions.map(option =>{
      const desc = option.description.split(" ");
      if (desc[0].length < 2) {
        desc[0] += ["zh", "ko"].includes(resolvedLanguage.substring(0,2)) ? " " : "  ";
      }
      if (option.multiplier === multiplierOne) {
        desc[0] = " " + desc[0];
      }
      return `     ${option.multiplier.padEnd(5)}${desc.join(" ")}`;
    }).join("\n");

    const optionText = addTextObject(
      this.scene,
      0,
      0,
      `${pullOptionsText}\n${i18next.t("menu:cancel")}`,
      TextStyle.WINDOW,
    );

    optionText.setLineSpacing(28);
    optionText.setFontSize("80px");

    this.eggGachaOptionsContainer.add(optionText);

    optionText.setPositionRelative(this.eggGachaOptionSelectBg, 16, 9);

    pullOptions.forEach((option, i) => {
      const icon = this.scene.add.sprite(0, 0, "items", option.icon);
      icon.setScale(0.5);
      icon.setPositionRelative(this.eggGachaOptionSelectBg, 20, 17 + i * 16);
      this.eggGachaOptionsContainer.add(icon);
    });

    this.eggGachaContainer.add(this.eggGachaOptionsContainer);

    new Array(Utils.getEnumKeys(VoucherType).length).fill(null).map((_, i) => {
      const container = this.scene.add.container((this.scene.game.canvas.width / 6) - 56 * i, 0);

      const bg = addWindow(this.scene, 0, 0, 56, 22);
      bg.setOrigin(1, 0);
      container.add(bg);

      const countLabel = addTextObject(this.scene, -48, 3, "0", TextStyle.WINDOW);
      countLabel.setOrigin(0, 0);
      container.add(countLabel);

      this.voucherCountLabels.push(countLabel);

      const iconImage = getVoucherTypeIcon(i as VoucherType);

      const icon = this.scene.add.sprite(-19, 2, "items", iconImage);
      icon.setOrigin(0, 0);
      icon.setScale(0.5);
      container.add(icon);

      this.eggGachaContainer.add(container);
    });

    this.eggGachaOverlay = this.scene.add.rectangle(0, 0, bg.displayWidth, bg.displayHeight, 0x000000);
    this.eggGachaOverlay.setOrigin(0, 0);
    this.eggGachaOverlay.setAlpha(0);

    this.eggGachaContainer.add(this.eggGachaOverlay);

    this.eggGachaSummaryContainer = this.scene.add.container(0, 0);
    this.eggGachaSummaryContainer.setVisible(false);
    this.eggGachaContainer.add(this.eggGachaSummaryContainer);

    const gachaMessageBoxContainer = this.scene.add.container(0, 148);
    this.eggGachaContainer.add(gachaMessageBoxContainer);

    const gachaMessageBox = addWindow(this.scene, 0, 0, 320, 32);
    gachaMessageBox.setOrigin(0, 0);
    gachaMessageBoxContainer.add(gachaMessageBox);

    this.eggGachaMessageBox = gachaMessageBox;

    const gachaMessageText = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    gachaMessageText.setOrigin(0, 0);
    gachaMessageBoxContainer.add(gachaMessageText);

    this.message = gachaMessageText;

    this.eggGachaContainer.add(gachaMessageBoxContainer);

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

    handleTutorial(this.scene, Tutorial.Egg_Gacha);

    return true;
  }

  getDelayValue(delay: integer) {
    if (this.transitioning && this.transitionCancelled) {
      delay = Math.ceil(delay / 5);
    }
    return Utils.fixedInt(delay);
  }

  pull(pullCount?: integer, count?: integer, eggs?: Egg[]): void {
    this.eggGachaOptionsContainer.setVisible(false);
    this.setTransitioning(true);

    const doPull = () => {
      if (this.transitionCancelled) {
        return this.showSummary(eggs);
      }

      const egg = this.scene.add.sprite(127, 75, "egg", `egg_${eggs[count].getKey()}`);
      egg.setScale(0.5);

      this.gachaContainers[this.gachaCursor].add(egg);
      this.gachaContainers[this.gachaCursor].moveTo(egg, 2);

      const doPullAnim = () => {
        this.scene.playSound("gacha_running", { loop: true });
        this.scene.time.delayedCall(this.getDelayValue(count ? 500 : 1250), () => {
          this.scene.playSound("gacha_dispense");
          this.scene.time.delayedCall(this.getDelayValue(750), () => {
            this.scene.sound.stopByKey("gacha_running");
            this.scene.tweens.add({
              targets: egg,
              duration: this.getDelayValue(350),
              y: 95,
              ease: "Bounce.easeOut",
              onComplete: () => {
                this.scene.time.delayedCall(this.getDelayValue(125), () => {
                  this.scene.playSound("pb_catch");
                  this.gachaHatches[this.gachaCursor].play("open");
                  this.scene.tweens.add({
                    targets: egg,
                    duration: this.getDelayValue(350),
                    scale: 0.75,
                    ease: "Sine.easeIn"
                  });
                  this.scene.tweens.add({
                    targets: egg,
                    y: 110,
                    duration: this.getDelayValue(350),
                    ease: "Back.easeOut",
                    onComplete: () => {
                      this.gachaHatches[this.gachaCursor].play("close");
                      this.scene.tweens.add({
                        targets: egg,
                        y: 200,
                        duration: this.getDelayValue(350),
                        ease: "Cubic.easeIn",
                        onComplete: () => {
                          if (++count < pullCount) {
                            this.pull(pullCount, count, eggs);
                          } else {
                            this.showSummary(eggs);
                          }
                        }
                      });
                    }
                  });
                });
              }
            });
          });
        });
      };

      if (!count) {
        this.scene.playSound("gacha_dial");
        this.scene.tweens.add({
          targets: this.gachaKnobs[this.gachaCursor],
          duration: this.getDelayValue(350),
          angle: 90,
          ease: "Cubic.easeInOut",
          onComplete: () => {
            this.scene.tweens.add({
              targets: this.gachaKnobs[this.gachaCursor],
              duration: this.getDelayValue(350),
              angle: 0,
              ease: "Sine.easeInOut"
            });
            this.scene.time.delayedCall(this.getDelayValue(350), doPullAnim);
          }
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
      const tierValueOffset = this.gachaCursor === GachaType.LEGENDARY ? 1 : 0;
      const tiers = new Array(pullCount).fill(null).map(() => {
        const tierValue = Utils.randInt(256);
        return tierValue >= 52 + tierValueOffset ? EggTier.COMMON : tierValue >= 8 + tierValueOffset ? EggTier.GREAT : tierValue >= 1 + tierValueOffset ? EggTier.ULTRA : EggTier.MASTER;
      });
      if (pullCount >= 25 && !tiers.filter(t => t >= EggTier.ULTRA).length) {
        tiers[Utils.randInt(tiers.length)] = EggTier.ULTRA;
      } else if (pullCount >= 10 && !tiers.filter(t => t >= EggTier.GREAT).length) {
        tiers[Utils.randInt(tiers.length)] = EggTier.GREAT;
      }
      for (let i = 0; i < pullCount; i++) {
        this.scene.gameData.eggPity[EggTier.GREAT] += 1;
        this.scene.gameData.eggPity[EggTier.ULTRA] += 1;
        this.scene.gameData.eggPity[EggTier.MASTER] += 1 + tierValueOffset;
        // These numbers are roughly the 80% mark. That is, 80% of the time you'll get an egg before this gets triggered.
        if (this.scene.gameData.eggPity[EggTier.MASTER] >= 412 && tiers[i] === EggTier.COMMON) {
          tiers[i] = EggTier.MASTER;
        } else if (this.scene.gameData.eggPity[EggTier.ULTRA] >= 59 && tiers[i] === EggTier.COMMON) {
          tiers[i] = EggTier.ULTRA;
        } else if (this.scene.gameData.eggPity[EggTier.GREAT] >= 9 && tiers[i] === EggTier.COMMON) {
          tiers[i] = EggTier.GREAT;
        }
        this.scene.gameData.eggPity[tiers[i]] = 0;
      }

      const timestamp = new Date().getTime();

      for (const tier of tiers) {
        const eggId = Utils.randInt(EGG_SEED, EGG_SEED * tier);
        const egg = new Egg(eggId, this.gachaCursor, getEggTierDefaultHatchWaves(tier), timestamp);
        if (egg.isManaphyEgg()) {
          this.scene.gameData.gameStats.manaphyEggsPulled++;
          egg.hatchWaves = getEggTierDefaultHatchWaves(EggTier.ULTRA);
        } else {
          switch (tier) {
          case EggTier.GREAT:
            this.scene.gameData.gameStats.rareEggsPulled++;
            break;
          case EggTier.ULTRA:
            this.scene.gameData.gameStats.epicEggsPulled++;
            break;
          case EggTier.MASTER:
            this.scene.gameData.gameStats.legendaryEggsPulled++;
            break;
          }
        }
        eggs.push(egg);
        this.scene.gameData.eggs.push(egg);
        this.scene.gameData.gameStats.eggsPulled++;
      }

      (this.scene.currentBattle ? this.scene.gameData.saveAll(this.scene, true, true, true) : this.scene.gameData.saveSystem()).then(success => {
        if (!success) {
          return this.scene.reset(true);
        }
        doPull();
      });
      return;
    }

    doPull();
  }

  showSummary(eggs: Egg[]): void {
    this.transitioning = false;
    this.eggGachaSummaryContainer.setVisible(true);

    const eggScale = eggs.length < 20 ? 1 : 0.5;

    this.scene.tweens.add({
      targets: this.eggGachaOverlay,
      alpha: 0.5,
      ease: "Sine.easeOut",
      duration: 750,
      onComplete: () => {
        const rowItems = 5;
        const rows = Math.ceil(eggs.length / rowItems);
        const cols = Math.min(eggs.length, rowItems);
        const height = this.eggGachaOverlay.displayHeight - this.eggGachaMessageBox.displayHeight;
        const eggContainers = eggs.map((egg, t) => {
          const col = t % rowItems;
          const row = Math.floor(t / rowItems);
          const sliceWidth = this.eggGachaOverlay.displayWidth / (cols + 2);
          const sliceHeight = height / (rows + 2);
          const yOffset = (sliceHeight / 2 * (row / Math.max(rows - 1, 1))) + sliceHeight / 4;
          const ret = this.scene.add.container(sliceWidth * (col + 1) + (sliceWidth * 0.5), sliceHeight * (row + 1) + yOffset);
          ret.setScale(0.0001);

          const eggSprite = this.scene.add.sprite(0, 0, "egg", `egg_${egg.getKey()}`);
          ret.add(eggSprite);

          const eggText = addTextObject(this.scene, 0, 14, getEggDescriptor(egg), TextStyle.PARTY, { align: "center" });
          eggText.setOrigin(0.5, 0);
          eggText.setTint(getEggTierTextTint(!egg.isManaphyEgg() ? egg.tier : EggTier.ULTRA));
          ret.add(eggText);

          this.eggGachaSummaryContainer.addAt(ret, 0);
          return ret;
        });

        eggContainers.forEach((eggContainer, e) => {
          this.scene.tweens.add({
            targets: eggContainer,
            delay: this.getDelayValue(e * 100),
            duration: this.getDelayValue(350),
            scale: eggScale,
            ease: "Sine.easeOut"
          });
        });
      }
    });
  }

  hideSummary() {
    this.setTransitioning(true);
    this.scene.tweens.add({
      targets: [ this.eggGachaOverlay, this.eggGachaSummaryContainer ],
      alpha: 0,
      duration: this.getDelayValue(250),
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.eggGachaSummaryContainer.setVisible(false);
        this.eggGachaSummaryContainer.setAlpha(1);
        this.eggGachaSummaryContainer.removeAll(true);
        this.setTransitioning(false);
        this.eggGachaOptionsContainer.setVisible(true);
      }
    });
  }

  updateGachaInfo(gachaType: GachaType): void {
    const infoContainer = this.gachaInfoContainers[gachaType];
    switch (gachaType as GachaType) {
    case GachaType.LEGENDARY:
      const species = getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(this.scene, new Date().getTime()));
      const pokemonIcon = infoContainer.getAt(1) as Phaser.GameObjects.Sprite;
      pokemonIcon.setTexture(species.getIconAtlasKey(), species.getIconId(false));
      break;
    }
  }

  consumeVouchers(voucherType: VoucherType, count: integer): void {
    this.scene.gameData.voucherCounts[voucherType] = Math.max(this.scene.gameData.voucherCounts[voucherType] - count, 0);
    this.updateVoucherCounts();
  }

  updateVoucherCounts(): void {
    this.voucherCountLabels.forEach((label, type) => {
      label.setText(this.scene.gameData.voucherCounts[type].toString());
    });
  }

  showText(text: string, delay?: number, callback?: Function, callbackDelay?: number, prompt?: boolean, promptDelay?: number): void {
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
    this.showText(text, null, () => this.showText(this.defaultText), Utils.fixedInt(1500));
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
        if (button === Button.ACTION || button === Button.CANCEL) {
          this.hideSummary();
          success = true;
        }
      } else {
        switch (button) {
        case Button.ACTION:
          switch (this.cursor) {
          case 0:
            if (!this.scene.gameData.voucherCounts[VoucherType.REGULAR]) {
              error = true;
              this.showError(i18next.t("egg:notEnoughVouchers"));
            } else if (this.scene.gameData.eggs.length < 99) {
              this.consumeVouchers(VoucherType.REGULAR, 1);
              this.pull();
              success = true;
            } else {
              error = true;
              this.showError(i18next.t("egg:tooManyEggs"));
            }
            break;
          case 2:
            if (!this.scene.gameData.voucherCounts[VoucherType.PLUS]) {
              error = true;
              this.showError(i18next.t("egg:notEnoughVouchers"));
            } else if (this.scene.gameData.eggs.length < 95) {
              this.consumeVouchers(VoucherType.PLUS, 1);
              this.pull(5);
              success = true;
            } else {
              error = true;
              this.showError(i18next.t("egg:tooManyEggs"));
            }
            break;
          case 1:
          case 3:
            if ((this.cursor === 1 && this.scene.gameData.voucherCounts[VoucherType.REGULAR] < 10)
                  || (this.cursor === 3 && !this.scene.gameData.voucherCounts[VoucherType.PREMIUM])) {
              error = true;
              this.showError(i18next.t("egg:notEnoughVouchers"));
            } else if (this.scene.gameData.eggs.length < 90) {
              if (this.cursor === 3) {
                this.consumeVouchers(VoucherType.PREMIUM, 1);
              } else {
                this.consumeVouchers(VoucherType.REGULAR, 10);
              }
              this.pull(10);
              success = true;
            } else {
              error = true;
              this.showError(i18next.t("egg:tooManyEggs"));
            }
            break;
          case 4:
            if (!this.scene.gameData.voucherCounts[VoucherType.GOLDEN]) {
              error = true;
              this.showError(i18next.t("egg:notEnoughVouchers"));
            } else if (this.scene.gameData.eggs.length < 75) {
              this.consumeVouchers(VoucherType.GOLDEN, 1);
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
          if (this.gachaCursor < Utils.getEnumKeys(GachaType).length - 1) {
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

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      this.eggGachaOptionsContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.eggGachaOptionSelectBg, 10, 17 + this.cursor * 16);

    return ret;
  }

  setGachaCursor(cursor: integer): boolean {
    const oldCursor = this.gachaCursor;

    const changed = oldCursor !== cursor;

    if (changed) {
      this.gachaCursor = cursor;

      this.setTransitioning(true);

      this.scene.tweens.add({
        targets: this.gachaContainers,
        duration: this.eggGachaContainer.visible ? 500 : 0,
        x: (_target, _key, _value, index) => 180 * (index - cursor),
        ease: "Cubic.easeInOut",
        onComplete: () => this.setTransitioning(false)
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
