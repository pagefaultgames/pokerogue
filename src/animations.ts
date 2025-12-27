import { globalScene } from "#app/global-scene";
import type { BattleAnim } from "#data/battle-anims";
import { PokeballType } from "#enums/pokeball";
import type { Variant } from "#sprites/variant";
import { type BooleanHolder, getFrameMs, randGauss, randInt } from "#utils/common";

/**
 * Class for handling general animations such as particle effects.
 * For battle animations, see {@linkcode BattleAnim}.
 */
// TODO: Can this be made into an interface/POJO?
// TODO: Rename to not conflict with built-in `animation` class
// TODO: Clean up a lot of the animation code to be more maintainable and add better docs
export class Animation {
  // #region Public Methods

  /**
   * Animates particles that "spiral" upwards at start of transform animation
   * @param transformationBaseBg - The background image to animate.
   * @param transformationContainer - The phaser container
   * @param xOffset - The x offset
   * @param yOffset - The y offset
   */
  public doSpiralUpward(
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
    xOffset = 0,
    yOffset = 0,
  ): void {
    let cycle = 0;

    globalScene.tweens.addCounter({
      repeat: 8,
      duration: getFrameMs(8),
      onRepeat: () => {
        for (let i = 0; i < 4; i++) {
          this.doSpiralUpwardParticle(
            16 * cycle + i * 64,
            transformationBaseBg,
            transformationContainer,
            xOffset,
            yOffset,
          );
        }
        cycle++;
      },
    });
  }

  /**
   * Animates particles that arc downwards after the upwards spiral for evolution/form change animations.
   * @param transformationBaseBg - The background image to animate
   * @param transformationContainer - The {@linkcode Phaser.GameObjects.Container | Container}
   * which will own the particles
   * @param xOffset - The x offset
   * @param yOffset - The y offset
   */
  public doArcDownward(
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
    xOffset = 0,
    yOffset = 0,
  ): void {
    globalScene.tweens.addCounter({
      repeat: 6,
      duration: getFrameMs(1),
      onRepeat: () => {
        for (let i = 0; i < 9; i++) {
          this.doArcDownParticle(i * 16, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      },
    });
  }

  /**
   * Animates the transformation between the old pokemon form and new pokemon form
   * @param currentCycle - Variable to track how many cycles have been run and also how long the delay is
   * @param finalCycle - Number representing how many times to recursively cycle the animation
   * @param pokemonTintSprite - The tinted sprite of the Pokemon
   * @param pokemonNewFormTintSprite - The tinted sprite of the Pokemon's new form
   * @param cancelled - If its value is set to `true` by external code during the animation, then cancel the animation.
   */
  public doCycle(
    currentCycle: number,
    finalCycle: number,
    pokemonTintSprite: Phaser.GameObjects.Sprite,
    pokemonNewFormTintSprite: Phaser.GameObjects.Sprite,
    cancelled?: BooleanHolder,
  ): Promise<void> {
    const isFinalCycle = currentCycle === finalCycle;
    const duration = 500 / currentCycle;

    return new Promise(resolve => {
      globalScene.tweens.add({
        targets: pokemonTintSprite,
        scale: 0.25,
        ease: "Cubic.easeInOut",
        duration,
        yoyo: !isFinalCycle,
      });
      globalScene.tweens.add({
        targets: pokemonNewFormTintSprite,
        scale: 1,
        ease: "Cubic.easeInOut",
        duration,
        yoyo: !isFinalCycle,
        onComplete: () => {
          if (cancelled?.value) {
            return resolve();
          }
          if (isFinalCycle) {
            pokemonTintSprite.setVisible(false);
            return resolve();
          }
          // TODO: Explain or refactor away the recursion
          this.doCycle(currentCycle + 0.5, finalCycle, pokemonTintSprite, pokemonNewFormTintSprite, cancelled).then(
            resolve,
          );
        },
      });
    });
  }

  /**
   * Animates particles in a circle pattern
   * @param transformationBaseBg - The background image
   * @param transformationContainer - The phaser container
   * @param xOffset - The x offset
   * @param yOffset - The y offset
   */
  public doCircleInward(
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
    xOffset = 0,
    yOffset = 0,
  ): void {
    // Add 2 batches of particles - 1 set immediately, another after 32 frames have passed
    globalScene.tweens.addCounter({
      duration: getFrameMs(32),
      onStart: () => {
        for (let i = 0; i < 16; i++) {
          this.doCircleInwardParticle(i * 16, 4, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      },
      onComplete: () => {
        for (let i = 0; i < 16; i++) {
          this.doCircleInwardParticle(i * 16, 8, transformationBaseBg, transformationContainer, xOffset, yOffset);
        }
      },
    });
  }

  public doSpray(
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
  ): void {
    let f = 0;

    globalScene.tweens.addCounter({
      repeat: 48,
      duration: getFrameMs(1),
      onRepeat: () => {
        if (!f) {
          for (let i = 0; i < 8; i++) {
            this.doSprayParticle(i, transformationBaseBg, transformationContainer);
          }
        } else if (f < 50) {
          this.doSprayParticle(randInt(8), transformationBaseBg, transformationContainer);
        }
        f++;
      },
    });
  }

  public addPokeballOpenParticles(x: number, y: number, pokeballType: PokeballType): void {
    switch (pokeballType) {
      case PokeballType.POKEBALL:
        this.doDefaultPbOpenParticles(x, y, 48);
        break;
      case PokeballType.GREAT_BALL:
        this.doDefaultPbOpenParticles(x, y, 96);
        break;
      case PokeballType.ULTRA_BALL:
        this.doUbOpenParticles(x, y);
        break;
      case PokeballType.MASTER_BALL:
        this.doMbOpenParticles(x, y);
        break;
    }
  }

  public addPokeballCaptureStars(pokeball: Phaser.GameObjects.Sprite): void {
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

    const numStars = 3;
    for (let i = 0; i < numStars; i++) {
      addParticle();
    }
  }

  /**
   * Play the shiny sparkle animation and sound effect for the given sprite
   * First ensures that the animation has been properly initialized
   * @param sparkleSprite the Sprite to play the animation on
   * @param variant which shiny {@linkcode variant} to play the animation for
   */
  public doShinySparkleAnim(sparkleSprite: Phaser.GameObjects.Sprite, variant: Variant): void {
    const keySuffix = variant ? `_${variant + 1}` : "";
    const spriteKey = `shiny${keySuffix}`;
    const animationKey = `sparkle${keySuffix}`;

    // Make sure the animation exists, and create it if not
    if (!globalScene.anims.exists(animationKey)) {
      const frameNames = globalScene.anims.generateFrameNames(spriteKey, { suffix: ".png", end: 34 });
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

  public cos(index: number, amplitude: number): number {
    return amplitude * Math.cos(index * (Math.PI / 128));
  }

  public sin(index: number, amplitude: number): number {
    return amplitude * Math.sin(index * (Math.PI / 128));
  }

  // #endregion
  // #region Private Methods

  private doDefaultPbOpenParticles(x: number, y: number, radius: number): void {
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

  private doMbOpenParticles(x: number, y: number): void {
    const particles: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 8; j++) {
        particles.push(this.doFanOutParticle(j * 32, x, y, i ? 1 : 2, j ? 2 : 1, 8, 4));
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

  private doUbOpenParticles(x: number, y: number): void {
    const particles: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 10; i++) {
      particles.push(this.doFanOutParticle(i * 25, x, y, 1, 1, 5, 8));
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

  private doFanOutParticle(
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
      particle.x = x + this.sin(trigIndex, f * xSpeed);
      particle.y = y + this.cos(trigIndex, f * ySpeed);
      trigIndex += angle;
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

  private doSprayParticle(
    trigIndex: number,
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
  ): void {
    const initialX = transformationBaseBg.displayWidth / 2;
    const initialY = transformationBaseBg.displayHeight / 2;
    const particle = globalScene.add.image(initialX, initialY, "evo_sparkle");
    transformationContainer.add(particle);

    let f = 0;
    let yOffset = 0;
    const speed = 3 - randInt(8);
    const amp = 48 + randInt(64);

    const particleTimer = globalScene.tweens.addCounter({
      repeat: -1,
      duration: getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      },
    });

    const updateParticle = () => {
      if (!(f & 3)) {
        yOffset++;
      }
      if (trigIndex < 128) {
        particle.setPosition(initialX + (speed * f) / 3, initialY + yOffset);
        particle.y += -this.sin(trigIndex, amp);
        if (f > 108) {
          particle.setScale(1 - (f - 108) / 20);
        }
        trigIndex++;
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  /**
   * Helper function for {@linkcode doSpiralUpward}, handles a single particle
   * @param trigIndex - Starting offset for particle
   * @param transformationBaseBg - The background image
   * @param transformationContainer - The phaser container
   * @param xOffset - The x offset
   * @param yOffset - The y offset
   */
  private doSpiralUpwardParticle(
    trigIndex: number,
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
    xOffset: number,
    yOffset: number,
  ): void {
    const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
    const particle = globalScene.add.image(initialX, 0, "evo_sparkle");
    transformationContainer.add(particle);

    let f = 0;
    let amp = 48;

    const particleTimer = globalScene.tweens.addCounter({
      repeat: -1,
      duration: getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      },
    });

    const updateParticle = () => {
      if (!f || particle.y > 8) {
        particle.setPosition(initialX, 88 - (f * f) / 80 + yOffset);
        particle.y += this.sin(trigIndex, amp) / 4;
        particle.x += this.cos(trigIndex, amp);
        particle.setScale(1 - f / 80);
        trigIndex += 4;
        if (f % 2 === 1) {
          amp--;
        }
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  /**
   * Helper function for {@linkcode doArcDownward}, handles a single particle
   * @param trigIndex - Starting offset for particle
   * @param transformationBaseBg - The background image
   * @param transformationContainer - The phaser container
   * @param xOffset - The x offset
   * @param yOffset - The y offset
   */
  private doArcDownParticle(
    trigIndex: number,
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
    xOffset: number,
    yOffset: number,
  ): void {
    const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
    const particle = globalScene.add.image(initialX, 0, "evo_sparkle");
    particle.setScale(0.5);
    transformationContainer.add(particle);

    let f = 0;
    let amp = 8;

    // TODO: This repeats infinitely, which is bad
    const particleTimer = globalScene.tweens.addCounter({
      repeat: -1,
      duration: getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      },
    });

    const updateParticle = () => {
      if (!f || particle.y < 88) {
        particle.setPosition(initialX, 8 + (f * f) / 5 + yOffset);
        particle.y += this.sin(trigIndex, amp) / 4;
        particle.x += this.cos(trigIndex, amp);
        amp = 8 + this.sin(f * 4, 40);
        f++;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  /**
   * Helper function for {@linkcode doCircleInward}, handles a single particle
   * @param trigIndex - Starting offset for particle
   * @param speed - How much the amplitude slows down by each cycle
   * @param transformationBaseBg - The background image
   * @param transformationContainer - The phaser container
   * @param xOffset - The x offset
   * @param yOffset - The y offset
   */
  private doCircleInwardParticle(
    trigIndex: number,
    speed: number,
    transformationBaseBg: Phaser.GameObjects.Image,
    transformationContainer: Phaser.GameObjects.Container,
    xOffset: number,
    yOffset: number,
  ): void {
    const initialX = transformationBaseBg.displayWidth / 2 + xOffset;
    const initialY = transformationBaseBg.displayHeight / 2 + yOffset;
    const particle = globalScene.add.image(initialX, initialY, "evo_sparkle");
    transformationContainer.add(particle);

    let amp = 120;

    const particleTimer = globalScene.tweens.addCounter({
      repeat: -1,
      duration: getFrameMs(1),
      onRepeat: () => {
        updateParticle();
      },
    });

    const updateParticle = () => {
      if (amp > 8) {
        particle.setPosition(initialX, initialY);
        particle.y += this.sin(trigIndex, amp);
        particle.x += this.cos(trigIndex, amp);
        amp -= speed;
        trigIndex += 4;
      } else {
        particle.destroy();
        particleTimer.remove();
      }
    };

    updateParticle();
  }

  // #endregion
}
