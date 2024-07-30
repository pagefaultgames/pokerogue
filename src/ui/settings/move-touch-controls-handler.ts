import TouchControl from "#app/touch-controls.js";
import UI from "#app/ui/ui.js";
import { Scene } from "phaser";

export const TOUCH_CONTROL_POSITIONS_LANDSCAPE = "touchControlPositionsLandscape";
export const TOUCH_CONTROL_POSITIONS_PORTRAIT = "touchControlPositionsPortrait";

type ControlPosition = { id: string, x: number, y: number };

type ConfigurationEventListeners = {
  "touchstart": EventListener[]
  "touchmove": EventListener[]
  "touchend": EventListener[]
};

type ToolbarRefs = {
  toolbar: HTMLDivElement,
  saveButton: HTMLDivElement
  resetButton: HTMLDivElement
  cancelButton: HTMLDivElement
};

/**
 * Handles the dragging of touch controls around the screen.
 */
export default class MoveTouchControlsHandler {

  /** The element that is currently being dragged */
  private draggingElement: HTMLElement | null = null;

  /**
   * Whether the user is currently configuring the touch controls.
   * When this is true, the touch controls can be dragged around the screen and the controls of the game are disabled.
   */
  public inConfigurationMode: boolean;

  /**
   * The event listeners for the configuration mode.
   * These are used to remove the event listeners when the configuration mode is disabled.
   */
  private configurationEventListeners: ConfigurationEventListeners = {
    "touchstart": [],
    "touchmove": [],
    "touchend": []
  };

  private overlay: Phaser.GameObjects.Container;

  private isLandscapeMode: boolean = this.getScreenSize().width > this.getScreenSize().height;
  private touchControls: TouchControl;

  constructor(touchControls: TouchControl) {
    this.touchControls = touchControls;
    this.inConfigurationMode = false;
    this.setPositions(this.getSavedPositionsOfCurrentOrientation() ?? []);
    this.initToolbar();
    window.addEventListener("resize", (event) => {
      const screenSize = this.getScreenSize();
      if (screenSize.width > screenSize.height !== this.isLandscapeMode) {
        this.changeOrientation(screenSize.width > screenSize.height);
      }
    });
  }

  /**
   * Changes the state of the touch controls to the given orientation.
   * @param isLandscapeMode Whether the screen is in landscape mode.
   */
  private async changeOrientation(isLandscapeMode: boolean) {
    this.isLandscapeMode = isLandscapeMode;
    document
      .querySelector("#touchControls #orientation")
      .textContent = this.isLandscapeMode? "Landscape" : "Portrait";

    const positions = this.getSavedPositionsOfCurrentOrientation() ?? [];
    this.setPositions(positions);
  }

  private getScreenSize() {
    return { width: window.screen.width, height: window.screen.height };
  }

  /**
   * Initializes the toolbar of the configuration mode.
   */
  private initToolbar() {
    const refs = this.getConfigToolbarRefs();
    if (!refs) {
      return;
    }
    const { saveButton, resetButton, cancelButton } = refs;

    saveButton.addEventListener("click", () => {
      this.saveCurrentPositions();
      this.disableConfigurationMode();
    });
    resetButton.addEventListener("click", () => {
      this.resetPositions();
    });
    cancelButton.addEventListener("click", () => {
      const positions = this.getSavedPositionsOfCurrentOrientation();
      this.setPositions(positions);
      this.disableConfigurationMode();
    });
  }

  /**
   * Returns the references to the elements of the configuration toolbar.
   * @returns The references to the elements of the configuration toolbar
   *          or undefined if the elements can not be found (e.g. during tests)
   */
  private getConfigToolbarRefs(): ToolbarRefs | undefined {
    const toolbar = document.querySelector("#touchControls #configToolbar") as HTMLDivElement;
    if (!toolbar) {
      return;
    }
    return {
      toolbar,
      saveButton: toolbar.querySelector("#saveButton"),
      resetButton: toolbar.querySelector("#resetButton"),
      cancelButton: toolbar.querySelector("#cancelButton")
    };
  }

  /**
   * Elements that are inside the left div are anchored to the left boundary of the screen.
   * The x value of the positions are considered offsets to their respective boundaries.
   * @param element Either an element in the left div or the right div.
   * @returns Whether the given element is inside the left div.
   */
  private isLeft = (element: HTMLElement) => document.querySelector("#touchControls .left").contains(element);

  /**
   * Start dragging the given button.
   * @param controlGroup The button that is being dragged.
   * @param touch The touch event that started the drag.
   */
  private startDrag = (controlGroup: HTMLElement): void => {
    this.draggingElement = controlGroup;
  };

  /**
   * Drags the currently dragged element to the given touch position.
   * @param touch The touch event that is currently happening.
   * @param isLeft Whether the dragged element is a left button.
   */
  private drag = (touch: Touch): void => {
    if (!this.draggingElement) {
      return;
    }
    const rect = this.draggingElement.getBoundingClientRect();
    // Map the touch position to the center of the dragged element.
    const xOffset = this.isLeft(this.draggingElement) ? touch.clientX - rect.width / 2 : window.innerWidth - touch.clientX - rect.width / 2;
    const yOffset = window.innerHeight - touch.clientY - rect.height / 2;
    this.setPosition(this.draggingElement, xOffset, yOffset);
  };

  /**
   * Stops dragging the currently dragged element.
   */
  private stopDrag = () => {
    this.draggingElement = null;
  };

  /**
   * Returns the current positions of all touch controls that have moved from their default positions of this orientation.
   * @returns {ControlPosition[]} The current positions of all touch controls that have moved from their default positions of this orientation
   */
  private getModifiedCurrentPositions(): ControlPosition[] {
    return this.getControlGroupElements()
      .filter((controlGroup: HTMLElement) => controlGroup.style.right || controlGroup.style.left)
      .map((controlGroup: HTMLElement) => {
        return {
          id: controlGroup.id,
          x: parseFloat(this.isLeft(controlGroup) ? controlGroup.style.left : controlGroup.style.right),
          y: parseFloat(controlGroup.style.bottom),
        };
      });
  }

  /**
   * Returns the key of the local storage for the control positions data of this orientation
   */
  private getLocalStorageKey(): string {
    return this.isLandscapeMode ? TOUCH_CONTROL_POSITIONS_LANDSCAPE : TOUCH_CONTROL_POSITIONS_PORTRAIT;
  }

  /**
   * Returns the saved positions of the touch controls.
   * Filters result by the given orientation.
   * @returns The saved positions of the touch controls of this orientation
   */
  private getSavedPositionsOfCurrentOrientation(): ControlPosition[] {
    const positions = localStorage.getItem(this.getLocalStorageKey());
    if (!positions) {
      return [];
    }
    return JSON.parse(positions) as ControlPosition[];
  }

  /**
   * Saves the current positions of the touch controls to the local storage.
   */
  private saveCurrentPositions() {
    const pos = this.getModifiedCurrentPositions();
    localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(pos));
  }

  /**
   * Updates the positions of the touch controls.
   * @param positions The new positions of the touch controls.
   */
  private setPositions(positions: ControlPosition[]) {
    this.resetPositions();
    return positions.forEach((pos: ControlPosition) => {
      const controlGroup = document.querySelector(`#${pos.id}`) as HTMLElement;
      this.setPosition(controlGroup, pos.x, pos.y);
    });
  }

  /**
   * Sets a control element to the given position.
   * The x values are either offsets to the left or right boundary of the screen, depending on the side of the element.
   * E.g. For left elements, (0, 0) is the bottom left corner of the screen and
   * for right elements, (0, 0) is the bottom right corner of the screen.
   * @param controlElement
   * @param x Either an offset to the left or right boundary of the screen.
   * @param y An offset to the bottom boundary of the screen.
   */
  private setPosition(controlElement: HTMLElement, x: number, y: number) {
    const rect = controlElement.getBoundingClientRect();
    const checkBound = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    const { height, width } = this.getScreenSize();
    x = checkBound(x, 0, width - rect.width);
    y = checkBound(y, 0, height - rect.height);
    if (this.isLeft(controlElement)) {
      controlElement.style.left = `${x}px`;
    } else {
      controlElement.style.right = `${x}px`;
    }
    controlElement.style.bottom = `${y}px`;
  }

  /**
   * Resets the positions of the touch controls to their default positions and clears the saved positions.
   * Does not save the changes.
   */
  private resetPositions() {
    this.getControlGroupElements().forEach((controlGroup: HTMLDivElement) => {
      controlGroup.style.removeProperty("left");
      controlGroup.style.removeProperty("right");
      controlGroup.style.removeProperty("bottom");
    });
  }

  /**
   * Returns all control groups of the touch controls.
   * These are groups of buttons that can be dragged around the screen.
   * @returns All control groups of the touch controls.
   */
  private getControlGroupElements(): HTMLDivElement[] {
    return [...document.querySelectorAll("#touchControls .control-group")] as HTMLDivElement[];
  }

  /**
   * Creates the event listeners for the configuration mode.
   * @param controlGroups The elements that can be dragged around the screen.
   * @returns The event listeners for the configuration mode.
   */
  private createConfigurationEventListeners(controlGroups: HTMLDivElement[]): ConfigurationEventListeners {
    return {
      "touchstart": controlGroups.map((element: HTMLDivElement) => {
        const startDrag = () => this.startDrag(element);
        element.addEventListener("touchstart", startDrag, { passive: true });
        return startDrag;
      }),
      "touchmove": controlGroups.map(() => {
        const drag = (event) => this.drag(event.touches[0]);
        window.addEventListener("touchmove", drag, { passive: true });
        return drag;
      }),
      "touchend": controlGroups.map(() => {
        const stopDrag = () => this.stopDrag();
        window.addEventListener("touchend", stopDrag, { passive: true });
        return stopDrag;
      })
    };
  }

  /**
   * Creates an overlay that covers the screen and allows the user to drag the touch controls around.
   * Also enables the toolbar for saving, resetting, and canceling the changes.
   * @param ui The UI of the game.
   * @param scene The scene of the game.
   */
  private createOverlay(ui: UI, scene: Scene) {
    const container = new Phaser.GameObjects.Container(scene, 0, 0);
    const overlay = new Phaser.GameObjects.Rectangle(scene, 0, 0, scene.game.canvas.width, scene.game.canvas.height, 0x000000, 0.5);
    overlay.setInteractive();
    container.add(overlay);
    ui.add(container);
    this.overlay = container;

    // Display toolbar
    document.querySelector("#touchControls").classList.add("configMode");
  }

  /**
  * Allows the user to configure the touch controls by dragging buttons around the screen.
  * @param ui The UI of the game.
  * @param scene The scene of the game.
  */
  public enableConfigurationMode(ui: UI, scene: Scene) {
    if (this.inConfigurationMode) {
      return;
    }
    this.inConfigurationMode = true;

    this.touchControls.disable();
    this.createOverlay(ui, scene);
    // Create event listeners with a delay to prevent the touchstart event from being triggered immediately.
    setTimeout(() => {
      // Remember the event listeners so they can be removed later.
      this.configurationEventListeners = this.createConfigurationEventListeners(this.getControlGroupElements());
    }, 500);
  }

  /**
   * Disables the configuration mode.
   */
  public disableConfigurationMode() {
    this.inConfigurationMode = false;
    this.draggingElement = null;

    // Remove event listeners
    const { touchstart, touchmove, touchend } = this.configurationEventListeners;
    this.getControlGroupElements().forEach((element, index) => element.removeEventListener("touchstart", touchstart[index]));
    touchmove.forEach((listener) => window.removeEventListener("touchmove", listener));
    touchend.forEach((listener) => window.removeEventListener("touchend", listener));

    // Remove overlay
    this.overlay?.destroy();
    document.querySelector("#touchControls").classList.remove("configMode");
    this.touchControls.enable();
  }

}
