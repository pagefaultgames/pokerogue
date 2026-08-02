import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import type { CursorConfig, GridCell, ScrollableGridConfig } from "#types/configs/grid-helper";
import { GridScrollAnimator } from "#ui/grid-scroll-animator";
import { ScrollBar } from "#ui/scroll-bar";

/**
 * A scrollable grid of cells.
 *
 * Handles all common tasks to grids and menus: item display, cursor movement, touch input, scrolling, etc.
 */
export class ScrollableGridHelper<TCell extends GridCell, TData> extends Phaser.GameObjects.Container {
  private readonly rows: number;
  private readonly cols: number;
  private readonly config: ScrollableGridConfig<TCell, TData>;
  /** Present iff scrollable */
  private readonly scrollBar: ScrollBar | undefined;
  private readonly cellsContainer: Phaser.GameObjects.Container;
  private readonly cells: TCell[];
  private cursorObj: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Image | null = null;
  private scrollAnimator: GridScrollAnimator<TCell> | null = null;

  private items: TData[] = [];
  private cursor = 0;
  private lastSelected: { cell: TCell; index: number } | null = null;
  /** If true, suppress scroll events */
  private silentScroll = false;
  /** Scroll row the cells currently display; a slide measures its delta against this */
  private renderedRow = 0;
  /** The scroll row that the most recently started slide is heading toward */
  private slideTargetRow = 0;
  /** Whether touch controls are currently accepted by this grid */
  private touchEnabled = true;
  private readonly wrap: boolean;

  /**
   * @param x - The x coordinate for the grid container
   * @param y - The y coordinate for the grid container
   * @param config - Configuration for the grid itself
   */
  constructor(x: number, y: number, config: ScrollableGridConfig<TCell, TData>) {
    super(globalScene, x, y);

    this.config = config;
    this.rows = config.rows;
    this.cols = config.columns;
    this.wrap = config.wrap ?? true;

    this.cellsContainer = globalScene.add.container(0, 0);
    this.cells = [];
    let totalExtraSpacing = 0;
    for (let i = 0; i < this.rows * this.cols; i++) {
      const cell = config.cells.createCell();
      cell.setPosition(
        (i % this.cols) * config.cells.spacingX + totalExtraSpacing,
        Math.floor(i / this.cols) * config.cells.spacingY,
      );
      totalExtraSpacing += config.extraSpacingHorizontal?.get(i) ?? 0;
      this.cells.push(cell);
      this.cellsContainer.add(cell);
    }

    this.add(this.cellsContainer);

    if (config.scrollBar != null) {
      this.scrollBar = new ScrollBar(
        this.cellsContainer.getBounds().width + (config.scrollBar.offsetX ?? 0),
        config.scrollBar.offsetY ?? 0,
        config.scrollBar.width,
        config.scrollBar.height,
        this.rows,
        (newRow: number) => {
          if (!this.silentScroll) {
            this.handleScrollChange(newRow);
          }
        },
      );
      this.add(this.scrollBar);
    }
    this.scrollBar?.setVisible(false);

    // this.enableTouchEvents(config);

    if (config.scrollTween) {
      this.scrollAnimator = new GridScrollAnimator<TCell>({
        cellContainer: this.cellsContainer,
        rows: this.rows,
        cols: this.cols,
        spacingY: config.cells.spacingY,
        clip: {
          x: 0,
          y: 0,
          width: this.cols * config.cells.spacingX + totalExtraSpacing,
          height: this.rows * config.cells.spacingY,
        },
        tween: config.scrollTween,
        createCell: config.cells.createCell,
        columnX: col => this.cells[col].x,
        renderRow: (cells, startIndex) => this.renderRow(cells, startIndex),
        commit: () => this.renderGrid(),
      });
    }
  }

  //biome-ignore lint/correctness/noUnusedPrivateClassMembers: touch not yet enabled
  private enableTouchEvents(config: ScrollableGridConfig<TCell, TData>): void {
    this.cellsContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.cols * config.cells.spacingX, this.rows * config.cells.spacingY),
      Phaser.Geom.Rectangle.Contains,
    );
    this.cellsContainer.on("pointermove", (_pointer: Phaser.Input.Pointer, localX: number, localY: number) => {
      this.handlePointerMove(localX, localY);
    });

    this.cellsContainer.on("pointerup", (_pointer: Phaser.Input.Pointer, localX: number, localY: number) => {
      this.handlePointerDown(localX, localY);
    });
  }

  /**
   * Replace the items to be displayed.
   *
   * Resets the cursor and scroll position and fires {@linkcode ScrollableGridConfig.onItemSelected} for the first item.
   */
  public setItems(items: TData[], resetCursor = true): void {
    this.items = items;
    this.scrollBar?.setTotalRows(Math.ceil(items.length / this.cols));
    this.scrollAnimator?.cancel();
    if (resetCursor || this.cursor >= this.rows * this.cols) {
      this.setScrollCursor(0, 0, false);
    }
    this.refreshAll();
  }

  /** Reset scrolling + cursor position and remove the cursor visual. */
  public reset(): void {
    this.setScrollCursor(0, 0, false);
    this.lastSelected = null;
    if (this.cursorObj) {
      this.cursorObj.destroy();
      this.cursorObj = null;
    }
  }

  public setCursorVisible(visible: boolean): void {
    this.cursorObj?.setVisible(visible);
  }

  /**
   * Process keyboard input.
   * @returns `true` if the input was consumed
   */
  public processInput(button: Button): boolean {
    if (button === Button.ACTION) {
      return this.processActionInput();
    }

    if (this.items.length === 0) {
      return false;
    }

    const scrollCursor = this.scrollBar?.getCurrentRow() ?? 0;
    const onScreenRows = Math.min(this.rows, Math.ceil(this.items.length / this.cols));
    const maxScrollCursor = Math.max(0, Math.ceil(this.items.length / this.cols) - onScreenRows);
    const currentRowIndex = Math.floor(this.cursor / this.cols);
    const currentColumnIndex = this.cursor % this.cols;
    const itemOffset = scrollCursor * this.cols;
    const lastVisibleIndex = Math.min(this.items.length - 1, this.items.length - maxScrollCursor * this.cols - 1);

    switch (button) {
      case Button.UP:
        return this.processUpInput(scrollCursor, maxScrollCursor, currentRowIndex, onScreenRows, lastVisibleIndex);
      case Button.DOWN:
        return this.processDownInput(scrollCursor, maxScrollCursor, currentRowIndex, onScreenRows, itemOffset);
      case Button.LEFT:
        return this.processLeftInput(
          scrollCursor,
          maxScrollCursor,
          currentRowIndex,
          currentColumnIndex,
          onScreenRows,
          lastVisibleIndex,
        );
      case Button.RIGHT:
        return this.processRightInput(currentColumnIndex, itemOffset);
    }
    return false;
  }

  /**
   * Convert a pointer position (local to the cells container) to a cell slot index,
   * or `null` if the position is outside the grid or over an empty slot.
   */
  private pointerToSlot(localX: number, localY: number): number | null {
    if (this.isScrolling()) {
      return null;
    }

    const col = Math.floor(localX / this.config.cells.spacingX);
    const row = Math.floor(localY / this.config.cells.spacingY);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }

    const slot = row * this.cols + col;
    if (slot + this.getItemOffset() >= this.items.length) {
      return null;
    }

    return slot;
  }

  /**
   * Set whether this grid should be accepting touch input.
   */
  public setTouchEnabled(enabled: boolean): void {
    this.touchEnabled = enabled;
  }

  /**
   * Event handler to run when the pointer (mouse or touch) is hovered over a cell.
   */
  private handlePointerMove(localX: number, localY: number): void {
    if (!this.touchEnabled) {
      return;
    }
    const slot = this.pointerToSlot(localX, localY);
    if (slot !== null && slot !== this.cursor) {
      this.setCursor(slot);
    }
  }

  /**
   * Event handler to run when the pointer is clicked/pressed on a cell.
   */
  private handlePointerDown(localX: number, localY: number): void {
    if (!this.touchEnabled) {
      return;
    }
    const slot = this.pointerToSlot(localX, localY);
    if (slot === null) {
      return;
    }
    if (slot === this.cursor) {
      this.processActionInput();
    } else {
      this.setCursor(slot);
    }
  }

  /**
   * Called on action input, runs the on action callback if one was provided.
   * @returns `true` if the callback was called
   */
  private processActionInput(): boolean {
    if (!this.config.onItemActioned || this.items.length === 0) {
      return false;
    }
    const absIndex = this.cursor + this.getItemOffset();
    if (absIndex >= this.items.length) {
      return false;
    }
    this.config.onItemActioned(this.cells[this.cursor], this.items[absIndex]);
    return true;
  }

  /**
   * @returns The offset from relative index to absolute index for an item given the scroll amount
   */
  private getItemOffset(): number {
    return (this.scrollBar?.getCurrentRow() ?? 0) * this.cols;
  }

  /**
   * Render cells for each visible item; hide any unoccupied cells.
   *
   * @param scrollRow - Optional row to render from instead of the scrollbar's position.
   * Used when snapping a slide to render at the intermediate row the slide was heading toward.
   */
  private renderGrid(scrollRow?: number): void {
    const row = scrollRow ?? this.getScrollRow();
    const offset = row * this.cols;
    // Remember what the cells show, so a later scroll knows how far it has to travel
    this.renderedRow = row;
    this.lastSelected = null;
    const visible = this.items.slice(offset, offset + this.cells.length);
    visible.forEach((data, i) => {
      this.cells[i].setVisible(true);
      this.config.cells.renderCell(this.cells[i], data);
    });
    for (let i = visible.length; i < this.cells.length; i++) {
      this.cells[i].setVisible(false);
    }
  }

  /**
   * Render a single row's worth of items into the given cells, hiding any cell left without data.
   * Used by the scroll animation to draw the row sliding into view.
   *
   * @param cells - The cells making up the row, ordered left to right
   * @param startIndex - Absolute index of the item belonging in the first cell
   */
  private renderRow(cells: TCell[], startIndex: number): void {
    cells.forEach((cell, i) => {
      const data = this.items[startIndex + i];
      cell.setVisible(data !== undefined);
      if (data !== undefined) {
        this.config.cells.renderCell(cell, data);
      }
    });
  }

  public updateCursorConfig(config: CursorConfig): void {
    this.config.cursor = config;
    this.updateCursorVisual();
  }

  /** @returns Whether the existing cursor object already uses the given corner sizes */
  private cursorMatchesSlice(slice: { left: number; right: number; top: number; bottom: number }): boolean {
    const obj = this.cursorObj;
    if (!(obj instanceof Phaser.GameObjects.NineSlice)) {
      return false;
    }
    return (
      obj.leftWidth === slice.left
      && obj.rightWidth === slice.right
      && obj.topHeight === slice.top
      && obj.bottomHeight === slice.bottom
    );
  }

  private sliceFromConfig(cfg: CursorConfig): { left: number; right: number; top: number; bottom: number } {
    if (typeof cfg.slice === "number") {
      return { left: cfg.slice, right: cfg.slice, top: cfg.slice, bottom: cfg.slice };
    }

    return {
      left: cfg.slice?.left ?? 1,
      right: cfg.slice?.right ?? 1,
      top: cfg.slice?.top ?? 1,
      bottom: cfg.slice?.bottom ?? 1,
    };
  }

  /**
   * Update the location of the cursor based on its current location, creating a new texture if one doesn't exist.
   */
  private updateCursorVisual(): void {
    if (this.items.length === 0) {
      if (this.cursorObj) {
        this.cursorObj.setVisible(false);
      }
      return;
    }
    const cfg = this.config.cursor ?? { texture: "select_cursor_highlight", width: 16, height: 16 };
    // Fall back to the texture's native frame dimensions, matching how a plain Image would render
    const sourceFrame = globalScene.textures.get(cfg.texture).get();
    const width = cfg.width ?? sourceFrame.width;
    const height = cfg.height ?? sourceFrame.height;
    const slice = this.sliceFromConfig(cfg);

    // Rebuild cursor if any portion has changed
    if (
      !this.cursorObj
      || this.cursorObj.texture.key !== cfg.texture
      || this.cursorObj.width !== width
      || this.cursorObj.height !== height
      || !this.cursorMatchesSlice(slice)
    ) {
      this.cursorObj?.destroy();
      this.cursorObj = globalScene.add
        .nineslice(0, 0, cfg.texture, undefined, width, height, slice.left, slice.right, slice.top, slice.bottom)
        .setOrigin(0);
      this.cellsContainer.add(this.cursorObj);
      if (cfg.behindCells) {
        this.cellsContainer.sendToBack(this.cursorObj);
      }
    }

    const cell = this.cells[this.cursor];
    this.cursorObj.setVisible(true);
    this.cursorObj.setPosition(cell.x + (cfg.offsetX ?? 0), cell.y + (cfg.offsetY ?? 0));
  }

  /**
   * Run the `onItemSelected` callback for the selected item,
   * passing the previously highlighted cell where one is still meaningful.
   */
  private notifySelection(): void {
    if (!this.config.onItemSelected || this.items.length === 0) {
      return;
    }
    const absIndex = this.cursor + this.getItemOffset();
    if (absIndex >= this.items.length) {
      return;
    }
    const cell = this.cells[this.cursor];
    const last = this.lastSelected;
    const previous =
      last && last.cell !== cell && last.index < this.items.length
        ? { cell: last.cell, data: this.items[last.index] }
        : undefined;
    this.lastSelected = { cell, index: absIndex };
    this.config.onItemSelected(cell, this.items[absIndex], previous);
  }

  /**
   * Refresh all grid elements.
   */
  private refreshAll(): void {
    this.renderGrid();
    this.updateCursorVisual();
    this.updateScrollIndicator();
    this.notifySelection();
  }

  /**
   * Bring the grid in line with the scroll bar's current row, sliding the cells when a
   * {@linkcode ScrollableGridConfig.scrollTween} is configured and the row changed by exactly one.
   *
   * @param animate - Whether the change may be animated; `false` always redraws instantly
   */
  private applyScroll(animate = true): void {
    if (animate && this.isScrolling()) {
      this.scrollAnimator?.snap();
      this.renderGrid(this.slideTargetRow);
    }

    const newRow = this.getScrollRow();
    const delta = animate ? newRow - this.renderedRow : 0;
    if (!this.config.scrollTween || !this.scrollAnimator || Math.abs(delta) !== 1) {
      this.scrollAnimator?.cancel();
      this.refreshAll();
      return;
    }

    const incomingRow = delta > 0 ? newRow + this.rows - 1 : newRow;
    const tweenCfg = this.config.scrollTween;
    this.scrollBar?.tweenHandle(this.renderedRow, tweenCfg.duration, tweenCfg.ease ?? "Sine.easeInOut");

    this.slideTargetRow = newRow;
    this.updateCursorVisual();
    this.scrollAnimator.slide(delta > 0 ? 1 : -1, incomingRow * this.cols);
    this.updateScrollIndicator();
    this.notifySelection();
  }

  /**
   * Show/hide the scrollbar based on the current scroll state.
   * If all items fit without scrolling, all indicators are hidden regardless of mode.
   */
  private updateScrollIndicator(): void {
    const totalCellSlots = this.rows * this.cols;
    const needsScroll = this.items.length > totalCellSlots;
    this.scrollBar?.setVisible(needsScroll);
  }

  /**
   * Callback to handle a row change notification from the ScrollBar.
   * @param newRow - The new scrolled row
   */
  private handleScrollChange(newRow: number): void {
    const itemOffset = newRow * this.cols;
    const maxCursor = Math.min(this.cursor, this.items.length - itemOffset - 1);
    if (maxCursor !== this.cursor) {
      this.cursor = maxCursor;
    }
    // Dragging the scroll bar is direct manipulation: the cells track the handle instantly
    // instead of lagging a slide behind it
    this.applyScroll(false);
  }

  /**
   * Set the cursor to the given relative location.
   * @param cursor - The new location for the cursor
   * @returns If the cursor actually moved (i.e. if the new location is different)
   */
  public setCursor(cursor: number): boolean {
    if (cursor === this.cursor) {
      return false;
    }
    this.cursor = cursor;
    this.updateCursorVisual();
    this.notifySelection();
    return true;
  }

  /**
   * @param scrollCursor - The row to scroll to
   * @param cursor - If given, the new relative cursor location
   * @param animate - Whether the scroll may be animated, if the grid was configured for it
   */
  private setScrollCursor(scrollCursor: number, cursor?: number, animate = true): boolean {
    if (cursor !== undefined) {
      this.cursor = cursor;
    }
    if (this.items.length > 0) {
      const maxCursor = this.items.length - scrollCursor * this.cols - 1;
      this.cursor = Phaser.Math.Clamp(this.cursor, 0, maxCursor);
    }
    this.silentScroll = true;
    this.scrollBar?.setScrollCursor(scrollCursor);
    this.silentScroll = false;
    this.applyScroll(animate);
    return true;
  }

  private processUpInput(
    scrollCursor: number,
    maxScrollCursor: number,
    currentRowIndex: number,
    onScreenRows: number,
    lastVisibleIndex: number,
  ): boolean {
    if (currentRowIndex > 0) {
      return this.setCursor(this.cursor - this.cols);
    }
    if (scrollCursor > 0) {
      return this.setScrollCursor(scrollCursor - 1);
    }
    if (this.config.onExitTop) {
      this.config.onExitTop();
      return true;
    }
    if (!this.wrap) {
      return false;
    }
    let newCursor = this.cursor + (onScreenRows - 1) * this.cols;
    if (newCursor > lastVisibleIndex) {
      newCursor -= this.cols;
    }
    return this.setScrollCursor(maxScrollCursor, newCursor);
  }

  private processDownInput(
    scrollCursor: number,
    maxScrollCursor: number,
    currentRowIndex: number,
    onScreenRows: number,
    itemOffset: number,
  ): boolean {
    if (currentRowIndex < onScreenRows - 1) {
      return this.setCursor(Math.min(this.cursor + this.cols, this.items.length - itemOffset - 1));
    }
    if (scrollCursor < maxScrollCursor) {
      return this.setScrollCursor(scrollCursor + 1);
    }
    if (this.config.onExitBottom) {
      this.config.onExitBottom();
      return true;
    }
    if (!this.wrap) {
      return false;
    }
    return this.setScrollCursor(0, this.cursor % this.cols);
  }

  private processLeftInput(
    scrollCursor: number,
    maxScrollCursor: number,
    currentRowIndex: number,
    currentColumnIndex: number,
    onScreenRows: number,
    lastVisibleIndex: number,
  ): boolean {
    if (currentColumnIndex > 0) {
      return this.setCursor(this.cursor - 1);
    }
    if (this.config.onExitLeft) {
      this.config.onExitLeft();
      return true;
    }
    if (!this.wrap) {
      return false;
    }
    if (scrollCursor === maxScrollCursor && currentRowIndex === onScreenRows - 1) {
      return this.setCursor(lastVisibleIndex);
    }
    return this.setCursor(this.cursor + this.cols - 1);
  }

  private processRightInput(currentColumnIndex: number, itemOffset: number): boolean {
    if (currentColumnIndex < this.cols - 1 && this.cursor + itemOffset < this.items.length - 1) {
      return this.setCursor(this.cursor + 1);
    }
    if (this.config.onExitRight) {
      this.config.onExitRight();
      return true;
    }
    if (!this.wrap) {
      return false;
    }
    return this.setCursor(this.cursor - currentColumnIndex);
  }

  /**
   * Focus the grid, re-enabling the cursor and notifying the current selection
   * @param cursor - Optional new location for the cursor
   */
  public focus(cursor?: number): void {
    if (cursor !== undefined) {
      this.cursor = cursor;
    }
    this.updateCursorVisual();
    this.notifySelection();
  }

  /**
   * "Unfocus" the grid by hiding the cursor
   */
  public unfocus(): void {
    if (this.cursorObj) {
      this.cursorObj.setVisible(false);
    }
  }

  /**
   * @returns The total number of items in the grid (which may be more or less than rows * cols)
   */
  public getItemCount(): number {
    return this.items.length;
  }

  // todo this is provided for migration simplicity but will ideally be removed eventually
  public getCursor(): number {
    return this.cursor;
  }

  public hasDimensions(rows: number, cols: number) {
    return this.rows === rows && this.cols === cols;
  }

  /**
   * @returns The first visible row index (0 when not scrolled).
   */
  public getScrollRow(): number {
    return this.scrollBar?.getCurrentRow() ?? 0;
  }

  /**
   * @returns Whether a scroll animation is currently running.
   */
  public isScrolling(): boolean {
    return this.scrollAnimator?.isSliding ?? false;
  }

  public override destroy(fromScene?: boolean): void {
    this.scrollAnimator?.destroy();
    this.scrollAnimator = null;
    super.destroy(fromScene);
  }
}
