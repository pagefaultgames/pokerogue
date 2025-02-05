import { globalScene } from "#app/global-scene";
import { TextStyle, addTextObject } from "./text";
import i18next from "i18next";

const hiddenX = -118;
const shownX = 0;
const baseY = -116;

export default class AbilityBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private abilityBarText: Phaser.GameObjects.Text;

  public shown: boolean;

  constructor() {
    super(globalScene, hiddenX, baseY);
  }

  setup(): void {
    this.bg = globalScene.add.image(0, 0, "ability_bar_left");
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.abilityBarText = addTextObject(15, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.abilityBarText.setOrigin(0, 0);
    this.abilityBarText.setWordWrapWidth(600, true);
    this.add(this.abilityBarText);

    this.setVisible(false);
    this.shown = false;
  }

  override setVisible(shown: boolean): this {
    this.shown = shown;
    super.setVisible(shown);
    return this;
  }

  startTween(config: any, text?: string): Promise<void> {
    this.setVisible(true);
    if (text) {
      this.abilityBarText.setText(text);
    }
    return new Promise((resolve) => {
      globalScene.tweens.add({
        ...config,
        onComplete: () => {
          if (config.onComplete) {
            config.onComplete();
          }
          resolve();
        }
      });
    });
  }

  showAbility(pokemonName: string, abilityName: string, passive: boolean = false): Promise<void> {
    const text = (`${i18next.t("fightUiHandler:abilityFlyInText", { pokemonName: pokemonName, passive: passive ? i18next.t("fightUiHandler:passive") : "", abilityName: abilityName })}`);

    globalScene.fieldUI.bringToTop(this);

    this.y = baseY + (globalScene.currentBattle.double ? 14 : 0);
    return this.startTween({
      targets: this,
      x: shownX,
      duration: 500,
      ease: "Sine.easeOut",
      hold: 1000,
    }, text);
  }

  hide(): Promise<void> {
    return this.startTween({
      targets: this,
      x: -91,
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.setVisible(false);
      }
    });
  }
}
