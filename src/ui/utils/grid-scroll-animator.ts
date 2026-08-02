import { globalScene } from "#app/global-scene";
import type { GridCell, GridScrollAnimatorConfig } from "#types/configs/grid-helper";
import { fixedInt } from "#utils/common";

/**
 * Slides a grid's cells by one row when its scroll position changes, instead of snapping
 * them straight to the new contents.
 *
 * This is a layer on top of the grid because it's fake - the scrollable grid recycles cells, so
 * there isn't actually anything to scroll up or down at the borders. Also note that an animation
 * is purely cosmetic, so the "true" value of cells is set immediately rather than after the scroll.
 */
export class GridScrollAnimator<TCell extends GridCell> {
  private readonly config: GridScrollAnimatorConfig<TCell>;
  /** Extra row of cells, shown only for the duration of a slide */
  private readonly overscanCells: TCell[] = [];
  private tween: Phaser.Tweens.Tween | null = null;
  private maskGraphics: Phaser.GameObjects.Graphics | null = null;
  private mask: Phaser.Display.Masks.GeometryMask | null = null;

  constructor(config: GridScrollAnimatorConfig<TCell>) {
    this.config = config;
    for (let col = 0; col < config.cols; col++) {
      const cell = config.createCell();
      // The overscan row mirrors the column positions of the grid's first row with y set per slide
      cell.setPosition(config.columnX(col), 0);
      cell.setVisible(false);
      this.overscanCells.push(cell);
      config.cellContainer.add(cell);
    }
  }

  public get isSliding(): boolean {
    return this.tween !== null;
  }

  /**
   * Start sliding the cells by one row.
   * @param direction - `1` when scrolling forward (the new row enters at the end), `-1` when scrolling back
   * @param incomingRowStart - Absolute index of the first item of the row entering view
   */
  public slide(direction: 1 | -1, incomingRowStart: number): void {
    const { cellContainer, rows, spacingY, tween } = this.config;
    this.snap();
    this.config.renderRow(this.overscanCells, incomingRowStart);
    const incomingY = direction > 0 ? rows * spacingY : -spacingY;
    for (const cell of this.overscanCells) {
      cell.setY(incomingY);
    }
    this.applyClip();

    this.tween = globalScene.tweens.add({
      targets: cellContainer,
      y: -direction * spacingY,
      duration: fixedInt(tween.duration),
      ease: tween.ease ?? "Sine.easeInOut",
      onComplete: () => {
        if (this.tween === null) {
          return;
        }
        this.tween = null;
        this.commitSlide();
      },
    });
  }

  /**
   * Finish an in-flight slide immediately
   */
  public snap(): void {
    const tween = this.tween;
    if (tween == null) {
      return;
    }
    this.tween = null;
    tween.stop();
    this.config.cellContainer.y = 0;
    this.endSlide();
  }

  /**
   * Abandon an in-flight slide and return the cells to their resting position.
   * The caller is responsible for redrawing the grid afterwards.
   */
  public cancel(): void {
    this.tween?.stop();
    this.tween = null;
    this.config.cellContainer.y = 0;
    this.endSlide();
  }

  public destroy(): void {
    this.cancel();
    this.config.cellContainer.clearMask(false);
    this.mask?.destroy();
    this.mask = null;
    this.maskGraphics?.destroy();
    this.maskGraphics = null;
  }

  /**
   * Complete a slide animation.
   */
  private commitSlide(): void {
    this.config.cellContainer.y = 0;
    this.endSlide();
    this.config.commit();
  }

  /**
   * Hide overscan row and clear the clip mask.
   */
  private endSlide(): void {
    for (const cell of this.overscanCells) {
      cell.setVisible(false);
    }
    this.config.cellContainer.clearMask();
  }

  /**
   * Clip scrolling rows so they don't appear outside the grid's bounding box.
   */
  private applyClip(): void {
    const { cellContainer: viewport, clip } = this.config;
    const matrix = viewport.getWorldTransformMatrix();
    this.maskGraphics ??= globalScene.make.graphics();
    this.maskGraphics
      .clear()
      .fillStyle(0xffffff)
      .fillRect(
        matrix.tx + clip.x * matrix.scaleX,
        matrix.ty + clip.y * matrix.scaleY,
        clip.width * matrix.scaleX,
        clip.height * matrix.scaleY,
      );
    this.mask ??= this.maskGraphics.createGeometryMask();
    viewport.setMask(this.mask);
  }
}
