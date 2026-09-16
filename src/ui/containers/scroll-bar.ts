import { globalScene } from "#app/global-scene";

/**
 * A vertical scrollbar element that resizes dynamically based on the current scrolling
 * and number of elements that can be shown on screen
 */
export class ScrollBar extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.NineSlice;
  private readonly handleBody: Phaser.GameObjects.Rectangle;
  private readonly handleBottom: Phaser.GameObjects.NineSlice;
  private currentRow: number;
  private totalRows: number;
  private readonly maxRows: number;

  /**
   * @param x - The scrollbar's x position (origin: top left)
   * @param y - The scrollbar's y position (origin: top left)
   * @param width - The scrollbar's width
   * @param height - The scrollbar's height
   * @param maxRows - The maximum number of rows that can be shown at once
   */
  constructor(x: number, y: number, width: number, height: number, maxRows: number) {
    super(globalScene, x, y);

    this.maxRows = maxRows;
    this.totalRows = maxRows;
    this.currentRow = 0;

    const borderSize = 2;
    const clampedWidth = Math.max(width, 4);

    this.bg = globalScene.add
      .nineslice(0, 0, "scroll_bar", undefined, clampedWidth, height, borderSize, borderSize, borderSize, borderSize)
      .setOrigin(0);

    this.handleBody = globalScene.add //
      .rectangle(1, 1, clampedWidth - 2, 4, 0xaaaaaa)
      .setOrigin(0);

    this.handleBottom = globalScene.add
      .nineslice(1, 1, "scroll_bar_handle", undefined, clampedWidth - 2, 2, 2, 0, 0, 0)
      .setOrigin(0);

    this.add([this.bg, this.handleBody, this.handleBottom]);
  }

  /**
   * Set the current row that is displayed
   * Moves the bar handle up or down accordingly
   * @param scrollCursor how many times the view was scrolled down
   */
  public setScrollCursor(scrollCursor: number): void {
    this.currentRow = scrollCursor;
    this.updateHandlePosition();
  }

  /**
   * Set the total number of rows to display
   * If it's smaller than the maximum number of rows on screen the bar will get hidden
   * Otherwise the scrollbar handle gets resized based on the ratio to the maximum number of rows
   * @param rows how many rows of data there are in total
   */
  public setTotalRows(rows: number): void {
    this.totalRows = rows;
    this.handleBody.height =
      ((this.bg.displayHeight - 1 - this.handleBottom.displayHeight) * this.maxRows) / this.totalRows;
    this.updateHandlePosition();

    this.setVisible(this.totalRows > this.maxRows);
  }

  private updateHandlePosition(): void {
    this.handleBody.y =
      1 + ((this.bg.displayHeight - 1 - this.handleBottom.displayHeight) / this.totalRows) * this.currentRow;
    this.handleBottom.y = this.handleBody.y + this.handleBody.displayHeight;
  }

  public override destroy(fromScene?: boolean): void {
    this.removeAll(true);
    super.destroy(fromScene);
  }
}
