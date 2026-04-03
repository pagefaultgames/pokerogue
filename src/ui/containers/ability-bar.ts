import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiTheme } from "#enums/ui-theme";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

const defaultBarWidth = 118;
const defaultBarHeight = 31;
const screenLeft = 0;
const baseY = -116;
const textPadding = 15;
const legacyUiPlayerTextPadding = 17;
const legacyUiEnemyTextPadding = 5;

export class AbilityBar extends Phaser.GameObjects.Container {
  private readonly abilityBars: (Phaser.GameObjects.Image | Phaser.GameObjects.NineSlice)[];
  private abilityBarText: Phaser.GameObjects.Text;
  private legacyUiPokemonText: Phaser.GameObjects.Text;
  private legacyUiAbilityText: Phaser.GameObjects.Text;
  private readonly isLegacyUi: boolean;
  private player: boolean;
  private screenRight: number; // hold screenRight in case size changes between show and hide
  private shown: boolean;
  private currentBarWidth: number;

  constructor() {
    super(globalScene, defaultBarWidth, baseY);
    this.abilityBars = [];
    this.player = true;
    this.shown = false;
    this.isLegacyUi = globalScene.uiTheme === UiTheme.LEGACY;
    this.currentBarWidth = defaultBarWidth;
  }

  setup(): this {
    if (this.isLegacyUi) {
      for (const key of ["ability_bar_right", "ability_bar_left"]) {
        const bar = globalScene.add
          .nineslice(0, 0, key, undefined, defaultBarWidth, defaultBarHeight, 4, 4, 4, 4)
          .setOrigin(0)
          .setVisible(false);
        this.add(bar);
        this.abilityBars.push(bar);
      }

      this.legacyUiPokemonText = addTextObject(textPadding + 2, 3, "", TextStyle.MESSAGE, { fontSize: "72px" }) //
        .setOrigin(0);

      this.legacyUiAbilityText = addTextObject(textPadding + 2, 16, "", TextStyle.MESSAGE, { fontSize: "72px" }) //
        .setOrigin(0);

      this.legacyUiAbilityText.setColor("#484848");
      this.legacyUiAbilityText.setShadowColor("#d0d0c8");

      this.add(this.legacyUiPokemonText).bringToTop(this.legacyUiPokemonText);
      this.add(this.legacyUiAbilityText).bringToTop(this.legacyUiAbilityText);
    } else {
      for (const key of ["ability_bar_right", "ability_bar_left"]) {
        const bar = globalScene.add //
          .image(0, 0, key)
          .setOrigin(0)
          .setVisible(false);
        this.add(bar);
        this.abilityBars.push(bar);
      }

      this.abilityBarText = addTextObject(textPadding, 3, "", TextStyle.MESSAGE, {
        fontSize: "72px",
      })
        .setOrigin(0)
        .setWordWrapWidth(600, true);

      this.add(this.abilityBarText) //
        .bringToTop(this.abilityBarText);
    }

    this.setVisible(false) //
      .setX(-defaultBarWidth); // start hidden (right edge of bar at x=0)

    return this;
  }

  public override setVisible(value: boolean): this {
    this.abilityBars[+this.player].setVisible(value);
    this.shown = value;
    return this;
  }

  private updateBarWidth(): void {
    if (!this.isLegacyUi) {
      return;
    }
    this.currentBarWidth =
      Math.max(this.legacyUiPokemonText.displayWidth, this.legacyUiAbilityText.displayWidth) + textPadding * 2;
    this.abilityBars[+this.player].setSize(this.currentBarWidth, defaultBarHeight);
  }

  public async startTween(config: any, text?: string): Promise<void> {
    this.setVisible(true);
    if (text) {
      if (this.isLegacyUi) {
        const lines = text.split("\n");
        this.legacyUiPokemonText.setText(lines[0]?.trimStart());
        this.legacyUiAbilityText.setText(lines[1]?.trimStart());
        this.updateBarWidth();
        config.x = this.player ? screenLeft : this.screenRight - this.currentBarWidth;
      } else {
        this.abilityBarText.setText(text);
      }
    }
    return new Promise(resolve => {
      globalScene.tweens.add({
        ...config,
        onComplete: () => {
          if (config.onComplete) {
            config.onComplete();
          }
          resolve();
        },
      });
    });
  }

  public async showAbility(pokemonName: string, abilityName: string, passive = false, player = true): Promise<void> {
    const text = `${i18next.t("fightUiHandler:abilityFlyInText", { pokemonName, passive: passive ? i18next.t("fightUiHandler:passive") : "", abilityName })}`;
    this.screenRight = globalScene.scaledCanvas.width;
    if (player !== this.player) {
      // Move the bar if it has changed from the player to enemy side (or vice versa)
      this.setX(player ? -this.currentBarWidth : this.screenRight);
      this.player = player;
    }
    globalScene.fieldUI.bringToTop(this);

    if (this.isLegacyUi) {
      // Handle the empty space being on opposite sides for left and right ability bar images
      const textX = this.player ? legacyUiPlayerTextPadding : legacyUiEnemyTextPadding;
      this.legacyUiPokemonText.setX(textX);
      this.legacyUiAbilityText.setX(textX);
    }

    let y = baseY;
    if (this.player) {
      y += globalScene.currentBattle.double ? 14 : 0;
    } else {
      y -= globalScene.currentBattle.double ? 28 : 14;
    }

    this.setY(y);

    return this.startTween(
      {
        targets: this,
        x: this.player ? screenLeft : this.screenRight - this.currentBarWidth,
        duration: 500,
        ease: "Sine.easeOut",
        hold: 1000,
      },
      text,
    );
  }

  public async hide(): Promise<void> {
    return this.startTween({
      targets: this,
      x: this.player ? -this.currentBarWidth : this.screenRight,
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  public isVisible(): boolean {
    return this.shown;
  }
}
