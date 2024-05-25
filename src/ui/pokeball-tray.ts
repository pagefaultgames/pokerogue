import BattleScene from "../battle-scene";
import Pokemon from "../field/pokemon";

export default class PokeballTray extends Phaser.GameObjects.Container {
  private player: boolean;

  private bg: Phaser.GameObjects.NineSlice;
  private balls: Phaser.GameObjects.Sprite[];

  public shown: boolean;

  constructor(scene: BattleScene, player: boolean) {
    super(scene, player ? (scene.game.canvas.width / 6) : 0, player ? -72 : -144);
    this.player = player;
  }

  setup(): void {
    this.bg = this.scene.add.nineslice(0, 0, `pb_tray_overlay_${this.player ? "player" : "enemy"}`, null, 104, 4, 48, 8, 0, 0);
    this.bg.setOrigin(this.player ? 1 : 0, 0);

    this.add(this.bg);

    this.balls = new Array(6).fill(null).map((_, i) => this.scene.add.sprite((this.player ? -83 : 76) + (this.scene.game.canvas.width / 6) * (this.player ? -1 : 1) + 10 * i * (this.player ? 1 : -1), -8, "pb_tray_ball", "empty"));

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

      (this.scene as BattleScene).fieldUI.bringToTop(this);

      this.x += 104 * (this.player ? 1 : -1);

      this.bg.width = 104;
      this.bg.alpha = 1;

      this.balls.forEach((ball, b) => {
        ball.x += (this.scene.game.canvas.width / 6 + 104) * (this.player ? 1 : -1);
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

      (this.scene as BattleScene).playSound("pb_tray_enter");

      this.scene.tweens.add({
        targets: this,
        x: `${this.player ? "-" : "+"}=104`,
        duration: 500,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.balls.forEach((ball, b) => {
            this.scene.tweens.add({
              targets: ball,
              x: `${this.player ? "-" : "+"}=104`,
              duration: b * 100,
              ease: "Sine.easeIn",
              onComplete: () => (this.scene as BattleScene).playSound(b < party.length ? "pb_tray_ball" : "pb_tray_empty")
            });
          });
        }
      });

      this.setVisible(true);
      this.shown = true;

      this.scene.time.delayedCall(1100, () => resolve());
    });
  }

  hide(): Promise<void> {
    return new Promise(resolve => {
      if (!this.shown) {
        return resolve();
      }

      this.balls.forEach((ball, b) => {
        this.scene.tweens.add({
          targets: ball,
          x: `${this.player ? "-" : "+"}=${this.scene.game.canvas.width / 6}`,
          duration: 250,
          delay: b * 100,
          ease: "Sine.easeIn"
        });
      });

      this.scene.tweens.add({
        targets: this.bg,
        width: 144,
        alpha: 0,
        duration: 500,
        ease: "Sine.easeIn"
      });

      this.scene.time.delayedCall(850, () => {
        this.setVisible(false);
        resolve();
      });

      this.shown = false;
    });
  }
}
