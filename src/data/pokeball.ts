import { CriticalCatchChanceBoosterModifier } from "#app/modifier/modifier";
import { NumberHolder } from "#app/utils";
import { PokeballType } from "#enums/pokeball";
import BattleScene from "../battle-scene";
import i18next from "i18next";

export const MAX_PER_TYPE_POKEBALLS: integer = 99;

export function getPokeballAtlasKey(type: PokeballType): string {
  switch (type) {
    case PokeballType.POKEBALL:
      return "pb";
    case PokeballType.GREAT_BALL:
      return "gb";
    case PokeballType.ULTRA_BALL:
      return "ub";
    case PokeballType.ROGUE_BALL:
      return "rb";
    case PokeballType.MASTER_BALL:
      return "mb";
    case PokeballType.LUXURY_BALL:
      return "lb";
  }
}

export function getPokeballName(type: PokeballType): string {
  let ret: string;
  switch (type) {
    case PokeballType.POKEBALL:
      ret = i18next.t("pokeball:pokeBall");
      break;
    case PokeballType.GREAT_BALL:
      ret = i18next.t("pokeball:greatBall");
      break;
    case PokeballType.ULTRA_BALL:
      ret = i18next.t("pokeball:ultraBall");
      break;
    case PokeballType.ROGUE_BALL:
      ret = i18next.t("pokeball:rogueBall");
      break;
    case PokeballType.MASTER_BALL:
      ret = i18next.t("pokeball:masterBall");
      break;
    case PokeballType.LUXURY_BALL:
      ret = i18next.t("pokeball:luxuryBall");
      break;
  }
  return ret;
}

export function getPokeballCatchMultiplier(type: PokeballType): number {
  switch (type) {
    case PokeballType.POKEBALL:
      return 1;
    case PokeballType.GREAT_BALL:
      return 1.5;
    case PokeballType.ULTRA_BALL:
      return 2;
    case PokeballType.ROGUE_BALL:
      return 3;
    case PokeballType.MASTER_BALL:
      return -1;
    case PokeballType.LUXURY_BALL:
      return 1;
  }
}

export function getPokeballTintColor(type: PokeballType): number {
  switch (type) {
    case PokeballType.POKEBALL:
      return 0xd52929;
    case PokeballType.GREAT_BALL:
      return 0x94b4de;
    case PokeballType.ULTRA_BALL:
      return 0xe6cd31;
    case PokeballType.ROGUE_BALL:
      return 0xd52929;
    case PokeballType.MASTER_BALL:
      return 0xa441bd;
    case PokeballType.LUXURY_BALL:
      return 0xffde6a;
  }
}

/**
 * Gets the critical capture chance based on number of mons registered in Dex and modified {@link https://bulbapedia.bulbagarden.net/wiki/Catch_rate Catch rate}
 * Formula from {@link https://www.dragonflycave.com/mechanics/gen-vi-vii-capturing Dragonfly Cave Gen 6 Capture Mechanics page}
 * @param scene {@linkcode BattleScene} current BattleScene
 * @param modifiedCatchRate the modified catch rate as calculated in {@linkcode AttemptCapturePhase}
 * @returns the chance of getting a critical capture, out of 256
 */
export function getCriticalCaptureChance(scene: BattleScene, modifiedCatchRate: number): number {
  if (scene.gameMode.isFreshStartChallenge()) {
    return 0;
  }
  const dexCount = scene.gameData.getSpeciesCount(d => !!d.caughtAttr);
  const catchingCharmMultiplier = new NumberHolder(1);
  scene.findModifier(m => m instanceof CriticalCatchChanceBoosterModifier)?.apply(catchingCharmMultiplier);
  const dexMultiplier = scene.gameMode.isDaily || dexCount > 800 ? 2.5
    : dexCount > 600 ? 2
      : dexCount > 400 ? 1.5
        : dexCount > 200 ? 1
          : dexCount > 100 ? 0.5
            : 0;
  return Math.floor(catchingCharmMultiplier.value * dexMultiplier * Math.min(255, modifiedCatchRate) / 6);
}

export function doPokeballBounceAnim(scene: BattleScene, pokeball: Phaser.GameObjects.Sprite, y1: number, y2: number, baseBounceDuration: number, callback: Function, isCritical: boolean = false) {
  let bouncePower = 1;
  let bounceYOffset = y1;
  let bounceY = y2;
  const yd = y2 - y1;
  const x0 = pokeball.x;
  const x1 = x0 + 3;
  const x2 = x0 - 3;
  let critShakes = 4;

  const doBounce = () => {
    scene.tweens.add({
      targets: pokeball,
      y: y2,
      duration: bouncePower * baseBounceDuration,
      ease: "Cubic.easeIn",
      onComplete: () => {
        scene.playSound("se/pb_bounce_1", { volume: bouncePower });

        bouncePower = bouncePower > 0.01 ? bouncePower * 0.5 : 0;

        if (bouncePower) {
          bounceYOffset = yd * bouncePower;
          bounceY = y2 - bounceYOffset;

          scene.tweens.add({
            targets: pokeball,
            y: bounceY,
            duration: bouncePower * baseBounceDuration,
            ease: "Cubic.easeOut",
            onComplete: () => doBounce()
          });
        } else if (callback) {
          callback();
        }
      }
    });
  };

  const doCritShake = () => {
    scene.tweens.add({
      targets: pokeball,
      x: x2,
      duration: 125,
      ease: "Linear",
      onComplete: () => {
        scene.tweens.add({
          targets: pokeball,
          x: x1,
          duration: 125,
          ease: "Linear",
          onComplete: () => {
            critShakes--;
            if (critShakes > 0) {
              doCritShake();
            } else {
              scene.tweens.add({
                targets: pokeball,
                x: x0,
                duration: 60,
                ease: "Linear",
                onComplete: () => scene.time.delayedCall(500, doBounce)
              });
            }
          }
        });
      }
    });
  };

  if (isCritical) {
    scene.time.delayedCall(500, doCritShake);
  } else {
    doBounce();
  }
}
