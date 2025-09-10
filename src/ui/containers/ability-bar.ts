import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

const barWidth = 118;
const screenLeft = 0;
const baseY = -116;

export class AbilityBar extends Phaser.GameObjects.Container {
  private abilityBars: Phaser.GameObjects.Image[];
  private abilityBarText: Phaser.GameObjects.Text;
  private player: boolean;
  private screenRight: number; // hold screenRight in case size changes between show and hide
  private shown: boolean;

  constructor() {
    super(globalScene, barWidth, baseY);
    this.abilityBars = [];
    this.player = true;
    this.shown = false;
  }

  setup(): void {
    for (const key of ["ability_bar_right", "ability_bar_left"]) {
      const bar = globalScene.add.image(0, 0, key);
      bar.setOrigin(0, 0);
      bar.setVisible(false);
      this.add(bar);
      this.abilityBars.push(bar);
    }

    this.abilityBarText = addTextObject(15, 3, "", TextStyle.MESSAGE, {
      fontSize: "72px",
    });
    this.abilityBarText.setOrigin(0, 0);
    this.abilityBarText.setWordWrapWidth(600, true);
    this.add(this.abilityBarText);
    this.bringToTop(this.abilityBarText);

    this.setVisible(false);
    this.setX(-barWidth); // start hidden (right edge of bar at x=0)
  }

  public override setVisible(value: boolean): this {
    this.abilityBars[+this.player].setVisible(value);
    this.shown = value;
    return this;
  }

  public async startTween(config: any, text?: string): Promise<void> {
    this.setVisible(true);
    if (text) {
      this.abilityBarText.setText(text);
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
      this.setX(player ? -barWidth : this.screenRight);
      this.player = player;
    }
    globalScene.fieldUI.bringToTop(this);

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
        x: this.player ? screenLeft : this.screenRight - barWidth,
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
      x: this.player ? -barWidth : this.screenRight,
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
