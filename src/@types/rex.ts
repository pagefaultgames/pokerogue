/**
 * Guessed types for {@Link https://github.com/rexrainbow/phaser3-rex-notes}
 */

export interface RexImageTransitionOptions {
  x: number;
  y: number;
  scale: number;
  key: string;
  origin: Origin
}

export interface RexImageTransition extends Phaser.GameObjects.GameObject {
  transit: (options: RexImageTransitionTransitOptions) => void;
}

interface RexImageTransitionTransitOptions {
  mode: string;
  ease: string;
  duration: number;
}

interface Origin {
  x: number;
  y: number;
}
