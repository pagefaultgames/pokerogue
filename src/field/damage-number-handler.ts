import { TextStyle, addTextObject } from "../ui/text";
import Pokemon, { DamageResult, HitResult } from "./pokemon";
import * as Utils from "../utils";
import { BattlerIndex } from "../battle";

export default class DamageNumberHandler {
  private damageNumbers: Map<BattlerIndex, Phaser.GameObjects.Text[]>;

  constructor() {
    this.damageNumbers = new Map();
  }

  add(target: Pokemon, amount: integer, result: DamageResult | HitResult.HEAL = HitResult.EFFECTIVE, critical: boolean = false): void {
    const scene = target.scene;

    if (!scene?.damageNumbersMode) {
      return;
    }

    const battlerIndex = target.getBattlerIndex();
    const baseScale = target.getSpriteScale() / 6;
    const damageNumber = addTextObject(scene, target.x, -(scene.game.canvas.height / 6) + target.y - target.getSprite().height / 2, Utils.formatStat(amount, true), TextStyle.SUMMARY);
    damageNumber.setOrigin(0.5, 1);
    damageNumber.setScale(baseScale);

    let [ textColor, shadowColor ] = [ null, null ];

    switch (result) {
    case HitResult.SUPER_EFFECTIVE:
      [ textColor, shadowColor ] = [ "#f8d030", "#b8a038" ];
      break;
    case HitResult.NOT_VERY_EFFECTIVE:
      [ textColor, shadowColor ] = [ "#f08030", "#c03028" ];
      break;
    case HitResult.ONE_HIT_KO:
      [ textColor, shadowColor ] = [ "#a040a0", "#483850" ];
      break;
    case HitResult.HEAL:
      [ textColor, shadowColor ] = [ "#78c850", "#588040" ];
      break;
    default:
      [ textColor, shadowColor ] = [ "#ffffff", "#636363" ];
      break;
    }

    if (textColor) {
      damageNumber.setColor(textColor);
    }
    if (shadowColor) {
      if (critical) {
        damageNumber.setShadowOffset(0, 0);
        damageNumber.setStroke(shadowColor, 12);
      } else {
        damageNumber.setShadowColor(shadowColor);
      }
    }

    scene.fieldUI.add(damageNumber);

    if (!this.damageNumbers.has(battlerIndex)) {
      this.damageNumbers.set(battlerIndex, []);
    }

    const yOffset = this.damageNumbers.get(battlerIndex).length * -10;
    if (yOffset) {
      damageNumber.y += yOffset;
    }

    this.damageNumbers.get(battlerIndex).push(damageNumber);

    if (scene.damageNumbersMode === 1) {
      scene.tweens.add({
        targets: damageNumber,
        duration: Utils.fixedInt(750),
        alpha: 1,
        y: "-=32"
      });
      scene.tweens.add({
        delay: 375,
        targets: damageNumber,
        duration: Utils.fixedInt(625),
        alpha: 0,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.damageNumbers.get(battlerIndex).splice(this.damageNumbers.get(battlerIndex).indexOf(damageNumber), 1);
          damageNumber.destroy(true);
        }
      });
      return;
    }

    damageNumber.setAlpha(0);

    scene.tweens.chain({
      targets: damageNumber,
      tweens: [
        {
          duration: Utils.fixedInt(250),
          alpha: 1,
          scaleX: 0.75 * baseScale,
          scaleY: 1.25 * baseScale,
          y: "-=16",
          ease: "Cubic.easeOut"
        },
        {
          duration: Utils.fixedInt(175),
          alpha: 1,
          scaleX: 0.875 * baseScale,
          scaleY: 1.125 * baseScale,
          y: "+=16",
          ease: "Cubic.easeIn"
        },
        {
          duration: Utils.fixedInt(100),
          scaleX: 1.25 * baseScale,
          scaleY: 0.75 * baseScale,
          ease: "Cubic.easeOut"
        },
        {
          duration: Utils.fixedInt(175),
          scaleX: 0.875 * baseScale,
          scaleY: 1.125 * baseScale,
          y: "-=8",
          ease: "Cubic.easeOut"
        },
        {
          duration: Utils.fixedInt(50),
          scaleX: 0.925 * baseScale,
          scaleY: 1.075 * baseScale,
          y: "+=8",
          ease: "Cubic.easeIn"
        },
        {
          duration: Utils.fixedInt(100),
          scaleX: 1.125 * baseScale,
          scaleY: 0.875 * baseScale,
          ease: "Cubic.easeOut"
        },
        {
          duration: Utils.fixedInt(175),
          scaleX: 0.925 * baseScale,
          scaleY: 1.075 * baseScale,
          y: "-=4",
          ease: "Cubic.easeOut"
        },
        {
          duration: Utils.fixedInt(50),
          scaleX: 0.975 * baseScale,
          scaleY: 1.025 * baseScale,
          y: "+=4",
          ease: "Cubic.easeIn"
        },
        {
          duration: Utils.fixedInt(100),
          scaleX: 1.075 * baseScale,
          scaleY: 0.925 * baseScale,
          ease: "Cubic.easeOut"
        },
        {
          duration: Utils.fixedInt(25),
          scaleX: baseScale,
          scaleY: baseScale,
          ease: "Cubic.easeOut"
        },
        {
          delay: Utils.fixedInt(500),
          alpha: 0,
          onComplete: () => {
            this.damageNumbers.get(battlerIndex).splice(this.damageNumbers.get(battlerIndex).indexOf(damageNumber), 1);
            damageNumber.destroy(true);
          }
        }
      ]
    });
  }
}
