/**
 * Minimum type signature for a grid cell to behave
 */
export type GridCell = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform &
  Phaser.GameObjects.Components.Visible;

export interface CursorConfig {
  texture: string;
  width?: number;
  height?: number;
  /** Nineslice corner sizes (px) */
  slice?: number | { left?: number; right?: number; top?: number; bottom?: number };
  /** Horizontal pixel offset from the cell's top-left where the cursor is drawn */
  offsetX?: number;
  /** Vertical pixel offset from the cell's top-left where the cursor is drawn */
  offsetY?: number;
  behindCells?: boolean;
}

/** Configuration for animating scroll position changes by sliding the cells */
export interface ScrollTweenConfig {
  /** Duration of a single-row slide, in ms */
  duration: number;
  /** Phaser ease used for the slide; defaults to `Sine.easeInOut` */
  ease?: string;
}

export interface ScrollableGridConfig<TCell extends GridCell, TData> {
  /** Maximum number of rows shown at once (not necessarily the total number of rows) */
  rows: number;
  /** Total number of columns */
  columns: number;

  /** Scroll bar config local to the grid container */
  scrollBar?: {
    /** X offset from the right end of the grid */
    offsetX?: number;
    /** Y offset from the top of the grid */
    offsetY?: number;
    width: number;
    height: number;
  };

  /** Cell grid configuration */
  cells: {
    /** horizontal pixel distance between adjacent cells */
    spacingX: number;
    /** vertical pixel distance between adjacent cells */
    spacingY: number;
    /** Factory used to create each cell */
    createCell: () => TCell;
    /**
     * Called whenever a cell must render the given data.
     *
     * Cells are recycled, so this method must be idempotent
     * and avoid leaving stale data between calls.
     */
    renderCell: (cell: TCell, data: TData) => void;
  };

  /** Add extra spacing to the right of given cells */
  extraSpacingHorizontal?: Map<number, number>;

  /** Selection cursor configuration. Defaults to `select_cursor_highlight` at 16×16. */
  cursor?: CursorConfig | undefined;

  /**
   * Called whenever the highlighted item changes (cursor move, scroll, hover, {@linkcode setItems}, etc.).
   * Provides access to the currently-selected item and the previously-selected item, if it exists.
   * If e.g. the grid was just reset, `previous` may be `undefined`.
   */
  onItemSelected?: ((cell: TCell, data: TData, previous?: { cell: TCell; data: TData }) => void) | undefined;

  /**
   * Called when the user presses {@linkcode Button.ACTION} or clicks the currently highlighted cell.
   *
   * Note that the grid helper does not itself intercept input. For this callback to fire,
   * the UI handler must pass action input to the grid as with navigation.
   */
  onItemActioned?: ((cell: TCell, data: TData) => void) | undefined;

  /**
   * If set, scroll changes of a single row slide the cells into place instead of snapping them.
   * Wrapping and scrollbar dragging stay instant regardless.
   */
  scrollTween?: ScrollTweenConfig | undefined;

  /**
   * Whether the grid will wrap around upon navigating past the edges.
   * If any exit callbacks are specified in the config, they will disable wrapping for the specified direction(s).
   */
  wrap?: boolean;

  /**
   * Called when the cursor would exit the grid to the left.
   * @remarks
   * Used to allow for easy composition with other UI elements.
   */
  onExitLeft?: () => void;

  /**
   * Called when the cursor would exit the grid to the right.
   * @remarks
   * Used to allow for easy composition with other UI elements.
   */
  onExitRight?: () => void;

  /**
   * Called when the cursor would exit the grid to the top, to allow composition
   * @remarks
   * Used to allow for easy composition with other UI elements.
   */
  onExitTop?: () => void;

  /**
   * Called when the cursor would exit the grid to the bottom, to allow composition
   * @remarks
   * Used to allow for easy composition with other UI elements.
   */
  onExitBottom?: () => void;
}

/**
 * Configuration {@linkcode GridScrollAnimator} needs from the grid it animates.
 * Everything is expressed in cell coordinates, so the animator never has to know about
 * items, cursors or scroll bars.
 */
export interface GridScrollAnimatorConfig<TCell extends GridCell> {
  /** Viewport and container of cells to move */
  cellContainer: Phaser.GameObjects.Container;
  rows: number;
  cols: number;
  spacingY: number;
  /** Area the cells are clipped to while sliding, local to {@linkcode cellContainer} */
  clip: { x: number; y: number; width: number; height: number };
  tween: ScrollTweenConfig;
  /** Factory for the extra row of cells, i.e. the grid's own cell factory */
  createCell: () => TCell;
  /** x position of the cell in the given column, mirrored from the grid's first row */
  columnX: (col: number) => number;
  /** Render one row of items, starting at the given absolute item index, into the given cells */
  renderRow: (cells: TCell[], startIndex: number) => void;
  /** Redraw the grid for the scroll row the finished slide arrived at */
  commit: () => void;
}

/** Minimum type signature for an object that can ride a scroll slide (e.g. a cursor) */
export type SlideRider = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform &
  Phaser.GameObjects.Components.Mask;
