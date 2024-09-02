export class ScrollBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private handleBody: Phaser.GameObjects.Rectangle;
  private handleBottom: Phaser.GameObjects.Image;
  private pages: number;
  private page: number;

  constructor(scene: Phaser.Scene, x: number, y: number, pages: number) {
    super(scene, x, y);

    this.bg = scene.add.image(0, 0, "scroll_bar");
    this.bg.setOrigin(0, 0);
    this.add(this.bg);

    this.handleBody = scene.add.rectangle(1, 1, 3, 4, 0xaaaaaa);
    this.handleBody.setOrigin(0, 0);
    this.add(this.handleBody);

    this.handleBottom = scene.add.image(1, 1, "scroll_bar_handle");
    this.handleBottom.setOrigin(0, 0);
    this.add(this.handleBottom);
  }

  setPage(page: number): void {
    this.page = page;
    this.handleBody.y = 1 + (this.bg.displayHeight - 1 - this.handleBottom.displayHeight) / this.pages * page;
    this.handleBottom.y = this.handleBody.y + this.handleBody.displayHeight;
  }

  setPages(pages: number): void {
    this.pages = pages;
    this.handleBody.height = (this.bg.displayHeight - 1 - this.handleBottom.displayHeight) * 9 / this.pages;

    this.setVisible(this.pages > 9);
  }
}
