import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { handleTutorial, Tutorial } from "#app/tutorial";
import type { IEggOptions } from "#data/egg";
import { Egg, getLegendaryGachaSpeciesForTimestamp } from "#data/egg";
import { Button } from "#enums/buttons";
import { EggTier } from "#enums/egg-type";
import { GachaType } from "#enums/gacha-types";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { getVoucherTypeIcon, VoucherType } from "#system/voucher";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { addTextObject, getEggTierTextTint, getTextStyleOptions } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { fixedInt, randSeedShuffle } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

export class EggGachaUiHandler extends MessageUiHandler {
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

  /** The tween chain playing the egg drop animation sequence */
  private eggDropTweenChain?: Phaser.Tweens.TweenChain;

  private scale = 0.1666666667;

  private legendaryExpiration = addTextObject(0, 0, "", TextStyle.WINDOW_ALT);
  private playTimeTimer: Phaser.Time.TimerEvent | null;

  constructor() {
    super(UiMode.EGG_GACHA);

    this.gachaContainers = [];
    this.gachaKnobs = [];
    this.gachaHatches = [];
    this.gachaInfoContainers = [];

    this.voucherCountLabels = [];
    this.defaultText = i18next.t("egg:selectMachine");
  }

  private setupGachaType(key: keyof typeof GachaType, gachaType: GachaType): void {
    const gachaTypeKey = key.toLowerCase();
    const gachaContainer = globalScene.add.container(180 * gachaType, 18);

    const gacha = globalScene.add.sprite(0, 0, `gacha_${gachaTypeKey}`).setOrigin(0);

    const gachaUnderlay = globalScene.add.sprite(115, 80, `gacha_underlay_${gachaTypeKey}`).setOrigin(0);

    const gachaEggs = globalScene.add.sprite(0, 0, "gacha_eggs").setOrigin(0);

    const gachaGlass = globalScene.add.sprite(0, 0, "gacha_glass").setOrigin(0);

    const gachaInfoContainer = globalScene.add.container(160, 46);

    const currentLanguage = i18next.resolvedLanguage ?? "en";
    let gachaTextStyle: TextStyle = TextStyle.WINDOW_ALT;
    let gachaX = 4;
    let gachaY = 0;
    let pokemonIconX = -20;
    let pokemonIconY = 6;

    if (["de", "es-ES", "es-MX", "fr", "ko", "pt-BR", "ja", "ru"].includes(currentLanguage)) {
      gachaTextStyle = TextStyle.SMALLER_WINDOW_ALT;
      gachaX = 2;
      gachaY = 2;
    }

    let legendaryLabelX = gachaX;
    let legendaryLabelY = gachaY;
    if (["de", "es-ES", "es-MX"].includes(currentLanguage)) {
      pokemonIconX = -25;
      pokemonIconY = 10;
      legendaryLabelX = -6;
      legendaryLabelY = 0;
    }

    const gachaUpLabel = addTextObject(gachaX, gachaY, i18next.t("egg:legendaryUPGacha"), gachaTextStyle).setOrigin(0);
    gachaInfoContainer.add(gachaUpLabel);

    switch (gachaType as GachaType) {
      case GachaType.LEGENDARY:
        {
          if (["de", "es-ES"].includes(currentLanguage)) {
            gachaUpLabel.setAlign("center");
          }
          let xOffset = 0;
          const pokemonIcon = globalScene.add.sprite(pokemonIconX, pokemonIconY, "pokemon_icons_0");

          // Intentionally left as "array includes" instead of an equality check to allow for future languages to reuse
          if (["pt-BR"].includes(currentLanguage)) {
            xOffset = 2;
            pokemonIcon.setX(pokemonIconX - 2);
          }

          gachaUpLabel.setX(legendaryLabelX - xOffset).setY(legendaryLabelY);
          pokemonIcon.setScale(0.5).setOrigin(0, 0.5);
          gachaInfoContainer.add(pokemonIcon);
        }
        break;
      case GachaType.MOVE:
        if (["de", "es-ES", "fr", "pt-BR", "ru"].includes(currentLanguage)) {
          gachaUpLabel.setAlign("center").setY(0);
        }

        gachaUpLabel.setText(i18next.t("egg:moveUPGacha")).setX(0).setOrigin(0.5, 0);
        break;
      case GachaType.SHINY:
        if (["de", "fr", "ko", "ru"].includes(currentLanguage)) {
          gachaUpLabel.setAlign("center").setY(0);
        }

        gachaUpLabel.setText(i18next.t("egg:shinyUPGacha")).setX(0).setOrigin(0.5, 0);
        break;
    }

    const gachaKnob = globalScene.add.sprite(191, 89, "gacha_knob");

    const gachaHatch = globalScene.add.sprite(115, 73, "gacha_hatch");
    gachaHatch.setOrigin(0).setAlpha(0.9);
    gachaGlass.setAlpha(0.5);
    gachaContainer.add([gachaEggs, gachaUnderlay, gacha, gachaGlass, gachaKnob, gachaHatch, gachaInfoContainer]);

    gachaHatch.on("animationupdate", (_anim, frame) =>
      gachaUnderlay.setFrame(frame.textureFrame === "4.png" ? "open_hatch" : "default"),
    );

    this.gachaContainers.push(gachaContainer);
    this.gachaKnobs.push(gachaKnob);
    this.gachaHatches.push(gachaHatch);
    this.gachaInfoContainers.push(gachaInfoContainer);

    this.eggGachaContainer.add(gachaContainer);

    if (gachaType === GachaType.LEGENDARY) {
      // Expiration timer for the legendary gacha
      this.legendaryExpiration
        .setText(this.getLegendaryGachaTimeLeft())
        .setFontSize("64px")
        .setPositionRelative(
          gacha,
          gacha.width / 2 - this.legendaryExpiration.displayWidth / 2 + 0.3,
          gacha.height / 2 + 12.5,
        );
      gachaContainer.add(this.legendaryExpiration);
      this.updateLegendaryGacha();
    }
  }

  setup() {
    this.gachaCursor = 0;
    this.scale = getTextStyleOptions(TextStyle.WINDOW).scale;

    const ui = this.getUi();

    this.eggGachaContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height).setVisible(false);
    ui.add(this.eggGachaContainer);

    const bg = globalScene.add.nineslice(0, 0, "default_bg", undefined, 320, 180, 0, 0, 16, 0).setOrigin(0);

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

    for (const [gachaTypeKey, gachaType] of Object.entries(GachaType)) {
      this.setupGachaType(gachaTypeKey as keyof typeof GachaType, gachaType);
    }

    let eggGachaOptionSelectWidth = 0;
    switch (i18next.resolvedLanguage) {
      case "ru":
        eggGachaOptionSelectWidth = 100;
        break;
      default:
        eggGachaOptionSelectWidth = 96;
    }

    this.eggGachaOptionSelectBg = addWindow(0, 0, eggGachaOptionSelectWidth, 16 + 576 * this.scale).setOrigin(1);
    this.eggGachaOptionsContainer = globalScene.add
      .container(globalScene.scaledCanvas.width, 148)
      .add(this.eggGachaOptionSelectBg);
    this.eggGachaContainer.add(this.eggGachaOptionsContainer);

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
          desc[0] += " ";
        }
        return `     ${option.multiplier.padEnd(5)}${desc.join(" ")}`;
      })
      .join("\n");

    const optionText = addTextObject(0, 0, `${pullOptionsText}\n${i18next.t("menu:cancel")}`, TextStyle.WINDOW)
      .setLineSpacing(28)
      .setFontSize("80px")
      .setPositionRelative(this.eggGachaOptionSelectBg, 16, 9);

    this.eggGachaOptionsContainer.add(optionText);

    pullOptions.forEach((option, i) => {
      const icon = globalScene.add
        .sprite(0, 0, "items", option.icon)
        .setScale(3 * this.scale)
        .setPositionRelative(this.eggGachaOptionSelectBg, 20, 9 + (48 + i * 96) * this.scale);
      this.eggGachaOptionsContainer.add(icon);
    });

    this.eggGachaContainer.add(this.eggGachaOptionsContainer);

    for (const voucher of getEnumValues(VoucherType)) {
      const container = globalScene.add.container(globalScene.scaledCanvas.width - 56 * voucher, 0);

      const bg = addWindow(0, 0, 56, 22).setOrigin(1, 0);
      container.add(bg);

      const countLabel = addTextObject(-48, 3, "0", TextStyle.WINDOW).setOrigin(0);
      container.add(countLabel);

      this.voucherCountLabels.push(countLabel);

      const iconImage = getVoucherTypeIcon(voucher);

      const icon = globalScene.add.sprite(-19, 2, "items", iconImage).setOrigin(0).setScale(0.5);
      container.add(icon);

      this.eggGachaContainer.add(container);
    }

    this.eggGachaOverlay = globalScene.add
      .rectangle(0, 0, bg.displayWidth, bg.displayHeight, 0x000000)
      .setOrigin(0)
      .setAlpha(0);

    this.eggGachaContainer.add(this.eggGachaOverlay);

    this.eggGachaSummaryContainer = globalScene.add.container().setVisible(false);
    this.eggGachaContainer.add(this.eggGachaSummaryContainer);

    const gachaMessageBox = addWindow(0, 0, 320, 32).setOrigin(0);
    const gachaMessageBoxContainer = globalScene.add.container(0, 148).add(gachaMessageBox);

    this.eggGachaMessageBox = gachaMessageBox;

    const gachaMessageText = addTextObject(8, 8, "", TextStyle.WINDOW, {
      maxLines: 2,
    }).setOrigin(0);
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

    this.updateLegendaryGacha();

    this.updateVoucherCounts();

    this.getUi().bringToTop(this.eggGachaContainer);

    this.eggGachaContainer.setActive(true).setVisible(true);

    handleTutorial(Tutorial.Egg_Gacha);

    this.legendaryExpiration.setText(this.getLegendaryGachaTimeLeft());
    this.legendaryGachaTimer();

    return true;
  }

  getDelayValue(delay: number) {
    if (this.transitioning && this.transitionCancelled) {
      delay = Math.ceil(delay / 5);
    }
    return fixedInt(delay);
  }

  private firstDropAnims(): Phaser.Types.Tweens.TweenBuilderConfig[] {
    globalScene.playSound("se/gacha_dial");
    return [
      // Tween 1 animates the gacha knob turning left
      {
        targets: this.gachaKnobs[this.gachaCursor],
        duration: this.getDelayValue(350),
        angle: 90,
        ease: "Cubic.easeInOut",
      },
      // Tween 2 animates the gacha knob turning back
      {
        targets: this.gachaKnobs[this.gachaCursor],
        duration: this.getDelayValue(350),
        angle: 0,
        ease: "Sine.easeInOut",
      },
      // Tween 3 is a dummy tween, used to force a delay, that commences the gacha running sound
      {
        targets: { dummy: 0 },
        dummy: 1,
        duration: this.getDelayValue(350),
        onStart: () => {
          globalScene.playSound("se/gacha_running", { loop: true });
        },
      },
      // Tween 4 is another dummy tween that plays the gacha dispense sound
      {
        delay: this.getDelayValue(1250),
        onStart: () => {
          globalScene.playSound("se/gacha_dispense");
        },
        targets: { dummy: 0 },
        dummy: 1,
        duration: this.getDelayValue(750),
        onComplete: () => {
          globalScene.sound.stopByKey("se/gacha_running");
        },
      },
    ];
  }

  private async doPullAnim(egg: Phaser.GameObjects.Sprite, count: number): Promise<void> {
    let resolve: (value: void | PromiseLike<void>) => void;
    const hatch = this.gachaHatches[this.gachaCursor];

    /** The rate of animations and tweens that play for drops after the first */
    const rate = count ? 1.25 : 1.0;
    if (count) {
      hatch.anims.timeScale = rate;
    }
    const promise: Promise<void> = new Promise(res => {
      resolve = res;
    });

    const tweens: Phaser.Types.Tweens.TweenBuilderConfig[] = count ? [] : this.firstDropAnims();

    tweens.push(
      // Tween 1 is responsible for animating the egg dropping from the gacha
      {
        targets: egg,
        duration: this.getDelayValue(350 / rate),
        y: 95,
        ease: "Bounce.easeOut",
      },
      // Tween 2 plays the catch sound and moves the egg up a bit
      {
        onStart: () => {
          globalScene.playSound("se/pb_catch");
          this.gachaHatches[this.gachaCursor].play("open");
        },
        targets: egg,
        delay: this.getDelayValue(125 / rate),
        duration: this.getDelayValue(350 / rate),
        props: {
          scale: { value: 0.75, ease: "Sine.easeIn" },
          y: { value: 110, ease: "Back.easeOut" },
        },
      },
      // Tween 3 "closes" the gacha hatch and moves the egg up while enlarging it
      {
        onStart: () => {
          this.gachaHatches[this.gachaCursor].play("close");
        },
        targets: egg,
        y: 200,
        duration: this.getDelayValue(350 / rate),
        ease: "Cubic.easeIn",
      },
    );

    this.eggDropTweenChain = globalScene.tweens.chain({
      onComplete: () => {
        this.eggDropTweenChain = undefined;
        hatch.anims.timeScale = 1; // Reset the hatch animation time scale
        resolve();
      },
      tweens,
    });

    return promise;
  }

  /**
   * Pulls the specified number of eggs and returns them
   * @param pullCount - The number of eggs to pull
   * @returns An array of the pulled eggs
   */
  private pullEggs(pullCount: number): Egg[] {
    const eggs: Egg[] = [];
    for (let i = 1; i <= pullCount; i++) {
      const eggOptions: IEggOptions = {
        pulled: true,
        sourceType: this.gachaCursor,
      };

      // Before creating the last egg, check if the guaranteed egg tier was already generated
      // if not, override the egg tier
      if (i === pullCount) {
        const guaranteedEggTier = this.getGuaranteedEggTierFromPullCount(pullCount);
        if (guaranteedEggTier !== EggTier.COMMON && !eggs.some(egg => egg.tier >= guaranteedEggTier)) {
          eggOptions.tier = guaranteedEggTier;
        }
      }

      const egg = new Egg(eggOptions);
      eggs.push(egg);
    }
    // Shuffle the eggs in case the guaranteed one got added as last egg
    return randSeedShuffle(eggs);
  }

  /**
   * Handle pulling eggs from the gacha machine; plays the animations, adds the eggs, and saves game data
   * @param pullCount - The number of eggs to pull
   */
  async pull(pullCount = 0): Promise<void> {
    if (Overrides.EGG_GACHA_PULL_COUNT_OVERRIDE) {
      pullCount = Overrides.EGG_GACHA_PULL_COUNT_OVERRIDE;
    }

    // Set the eggs
    const eggs = this.pullEggs(pullCount);

    this.eggGachaOptionsContainer.setVisible(false);
    this.setTransitioning(true);

    const saveSuccess = await (globalScene.currentBattle
      ? globalScene.gameData.saveAll(true, true, true)
      : globalScene.gameData.saveSystem()
    ).then(success => {
      if (!success) {
        globalScene.reset(true);
        return false;
      }
      return true;
    });

    if (!saveSuccess) {
      return;
    }

    const gachaContainer = this.gachaContainers[this.gachaCursor];
    for (let i = 0; i < pullCount; ++i) {
      if (this.transitionCancelled) {
        break;
      }
      const eggSprite = globalScene.add.sprite(127, 75, "egg", `egg_${eggs[i].getKey()}`).setScale(0.5);
      gachaContainer.addAt(eggSprite, 2);
      // biome-ignore lint/performance/noAwaitInLoops: The point of this loop is to play the animations, one after another
      await this.doPullAnim(eggSprite, i).finally(() => gachaContainer.remove(eggSprite, true));
    }

    this.showSummary(eggs);
  }

  /**
   * Get the guaranteed egg tier based on the pull count
   * @param pullCount - The number of pulls made
   * @returns The guaranteed egg tier for the given pull count
   */
  private getGuaranteedEggTierFromPullCount(pullCount: number): EggTier {
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
        this.eggGachaSummaryContainer.setVisible(false).setAlpha(1).removeAll(true);
        this.setTransitioning(false);
        this.summaryFinished = false;
        this.eggGachaOptionsContainer.setVisible(true);
      },
    });
  }

  /**
   * Update the legendary gacha icon based on the current timestamp.
   */
  private updateLegendaryGacha(): void {
    const infoContainer = this.gachaInfoContainers[GachaType.LEGENDARY];
    const species = getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(Date.now()));
    const pokemonIcon = infoContainer.getAt(1) as Phaser.GameObjects.Sprite;
    pokemonIcon.setTexture(species.getIconAtlasKey(), species.getIconId(false));
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

  /**
   * Convert a cursor index to a voucher type and count
   * @param cursor - The cursor index corresponding to the voucher type
   * @returns The voucher type, vouchers used, and pulls given, or an empty array if the cursor is not on a voucher
   */
  private static cursorToVoucher(cursor: number): [VoucherType, number, number] | undefined {
    switch (cursor) {
      case 0:
        return [VoucherType.REGULAR, 1, 1];
      case 1:
        return [VoucherType.REGULAR, 10, 10];
      case 2:
        return [VoucherType.PLUS, 1, 5];
      case 3:
        return [VoucherType.PREMIUM, 1, 10];
      case 4:
        return [VoucherType.GOLDEN, 1, 25];
    }
  }

  /**
   * Process an action input received during voucher selection.
   *
   * @remarks
   *
   * Handles playing the error sound and showing the error message, but does not handle playing the success sound.
   *
   * @param cursor - The index of the voucher menu option
   * @returns True if the success sound should be played, false if the error sound should be played, or undefined if the cursor is out of range.
   */
  private handleVoucherSelectAction(cursor: number): boolean | undefined {
    // Cursors that are out of range should not be processed
    if (cursor < 0 || cursor > 5) {
      return;
    }
    const ui = this.getUi();
    const voucher = EggGachaUiHandler.cursorToVoucher(cursor);
    if (!voucher) {
      ui.revertMode();
      return true;
    }
    const [voucherType, vouchersConsumed, pulls] = voucher;

    let errorKey: string | undefined;
    const freePulls = Overrides.EGG_FREE_GACHA_PULLS_OVERRIDE;

    if (!freePulls && globalScene.gameData.eggs.length + pulls > 99) {
      errorKey = "egg:tooManyEggs";
    } else if (!freePulls && globalScene.gameData.voucherCounts[voucherType] < vouchersConsumed) {
      errorKey = "egg:notEnoughVouchers";
    }

    if (errorKey) {
      this.showError(i18next.t(errorKey));
      return false;
    }

    if (!freePulls) {
      this.consumeVouchers(voucherType, vouchersConsumed);
    }

    // TODO: Remove this dangling proimse if necessary when the UI's input event handling supports async functions
    void this.pull(pulls);
    return true;
  }

  /**
   * Process an input received while the egg gacha UI is transitioning
   *
   * @param button - The button that was pressed
   * @returns - `true` if the success sound should be played, otherwise `undefined`
   */
  private processTransitionInput(button: Button): true | undefined {
    if (!this.transitionCancelled && (button === Button.ACTION || button === Button.CANCEL)) {
      this.transitionCancelled = true;
      // When transition is cancelled, ensure the active chain playing the egg drop animation is sped up
      // We cannot cancel it, as this would leave sprite positions at their current position in the animation
      this.eggDropTweenChain?.setTimeScale(50);
      return true;
    }
  }

  /**
   * Process an input received in the normal mode of the egg gacha UI (not transitoning, not summary)
   * @param button - The button that was pressed
   * @returns `true` if the success sound should be played, `false` if the error sound should be played, or `undefined` no input event occurred.
   */
  private processNormalInput(button: Button): boolean | undefined {
    const ui = this.getUi();
    let success: boolean | undefined;
    switch (button) {
      case Button.ACTION:
        return this.handleVoucherSelectAction(this.cursor);
      case Button.CANCEL:
        ui.revertMode();
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
        if (this.gachaCursor < Object.keys(GachaType).length - 1) {
          success = this.setGachaCursor(this.gachaCursor + 1);
        }
        break;
    }

    // Return undefined here because we do not play error sound in case of failed directional movements
    return success || undefined;
  }

  /**
   * Handles an input event that occurs while the egg gacha summary is visible
   * @param button - The button that was pressed
   * @returns `true` if an input event occurred and the select sound should be played, otherwise `undefined`
   */
  private processSummaryInput(button: Button): true | undefined {
    if (this.summaryFinished && (button === Button.ACTION || button === Button.CANCEL)) {
      this.hideSummary();
      return true;
    }
  }

  /**
   *
   * @param button - The button that was pressed
   * @returns - Whether an input event occured.
   */
  processInput(button: Button): boolean {
    let success: boolean | undefined;
    if (this.transitioning) {
      success = this.processTransitionInput(button);
    } else if (this.eggGachaSummaryContainer.visible) {
      success = this.processSummaryInput(button);
    } else {
      success = this.processNormalInput(button);
    }

    if (success === undefined) {
      return false;
    }
    if (success) {
      this.getUi().playSelect();
    } else {
      this.getUi().playError();
    }
    return true;
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

  legendaryGachaTimer(): void {
    if (this.playTimeTimer) {
      this.playTimeTimer.destroy();
      this.playTimeTimer = null;
    }
    this.playTimeTimer = globalScene.time.addEvent({
      loop: true,
      delay: fixedInt(1000),
      callback: () => {
        this.legendaryExpiration.setText(this.getLegendaryGachaTimeLeft());
      },
    });
  }

  getLegendaryGachaTimeLeft(): string {
    // 86400000 is the number of miliseconds in one day
    const msUntilMidnight = 86400000 - (Date.now() % 86400000);
    const hours = `${Math.floor(msUntilMidnight / 3600000)}`;
    const minutes = `${Math.floor((msUntilMidnight % 3600000) / 60000)}`;
    const seconds = `${Math.floor((msUntilMidnight % 60000) / 1000)}`;

    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
  }

  clear(): void {
    super.clear();
    this.setGachaCursor(-1);
    this.eggGachaContainer.setVisible(false);
    if (this.playTimeTimer) {
      this.playTimeTimer.destroy();
      this.playTimeTimer = null;
    }
    this.eggGachaContainer.setActive(false);
  }
}
