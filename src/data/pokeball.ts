import { globalScene } from "#app/global-scene";
import { PokeballType } from "#enums/pokeball";
import { NumberHolder } from "#utils/common";
import i18next from "i18next";

export const MAX_PER_TYPE_POKEBALLS: number = 99;

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
 * @param modifiedCatchRate the modified catch rate as calculated in {@linkcode AttemptCapturePhase}
 * @returns the chance of getting a critical capture, out of 256
 */
export function getCriticalCaptureChance(modifiedCatchRate: number): number {
  if (globalScene.gameMode.isFreshStartChallenge()) {
    return 0;
  }
  const dexCount = globalScene.gameData.getSpeciesCount(d => !!d.caughtAttr);
  const catchingCharmMultiplier = new NumberHolder(1);
  globalScene.findModifier(m => m.is("CriticalCatchChanceBoosterModifier"))?.apply(catchingCharmMultiplier);
  const dexMultiplier =
    globalScene.gameMode.isDaily || dexCount > 800
      ? 2.5
      : dexCount > 600
        ? 2
        : dexCount > 400
          ? 1.5
          : dexCount > 200
            ? 1
            : dexCount > 100
              ? 0.5
              : 0;
  return Math.floor((catchingCharmMultiplier.value * dexMultiplier * Math.min(255, modifiedCatchRate)) / 6);
}

// TODO: fix Function annotations
export function doPokeballBounceAnim(
  pokeball: Phaser.GameObjects.Sprite,
  y1: number,
  y2: number,
  baseBounceDuration: number,
  // biome-ignore lint/complexity/noBannedTypes: TODO
  callback: Function,
  isCritical = false,
) {
  let bouncePower = 1;
  let bounceYOffset = y1;
  let bounceY = y2;
  const yd = y2 - y1;
  const x0 = pokeball.x;
  const x1 = x0 + 3;
  const x2 = x0 - 3;
  let critShakes = 4;

  const doBounce = () => {
    globalScene.tweens.add({
      targets: pokeball,
      y: y2,
      duration: bouncePower * baseBounceDuration,
      ease: "Cubic.easeIn",
      onComplete: () => {
        globalScene.playSound("se/pb_bounce_1", { volume: bouncePower });

        bouncePower = bouncePower > 0.01 ? bouncePower * 0.5 : 0;

        if (bouncePower) {
          bounceYOffset = yd * bouncePower;
          bounceY = y2 - bounceYOffset;

          globalScene.tweens.add({
            targets: pokeball,
            y: bounceY,
            duration: bouncePower * baseBounceDuration,
            ease: "Cubic.easeOut",
            onComplete: () => doBounce(),
          });
        } else if (callback) {
          callback();
        }
      },
    });
  };

  const doCritShake = () => {
    globalScene.tweens.add({
      targets: pokeball,
      x: x2,
      duration: 125,
      ease: "Linear",
      onComplete: () => {
        globalScene.tweens.add({
          targets: pokeball,
          x: x1,
          duration: 125,
          ease: "Linear",
          onComplete: () => {
            critShakes--;
            if (critShakes > 0) {
              doCritShake();
            } else {
              globalScene.tweens.add({
                targets: pokeball,
                x: x0,
                duration: 60,
                ease: "Linear",
                onComplete: () => globalScene.time.delayedCall(500, doBounce),
              });
            }
          },
        });
      },
    });
  };

  if (isCritical) {
    globalScene.time.delayedCall(500, doCritShake);
  } else {
    doBounce();
  }
}
