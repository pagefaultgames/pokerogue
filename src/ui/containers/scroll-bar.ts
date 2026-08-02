import { globalScene } from "#app/global-scene";
import { fixedInt } from "#utils/common";

/**
 * A vertical scrollbar element that resizes dynamically based on the current scrolling
 * and number of elements that can be shown on screen
 */
export class ScrollBar extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.NineSlice;
  private readonly handleBody: Phaser.GameObjects.Rectangle;
  private readonly handleBottom: Phaser.GameObjects.NineSlice;
  private readonly displayRows: number;
  private readonly top: number;
  private readonly onScroll: ((v: number, dv: number) => void) | undefined;
  private currentRow: number;
  private totalRows: number;
  private grabOffsetY = 0;
  /** In-flight tween that slides the handle to match a cell scroll animation */
  private handleTween: Phaser.Tweens.Tween | null = null;

  /**
   * @param x - the scrollbar's x position (origin: top left)
   * @param y - the scrollbar's y position (origin: top left)
   * @param width - the scrollbar's width
   * @param height - the scrollbar's height
   * @param maxRows - the maximum number of rows that can be shown at once
   * @param onScroll - callback to run when scrolling
   */
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    maxRows: number,
    onScroll?: (v: number, dv: number) => void,
  ) {
    super(globalScene, x, y);

    this.top = this.getWorldPoint().y;
    this.displayRows = maxRows;
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

    this.onScroll = onScroll;
    // this.addTouch();
  }

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: touch not yet enabled
  private addTouch(): void {
    this.bg.setInteractive();
    this.bg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const localY = pointer.downY / 6 - this.top;
      const handleTop = this.handleBody.y;
      const handleBottom = this.handleBody.y + this.handleBody.displayHeight + this.handleBottom.displayHeight;

      if (localY >= handleTop && localY <= handleBottom) {
        this.grabOffsetY = localY - handleTop;
      } else {
        this.grabOffsetY = (this.handleBody.displayHeight + this.handleBottom.displayHeight) / 2;
      }

      this.cursorToPointer(pointer);
    });

    this.bg.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        return;
      }
      this.cursorToPointer(pointer);
    });
  }

  private cursorToPointer(pointer: Phaser.Input.Pointer) {
    const trackHeight = this.bg.displayHeight;
    const handleHeight = this.handleBody.displayHeight + this.handleBottom.displayHeight;

    const localY = Phaser.Math.Clamp(
      pointer.y / 6 - this.top - this.grabOffsetY,
      0,
      trackHeight - handleHeight, // stop when handle bottom hits the track bottom
    );

    const row = Math.round((localY / (trackHeight - handleHeight)) * (this.totalRows - this.displayRows));
    this.setScrollCursor(Phaser.Math.Clamp(row, 0, this.totalRows - this.displayRows));
  }

  /**
   * Set the current row that is displayed.
   * Cancels any running handle animation and moves the handle instantly.
   * @param scrollCursor how many times the view was scrolled down
   */
  public setScrollCursor(scrollCursor: number): void {
    if (scrollCursor === this.currentRow) {
      return;
    }

    this.cancelHandleAnimation();
    const change = this.currentRow - scrollCursor;
    this.currentRow = scrollCursor;
    this.updateHandlePosition();
    this.onScroll?.(scrollCursor, change);
  }

  /**
   * Set the total number of rows to display.
   * If it's smaller than the maximum number of rows on screen the bar will get hidden.
   * Otherwise the scrollbar handle gets resized based on the ratio to the maximum number of rows.
   * @param rows how many rows of data there are in total
   */
  public setTotalRows(rows: number): void {
    this.totalRows = rows;
    this.cancelHandleAnimation();
    this.handleBody.height =
      ((this.bg.displayHeight - 1 - this.handleBottom.displayHeight) * this.displayRows) / this.totalRows;
    this.updateHandlePosition();

    this.setVisible(this.totalRows > this.displayRows);
  }

  private updateHandlePosition(): void {
    this.handleBody.y =
      1 + ((this.bg.displayHeight - 1 - this.handleBottom.displayHeight) / this.totalRows) * this.currentRow;
    this.handleBottom.y = this.handleBody.y + this.handleBody.displayHeight;
  }

  public getCurrentRow(): number {
    return this.currentRow;
  }

  /**
   * Animate the scrollbar handle from one row's visual position to the current
   * row's position, keeping it in sync with a cell scroll slide.
   *
   * @param fromRow - The row the handle should visually start at
   * @param duration - Raw tween duration in ms (will be processed by {@link fixedInt})
   * @param ease - Phaser ease string
   */
  public tweenHandle(fromRow: number, duration: number, ease: string): void {
    if (fromRow === this.currentRow) {
      return;
    }
    this.cancelHandleAnimation();

    const trackRatio = (this.bg.displayHeight - 1 - this.handleBottom.displayHeight) / this.totalRows;
    const startY = 1 + trackRatio * fromRow;
    const endY = 1 + trackRatio * this.currentRow;

    // Rewind the handle to the starting position
    this.handleBody.y = startY;
    this.handleBottom.y = startY + this.handleBody.displayHeight;

    this.handleTween = globalScene.tweens.add({
      targets: this.handleBody,
      y: endY,
      duration: fixedInt(duration),
      ease,
      onUpdate: () => {
        this.handleBottom.y = this.handleBody.y + this.handleBody.displayHeight;
      },
      onComplete: () => {
        this.handleTween = null;
        // Snap to the exact computed position to avoid floating-point drift
        this.updateHandlePosition();
      },
    });
  }

  /** Stop any running handle animation and snap the handle to its current logical position. */
  private cancelHandleAnimation(): void {
    if (this.handleTween) {
      this.handleTween.stop();
      this.handleTween = null;
    }
  }

  public override destroy(fromScene?: boolean): void {
    this.cancelHandleAnimation();
    super.destroy(fromScene);
  }
}
