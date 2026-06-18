import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import type { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { addTextObject } from "#ui/text";
import { argbFromRgba, rgbHexToRgba } from "#utils/color-utils";

export class CandyBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private candyIcon: Phaser.GameObjects.Sprite;
  private candyOverlayIcon: Phaser.GameObjects.Sprite;
  private countText: Phaser.GameObjects.Text;
  private speciesId: SpeciesId;

  private tween: Phaser.Tweens.Tween | null;
  private autoHideTimer: NodeJS.Timeout | null;
  private isHiding: boolean;
  private pendingCandyAdditions: { speciesId: SpeciesId; numCandiesAdded: number }[];
  private cumulativeCandiesAdded: number;

  public shown: boolean;

  constructor() {
    super(globalScene, globalScene.scaledCanvas.width, -globalScene.scaledCanvas.height + 15);
  }

  setup(): this {
    this.bg = globalScene.add //
      .nineslice(0, 0, "party_exp_bar", undefined, 8, 18, 21, 5, 6, 4)
      .setOrigin(0, 0);

    this.candyIcon = globalScene.add //
      .sprite(14, 0, "items", "candy")
      .setOrigin(0.5, 0)
      .setScale(0.5);

    this.candyOverlayIcon = globalScene.add //
      .sprite(14, 0, "items", "candy_overlay")
      .setOrigin(0.5, 0)
      .setScale(0.5);

    this.countText = addTextObject(22, 4, "", TextStyle.BATTLE_INFO) //
      .setOrigin(0);

    this.add([this.bg, this.candyIcon, this.candyOverlayIcon, this.countText]) //
      .setVisible(false);
    this.shown = false;
    this.isHiding = false;
    this.pendingCandyAdditions = [];
    this.cumulativeCandiesAdded = 0;
    return this;
  }

  /**
   * Slide in the candy bar to display the candy count for the given starter species.
   * @remarks
   * - If the bar is already showing for the same species, the count is updated in place.
   * - If the bar is showing for a different species, the request is queued.
   * @param starterSpeciesId - The {@linkcode SpeciesId} of the starter to display
   * @param numCandiesAdded - The number of candies just to the starter1
   */
  showStarterSpeciesCandy(starterSpeciesId: SpeciesId, numCandiesAdded: number): void {
    if (this.shown) {
      if (!this.isHiding && this.speciesId === starterSpeciesId) {
        this.cumulativeCandiesAdded += numCandiesAdded;
        this.countText.setText(
          `${globalScene.gameData.starterData[starterSpeciesId].candyCount} (+${this.cumulativeCandiesAdded.toString()})`,
        );
        this.bg.width = this.countText.displayWidth + 28;
        this.resetAutoHideTimer();
        return;
      }

      const speciesAlreadyPending = this.pendingCandyAdditions.find(p => p.speciesId === starterSpeciesId);
      if (speciesAlreadyPending) {
        speciesAlreadyPending.numCandiesAdded += numCandiesAdded;
      } else {
        this.pendingCandyAdditions.push({ speciesId: starterSpeciesId, numCandiesAdded });
      }

      if (this.autoHideTimer) {
        this.resetAutoHideTimer();
      }
      return;
    }

    const colorScheme = starterColors[starterSpeciesId];

    this.candyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
    this.candyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));

    this.cumulativeCandiesAdded = numCandiesAdded;
    this.countText.setText(
      `${globalScene.gameData.starterData[starterSpeciesId].candyCount} (+${this.cumulativeCandiesAdded.toString()})`,
    );

    this.bg.width = this.countText.displayWidth + 28;

    globalScene.fieldUI.bringToTop(this);

    if (this.tween) {
      this.tween.stop();
    }

    audioManager.playSound("se/shing");

    this.tween = globalScene.tweens.add({
      targets: this,
      x: globalScene.scaledCanvas.width - (this.bg.width - 5),
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tween = null;
        this.resetAutoHideTimer();
      },
    });

    this.setVisible(true);
    this.shown = true;
    this.speciesId = starterSpeciesId;
  }

  /**
   * Slide the candy bar off-screen. Resolves once the hide tween has finished and queues the next candy bar if pending.
   */
  hide(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.shown || this.isHiding) {
        return resolve();
      }

      this.isHiding = true;

      if (this.autoHideTimer) {
        clearInterval(this.autoHideTimer);
        this.autoHideTimer = null;
      }

      if (this.tween) {
        this.tween.stop();
      }

      this.tween = globalScene.tweens.add({
        targets: this,
        x: globalScene.scaledCanvas.width,
        duration: 500,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.tween = null;
          this.shown = false;
          this.isHiding = false;
          this.setVisible(false);
          resolve();
          const nextCandyAddition = this.pendingCandyAdditions.shift();
          if (nextCandyAddition) {
            this.showStarterSpeciesCandy(nextCandyAddition.speciesId, nextCandyAddition.numCandiesAdded);
          }
        },
      });
    });
  }

  /**
   * (Re)schedule the auto-hide that fires after the bar has been visible.
   * @remarks
   * The wait is compressed to 500ms while {@linkcode pendingCandyAdditions} is not empty.
   */
  resetAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }
    const delay = this.pendingCandyAdditions.length > 0 ? 500 : 2500;
    this.autoHideTimer = setTimeout(() => {
      this.hide();
      this.autoHideTimer = null;
    }, delay);
  }
}
