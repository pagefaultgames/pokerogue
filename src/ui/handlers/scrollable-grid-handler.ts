import { Button } from "#enums/buttons";
import type { ScrollBar } from "#ui/containers/scroll-bar";
import type { UiHandler } from "#ui/handlers/ui-handler";

type UpdateGridCallbackFunction = () => void;
type UpdateDetailsCallbackFunction = (index: number) => void;

/**
 * A helper class to handle navigation through a grid of elements that can scroll vertically
 * Needs to be used by a {@linkcode UiHandler}
 * How to use:
 * - in `UiHandler.setup`: Initialize with the {@linkcode UiHandler} that handles the grid,
 * the number of rows and columns that can be shown at once,
 * an optional {@linkcode ScrollBar}, and optional callbacks that will get called after scrolling
 * - in `UiHandler.show`: Set `setTotalElements` to the total number of elements in the list to display
 * - in `UiHandler.processInput`: call `processNavigationInput` to have it handle the cursor updates while calling the defined callbacks
 * - in `UiHandler.clear`: call `reset`
 */
export class ScrollableGridUiHandler {
  private readonly ROWS: number;
  private readonly COLUMNS: number;
  private handler: UiHandler;
  private totalElements: number;
  private cursor: number;
  private scrollCursor: number;
  private scrollBar?: ScrollBar;
  /** Optional function that will get called if the whole grid needs to get updated */
  private updateGridCallback?: UpdateGridCallbackFunction;
  /** Optional function that will get called if a single element's information needs to get updated */
  private updateDetailsCallback?: UpdateDetailsCallbackFunction;

  /**
   * @param rows the maximum number of rows shown at once
   * @param columns the maximum number of columns shown at once
   */
  constructor(handler: UiHandler, rows: number, columns: number) {
    this.handler = handler;
    this.ROWS = rows;
    this.COLUMNS = columns;
    this.scrollCursor = 0;
    this.cursor = 0;
    this.totalElements = rows * columns; // default value for the number of elements
  }

  /**
   * Set a scrollBar to get updated with the scrolling
   * @param scrollBar {@linkcode ScrollBar}
   * @returns this
   */
  withScrollBar(scrollBar: ScrollBar): ScrollableGridUiHandler {
    this.scrollBar = scrollBar;
    this.scrollBar.setTotalRows(Math.ceil(this.totalElements / this.COLUMNS));
    return this;
  }

  /**
   * Set function that will get called if the whole grid needs to get updated
   * @param callback {@linkcode UpdateGridCallbackFunction}
   * @returns this
   */
  withUpdateGridCallBack(callback: UpdateGridCallbackFunction): ScrollableGridUiHandler {
    this.updateGridCallback = callback;
    return this;
  }

  /**
   * Set function that will get called if a single element in the grid needs to get updated
   * @param callback {@linkcode UpdateDetailsCallbackFunction}
   * @returns this
   */
  withUpdateSingleElementCallback(callback: UpdateDetailsCallbackFunction): ScrollableGridUiHandler {
    this.updateDetailsCallback = callback;
    return this;
  }

  /**
   * @param totalElements the total number of elements that the grid needs to display
   */
  setTotalElements(totalElements: number) {
    this.totalElements = totalElements;
    if (this.scrollBar) {
      this.scrollBar.setTotalRows(Math.ceil(this.totalElements / this.COLUMNS));
    }
    this.setScrollCursor(0);
  }

  /**
   * @returns how many elements are hidden due to scrolling
   */
  getItemOffset(): number {
    return this.scrollCursor * this.COLUMNS;
  }

  /**
   * Update the cursor and scrollCursor based on user input
   * @param button the button that was pressed
   * @returns `true` if either the cursor or scrollCursor was updated
   */
  processInput(button: Button): boolean {
    let success = false;
    const onScreenRows = Math.min(this.ROWS, Math.ceil(this.totalElements / this.COLUMNS));
    const maxScrollCursor = Math.max(0, Math.ceil(this.totalElements / this.COLUMNS) - onScreenRows);
    const currentRowIndex = Math.floor(this.cursor / this.COLUMNS);
    const currentColumnIndex = this.cursor % this.COLUMNS;
    const itemOffset = this.scrollCursor * this.COLUMNS;
    const lastVisibleIndex = Math.min(this.totalElements - 1, this.totalElements - maxScrollCursor * this.COLUMNS - 1);
    switch (button) {
      case Button.UP:
        if (currentRowIndex > 0) {
          success = this.setCursor(this.cursor - this.COLUMNS);
        } else if (this.scrollCursor > 0) {
          success = this.setScrollCursor(this.scrollCursor - 1);
        } else {
          // wrap around to the last row
          let newCursor = this.cursor + (onScreenRows - 1) * this.COLUMNS;
          if (newCursor > lastVisibleIndex) {
            newCursor -= this.COLUMNS;
          }
          success = this.setScrollCursor(maxScrollCursor, newCursor);
        }
        break;
      case Button.DOWN:
        if (currentRowIndex < onScreenRows - 1) {
          // Go down one row
          success = this.setCursor(Math.min(this.cursor + this.COLUMNS, this.totalElements - itemOffset - 1));
        } else if (this.scrollCursor < maxScrollCursor) {
          // Scroll down one row
          success = this.setScrollCursor(this.scrollCursor + 1);
        } else {
          // Wrap around to the top row
          success = this.setScrollCursor(0, this.cursor % this.COLUMNS);
        }
        break;
      case Button.LEFT:
        if (currentColumnIndex > 0) {
          success = this.setCursor(this.cursor - 1);
        } else if (this.scrollCursor === maxScrollCursor && currentRowIndex === onScreenRows - 1) {
          success = this.setCursor(lastVisibleIndex);
        } else {
          success = this.setCursor(this.cursor + this.COLUMNS - 1);
        }
        break;
      case Button.RIGHT:
        if (currentColumnIndex < this.COLUMNS - 1 && this.cursor + itemOffset < this.totalElements - 1) {
          success = this.setCursor(this.cursor + 1);
        } else {
          success = this.setCursor(this.cursor - currentColumnIndex);
        }
        break;
    }
    return success;
  }

  /**
   * Reset the scrolling
   */
  reset(): void {
    this.setScrollCursor(0);
    this.setCursor(0);
  }

  private setCursor(cursor: number): boolean {
    this.cursor = cursor;
    return this.handler.setCursor(cursor);
  }

  private setScrollCursor(scrollCursor: number, cursor?: number): boolean {
    const scrollChanged = scrollCursor !== this.scrollCursor;

    // update the scrolling cursor
    if (scrollChanged) {
      this.scrollCursor = scrollCursor;
      if (this.scrollBar) {
        this.scrollBar.setScrollCursor(scrollCursor);
      }
      if (this.updateGridCallback) {
        this.updateGridCallback();
      }
    }

    let cursorChanged = false;
    const newElementIndex = this.cursor + this.scrollCursor * this.COLUMNS;
    if (cursor !== undefined) {
      cursorChanged = this.setCursor(cursor);
    } else if (newElementIndex >= this.totalElements) {
      // make sure the cursor does not go past the end of the list
      cursorChanged = this.setCursor(this.totalElements - this.scrollCursor * this.COLUMNS - 1);
    } else if (scrollChanged && this.updateDetailsCallback) {
      // scroll was changed but not the normal cursor, update the selected element
      this.updateDetailsCallback(newElementIndex);
    }

    return scrollChanged || cursorChanged;
  }
}
