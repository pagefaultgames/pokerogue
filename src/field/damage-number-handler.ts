import { TextStyle, addTextObject } from "../ui/text";
import type { DamageResult } from "./pokemon";
import type Pokemon from "./pokemon";
import { HitResult } from "./pokemon";
import { formatStat, fixedInt } from "#app/utils/common";
import type { BattlerIndex } from "../battle";
import { globalScene } from "#app/global-scene";

type TextAndShadowArr = [string | null, string | null];

export default class DamageNumberHandler {
  private damageNumbers: Map<BattlerIndex, Phaser.GameObjects.Text[]>;

  constructor() {
    this.damageNumbers = new Map();
  }

  add(
    target: Pokemon,
    amount: number,
    result: DamageResult | HitResult.HEAL = HitResult.EFFECTIVE,
    critical = false,
  ): void {
    if (!globalScene?.damageNumbersMode) {
      return;
    }

    const battlerIndex = target.getBattlerIndex();
    const baseScale = target.getSpriteScale() / 6;
    const damageNumber = addTextObject(
      target.x,
      -(globalScene.game.canvas.height / 6) + target.y - target.getSprite().height / 2,
      formatStat(amount, true),
      TextStyle.SUMMARY,
    );
    damageNumber.setName("text-damage-number");
    damageNumber.setOrigin(0.5, 1);
    damageNumber.setScale(baseScale);

    let [textColor, shadowColor]: TextAndShadowArr = [null, null];

    switch (result) {
      case HitResult.SUPER_EFFECTIVE:
        [textColor, shadowColor] = ["#f8d030", "#b8a038"];
        break;
      case HitResult.NOT_VERY_EFFECTIVE:
        [textColor, shadowColor] = ["#f08030", "#c03028"];
        break;
      case HitResult.INDIRECT_KO:
      case HitResult.ONE_HIT_KO:
        [textColor, shadowColor] = ["#a040a0", "#483850"];
        break;
      case HitResult.HEAL:
        [textColor, shadowColor] = ["#78c850", "#588040"];
        break;
      default:
        [textColor, shadowColor] = ["#ffffff", "#636363"];
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

    globalScene.fieldUI.add(damageNumber);

    if (!this.damageNumbers.has(battlerIndex)) {
      this.damageNumbers.set(battlerIndex, []);
    }

    const yOffset = this.damageNumbers.get(battlerIndex)!.length * -10;
    if (yOffset) {
      damageNumber.y += yOffset;
    }

    this.damageNumbers.get(battlerIndex)!.push(damageNumber);

    if (globalScene.damageNumbersMode === 1) {
      globalScene.tweens.add({
        targets: damageNumber,
        duration: fixedInt(750),
        alpha: 1,
        y: "-=32",
      });
      globalScene.tweens.add({
        delay: 375,
        targets: damageNumber,
        duration: fixedInt(625),
        alpha: 0,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.damageNumbers.get(battlerIndex)!.splice(this.damageNumbers.get(battlerIndex)!.indexOf(damageNumber), 1);
          damageNumber.destroy(true);
        },
      });
      return;
    }

    damageNumber.setAlpha(0);

    globalScene.tweens.chain({
      targets: damageNumber,
      tweens: [
        {
          duration: fixedInt(250),
          alpha: 1,
          scaleX: 0.75 * baseScale,
          scaleY: 1.25 * baseScale,
          y: "-=16",
          ease: "Cubic.easeOut",
        },
        {
          duration: fixedInt(175),
          alpha: 1,
          scaleX: 0.875 * baseScale,
          scaleY: 1.125 * baseScale,
          y: "+=16",
          ease: "Cubic.easeIn",
        },
        {
          duration: fixedInt(100),
          scaleX: 1.25 * baseScale,
          scaleY: 0.75 * baseScale,
          ease: "Cubic.easeOut",
        },
        {
          duration: fixedInt(175),
          scaleX: 0.875 * baseScale,
          scaleY: 1.125 * baseScale,
          y: "-=8",
          ease: "Cubic.easeOut",
        },
        {
          duration: fixedInt(50),
          scaleX: 0.925 * baseScale,
          scaleY: 1.075 * baseScale,
          y: "+=8",
          ease: "Cubic.easeIn",
        },
        {
          duration: fixedInt(100),
          scaleX: 1.125 * baseScale,
          scaleY: 0.875 * baseScale,
          ease: "Cubic.easeOut",
        },
        {
          duration: fixedInt(175),
          scaleX: 0.925 * baseScale,
          scaleY: 1.075 * baseScale,
          y: "-=4",
          ease: "Cubic.easeOut",
        },
        {
          duration: fixedInt(50),
          scaleX: 0.975 * baseScale,
          scaleY: 1.025 * baseScale,
          y: "+=4",
          ease: "Cubic.easeIn",
        },
        {
          duration: fixedInt(100),
          scaleX: 1.075 * baseScale,
          scaleY: 0.925 * baseScale,
          ease: "Cubic.easeOut",
        },
        {
          duration: fixedInt(25),
          scaleX: baseScale,
          scaleY: baseScale,
          ease: "Cubic.easeOut",
        },
        {
          delay: fixedInt(500),
          alpha: 0,
          onComplete: () => {
            this.damageNumbers
              .get(battlerIndex)!
              .splice(this.damageNumbers.get(battlerIndex)!.indexOf(damageNumber), 1);
            damageNumber.destroy(true);
          },
        },
      ],
    });
  }
}
