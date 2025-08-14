import { globalScene } from "#app/global-scene";
import type { Pokemon } from "#field/pokemon";

export class PokeballTray extends Phaser.GameObjects.Container {
  private player: boolean;

  private bg: Phaser.GameObjects.NineSlice;
  private balls: Phaser.GameObjects.Sprite[];

  public shown: boolean;

  constructor(player: boolean) {
    super(globalScene, player ? globalScene.scaledCanvas.width : 0, player ? -72 : -144);
    this.player = player;
  }

  setup(): void {
    this.bg = globalScene.add.nineslice(
      0,
      0,
      `pb_tray_overlay_${this.player ? "player" : "enemy"}`,
      undefined,
      104,
      4,
      48,
      8,
      0,
      0,
    );
    this.bg.setOrigin(this.player ? 1 : 0, 0);

    this.add(this.bg);

    this.balls = new Array(6)
      .fill(null)
      .map((_, i) =>
        globalScene.add.sprite(
          (this.player ? -83 : 76)
            + globalScene.scaledCanvas.width * (this.player ? -1 : 1)
            + 10 * i * (this.player ? 1 : -1),
          -8,
          "pb_tray_ball",
          "empty",
        ),
      );

    for (const ball of this.balls) {
      ball.setOrigin(0, 0);
      this.add(ball);
    }

    this.setVisible(false);
    this.shown = false;
  }

  showPbTray(party: Pokemon[]): Promise<void> {
    return new Promise(resolve => {
      if (this.shown) {
        return resolve();
      }

      globalScene.fieldUI.bringToTop(this);

      this.x += 104 * (this.player ? 1 : -1);

      this.bg.width = 104;
      this.bg.alpha = 1;

      this.balls.forEach((ball, b) => {
        ball.x += (globalScene.scaledCanvas.width + 104) * (this.player ? 1 : -1);
        let ballFrame = "ball";
        if (b >= party.length) {
          ballFrame = "empty";
        } else if (!party[b].hp) {
          ballFrame = "faint";
        } else if (party[b].status) {
          ballFrame = "status";
        }
        ball.setFrame(ballFrame);
      });

      globalScene.playSound("se/pb_tray_enter");

      globalScene.tweens.add({
        targets: this,
        x: `${this.player ? "-" : "+"}=104`,
        duration: 500,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.balls.forEach((ball, b) => {
            globalScene.tweens.add({
              targets: ball,
              x: `${this.player ? "-" : "+"}=104`,
              duration: b * 100,
              ease: "Sine.easeIn",
              onComplete: () => globalScene.playSound(`se/${b < party.length ? "pb_tray_ball" : "pb_tray_empty"}`),
            });
          });
        },
      });

      this.setVisible(true);
      this.shown = true;

      globalScene.time.delayedCall(1100, () => resolve());
    });
  }

  hide(): Promise<void> {
    return new Promise(resolve => {
      if (!this.shown) {
        return resolve();
      }

      this.balls.forEach((ball, b) => {
        globalScene.tweens.add({
          targets: ball,
          x: `${this.player ? "-" : "+"}=${globalScene.scaledCanvas.width}`,
          duration: 250,
          delay: b * 100,
          ease: "Sine.easeIn",
        });
      });

      globalScene.tweens.add({
        targets: this.bg,
        width: 144,
        alpha: 0,
        duration: 500,
        ease: "Sine.easeIn",
      });

      globalScene.time.delayedCall(850, () => {
        this.setVisible(false);
        resolve();
      });

      this.shown = false;
    });
  }
}
