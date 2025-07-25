import { globalScene } from "#app/global-scene";
import { PokeballType } from "#enums/pokeball";
import type { Variant } from "#sprites/variant";
import { getFrameMs, randGauss } from "#utils/common";

export function addPokeballOpenParticles(x: number, y: number, pokeballType: PokeballType): void {
  switch (pokeballType) {
    case PokeballType.POKEBALL:
      doDefaultPbOpenParticles(x, y, 48);
      break;
    case PokeballType.GREAT_BALL:
      doDefaultPbOpenParticles(x, y, 96);
      break;
    case PokeballType.ULTRA_BALL:
      doUbOpenParticles(x, y, 8);
      break;
    case PokeballType.ROGUE_BALL:
      doUbOpenParticles(x, y, 10);
      break;
    case PokeballType.MASTER_BALL:
      doMbOpenParticles(x, y);
      break;
  }
}

function doDefaultPbOpenParticles(x: number, y: number, radius: number) {
  const pbOpenParticlesFrameNames = globalScene.anims.generateFrameNames("pb_particles", {
    start: 0,
    end: 3,
    suffix: ".png",
  });
  if (!globalScene.anims.exists("pb_open_particle")) {
    globalScene.anims.create({
      key: "pb_open_particle",
      frames: pbOpenParticlesFrameNames,
      frameRate: 16,
      repeat: -1,
    });
  }

  const addParticle = (index: number) => {
    const particle = globalScene.add.sprite(x, y, "pb_open_particle");
    globalScene.field.add(particle);
    const angle = index * 45;
    const [xCoord, yCoord] = [radius * Math.cos((angle * Math.PI) / 180), radius * Math.sin((angle * Math.PI) / 180)];
    globalScene.tweens.add({
      targets: particle,
      x: x + xCoord,
      y: y + yCoord,
      duration: 575,
    });
    particle.play({
      key: "pb_open_particle",
      startFrame: (index + 3) % 4,
      frameRate: Math.floor(16 * globalScene.gameSpeed),
    });
    globalScene.tweens.add({
      targets: particle,
      delay: 500,
      duration: 75,
      alpha: 0,
      ease: "Sine.easeIn",
      onComplete: () => particle.destroy(),
    });
  };

  let particleCount = 0;
  globalScene.time.addEvent({
    delay: 20,
    repeat: 16,
    callback: () => addParticle(++particleCount),
  });
}

function doUbOpenParticles(x: number, y: number, frameIndex: number) {
  const particles: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 10; i++) {
    particles.push(doFanOutParticle(i * 25, x, y, 1, 1, 5, frameIndex));
  }

  globalScene.tweens.add({
    targets: particles,
    delay: 750,
    duration: 250,
    alpha: 0,
    ease: "Sine.easeIn",
    onComplete: () => {
      for (const particle of particles) {
        particle.destroy();
      }
    },
  });
}

function doMbOpenParticles(x: number, y: number) {
  const particles: Phaser.GameObjects.Image[] = [];
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 8; i++) {
      particles.push(doFanOutParticle(i * 32, x, y, j ? 1 : 2, j ? 2 : 1, 8, 4));
    }

    globalScene.tweens.add({
      targets: particles,
      delay: 750,
      duration: 250,
      alpha: 0,
      ease: "Sine.easeIn",
      onComplete: () => {
        for (const particle of particles) {
          particle.destroy();
        }
      },
    });
  }
}

function doFanOutParticle(
  trigIndex: number,
  x: number,
  y: number,
  xSpeed: number,
  ySpeed: number,
  angle: number,
  frameIndex: number,
): Phaser.GameObjects.Image {
  let f = 0;

  const particle = globalScene.add.image(x, y, "pb_particles", `${frameIndex}.png`);
  globalScene.field.add(particle);

  const updateParticle = () => {
    if (!particle.scene) {
      return particleTimer.remove();
    }
    particle.x = x + sin(trigIndex, f * xSpeed);
    particle.y = y + cos(trigIndex, f * ySpeed);
    trigIndex = trigIndex + angle;
    f++;
  };

  const particleTimer = globalScene.tweens.addCounter({
    repeat: -1,
    duration: getFrameMs(1),
    onRepeat: () => {
      updateParticle();
    },
  });

  return particle;
}

export function addPokeballCaptureStars(pokeball: Phaser.GameObjects.Sprite): void {
  const addParticle = (): void => {
    const particle = globalScene.add.sprite(pokeball.x, pokeball.y, "pb_particles", "4.png");
    particle.setOrigin(pokeball.originX, pokeball.originY);
    particle.setAlpha(0.5);
    globalScene.field.add(particle);

    globalScene.tweens.add({
      targets: particle,
      y: pokeball.y - 10,
      ease: "Sine.easeOut",
      duration: 250,
      onComplete: () => {
        globalScene.tweens.add({
          targets: particle,
          y: pokeball.y,
          alpha: 0,
          ease: "Sine.easeIn",
          duration: 250,
        });
      },
    });

    const dist = randGauss(25);
    globalScene.tweens.add({
      targets: particle,
      x: pokeball.x + dist,
      duration: 500,
    });

    globalScene.tweens.add({
      targets: particle,
      alpha: 0,
      delay: 425,
      duration: 75,
      onComplete: () => particle.destroy(),
    });
  };

  for (let i = 0; i < 3; i++) {
    addParticle();
  }
}

export function sin(index: number, amplitude: number): number {
  return amplitude * Math.sin(index * (Math.PI / 128));
}

export function cos(index: number, amplitude: number): number {
  return amplitude * Math.cos(index * (Math.PI / 128));
}

/**
 * Play the shiny sparkle animation and sound effect for the given sprite
 * First ensures that the animation has been properly initialized
 * @param sparkleSprite the Sprite to play the animation on
 * @param variant which shiny {@linkcode variant} to play the animation for
 */
export function doShinySparkleAnim(sparkleSprite: Phaser.GameObjects.Sprite, variant: Variant) {
  const keySuffix = variant ? `_${variant + 1}` : "";
  const spriteKey = `shiny${keySuffix}`;
  const animationKey = `sparkle${keySuffix}`;

  // Make sure the animation exists, and create it if not
  if (!globalScene.anims.exists(animationKey)) {
    const frameNames = globalScene.anims.generateFrameNames(spriteKey, {
      suffix: ".png",
      end: 34,
    });
    globalScene.anims.create({
      key: `sparkle${keySuffix}`,
      frames: frameNames,
      frameRate: 32,
      showOnStart: true,
      hideOnComplete: true,
    });
  }

  // Play the animation
  sparkleSprite.play(animationKey);
  globalScene.playSound("se/sparkle");
}
