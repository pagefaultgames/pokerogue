import { globalScene } from "#app/global-scene";

/**
 * A vertical scrollbar element that resizes dynamically based on the current scrolling
 * and number of elements that can be shown on screen
 */
export class ScrollBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private handleBody: Phaser.GameObjects.Rectangle;
  private handleBottom: Phaser.GameObjects.NineSlice;
  private currentRow: number;
  private totalRows: number;
  private maxRows: number;

  /**
   * @param x the scrollbar's x position (origin: top left)
   * @param y the scrollbar's y position (origin: top left)
   * @param width the scrollbar's width
   * @param height the scrollbar's height
   * @param maxRows the maximum number of rows that can be shown at once
   */
  constructor(x: number, y: number, width: number, height: number, maxRows: number) {
    super(globalScene, x, y);

    this.maxRows = maxRows;
    this.totalRows = maxRows;
    this.currentRow = 0;

    const borderSize = 2;
    width = Math.max(width, 4);

    this.bg = globalScene.add.nineslice(
      0,
      0,
      "scroll_bar",
      undefined,
      width,
      height,
      borderSize,
      borderSize,
      borderSize,
      borderSize,
    );
    this.bg.setOrigin(0, 0);
    this.add(this.bg);

    this.handleBody = globalScene.add.rectangle(1, 1, width - 2, 4, 0xaaaaaa);
    this.handleBody.setOrigin(0, 0);
    this.add(this.handleBody);

    this.handleBottom = globalScene.add.nineslice(1, 1, "scroll_bar_handle", undefined, width - 2, 2, 2, 0, 0, 0);
    this.handleBottom.setOrigin(0, 0);
    this.add(this.handleBottom);
  }

  /**
   * Set the current row that is displayed
   * Moves the bar handle up or down accordingly
   * @param scrollCursor how many times the view was scrolled down
   */
  setScrollCursor(scrollCursor: number): void {
    this.currentRow = scrollCursor;
    this.updateHandlePosition();
  }

  /**
   * Set the total number of rows to display
   * If it's smaller than the maximum number of rows on screen the bar will get hidden
   * Otherwise the scrollbar handle gets resized based on the ratio to the maximum number of rows
   * @param rows how many rows of data there are in total
   */
  setTotalRows(rows: number): void {
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
}
