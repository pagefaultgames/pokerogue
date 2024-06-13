import BattleScene from "../battle-scene";
import Pokemon from "../field/pokemon";
import { TextStyle, addTextObject } from "./text";
import i18next from "i18next";

const hiddenX = -118;
const shownX = 0;
const baseY = -116;

export default class AbilityBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private abilityBarText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;
  private autoHideTimer: NodeJS.Timeout;

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, hiddenX, baseY);
  }

  setup(): void {
    this.bg = this.scene.add.image(0, 0, "ability_bar_left");
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.abilityBarText = addTextObject(this.scene, 15, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.abilityBarText.setOrigin(0, 0);
    this.abilityBarText.setWordWrapWidth(600, true);
    this.add(this.abilityBarText);

    this.setVisible(false);
    this.shown = false;
  }

  showAbility(pokemon: Pokemon, passive: boolean = false): void {
    this.abilityBarText.setText(`${i18next.t("fightUiHandler:abilityFlyInText", { pokemonName: pokemon.name, passive: passive ? i18next.t("fightUiHandler:passive") : "", abilityName: !passive ?  pokemon.getAbility().name : pokemon.getPassiveAbility().name })}`);

    if (this.shown) {
      return;
    }

    (this.scene as BattleScene).fieldUI.bringToTop(this);

    if (this.tween) {
      this.tween.stop();
    }

    this.y = baseY + ((this.scene as BattleScene).currentBattle.double ? 14 : 0);
    this.tween = this.scene.tweens.add({
      targets: this,
      x: shownX,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tween = null;
        this.resetAutoHideTimer();
      }
    });

    this.setVisible(true);
    this.shown = true;
  }

  hide(): void {
    if (!this.shown) {
      return;
    }

    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }

    if (this.tween) {
      this.tween.stop();
    }

    this.tween = this.scene.tweens.add({
      targets: this,
      x: -91,
      duration: 500,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.tween = null;
        this.setVisible(false);
      }
    });

    this.shown = false;
  }

  resetAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }
    this.autoHideTimer = setTimeout(() => {
      this.hide();
      this.autoHideTimer = null;
    }, 2500);
  }
}
