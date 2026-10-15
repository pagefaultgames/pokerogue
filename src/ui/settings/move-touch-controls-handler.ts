import { eventBus } from "#app/event-bus";
import { globalScene } from "#app/global-scene";
import type { TouchControl } from "#app/touch-controls";
import { isLandscapeMode } from "#utils/app-utils";
import i18next from "i18next";

type ControlPosition = { id: string; x: number; y: number };

type ConfigurationEventListeners = {
  pointerdown: EventListener[];
  pointermove: EventListener[];
  pointerup: EventListener[];
};

/** Handles the dragging of touch controls around the screen. */
export class MoveTouchControlsHandler {
  /** The element that is currently being dragged */
  private draggingElement: HTMLElement | null = null;

  /**
   * Whether the user is currently configuring the touch controls.
   *
   * When this is true, the touch controls can be dragged around the screen and the controls of the game are disabled.
   */
  private inConfigurationMode: boolean;

  /**
   * The event listeners for the configuration mode.
   *
   * These are used to remove the event listeners when the configuration mode is disabled.
   */
  private configurationEventListeners: ConfigurationEventListeners = {
    pointerdown: [],
    pointermove: [],
    pointerup: [],
  };

  private overlay: Phaser.GameObjects.Container;

  private readonly touchControls: TouchControl;

  constructor(touchControls: TouchControl) {
    this.touchControls = touchControls;
    this.inConfigurationMode = false;
    this.setPositions(this.getSavedPositionsOfCurrentOrientation() ?? []);
    this.initListeners();
  }

  public get screenSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  public get orientation(): Phaser.Scale.Orientation {
    return globalScene.scale.orientation;
  }

  public get isLandscapeMode(): boolean {
    return isLandscapeMode(globalScene);
  }

  public get localStorageKey(): string {
    return `touchControl/positions/${this.orientation}`;
  }

  public get touchControlsElements(): HTMLElement | null {
    return document.getElementById("touchControls");
  }

  public get orientationElement(): HTMLElement | null {
    return document.getElementById("orientation");
  }

  public get controlGroupElements(): HTMLElement[] {
    return [...(this.touchControlsElements?.querySelectorAll<HTMLElement>(".control-group") ?? [])];
  }

  public get configToolbarElement(): HTMLDivElement {
    return document.getElementById("configToolbar") as HTMLDivElement;
  }

  public get saveButton(): HTMLButtonElement {
    return document.getElementById("saveButton") as HTMLButtonElement;
  }

  public get resetButton(): HTMLButtonElement {
    return document.getElementById("resetButton") as HTMLButtonElement;
  }

  public get cancelButton(): HTMLButtonElement {
    return document.getElementById("cancelButton") as HTMLButtonElement;
  }

  public get leftTouchControlsElement(): HTMLElement | null | undefined {
    return this.touchControlsElements?.querySelector<HTMLElement>(".left");
  }

  public initListeners(): void {
    globalScene.scale.on("orientationchange", () => {
      this.updateOrientation();
    });

    eventBus.on("touchControls/move/start", () => {
      this.enableConfigurationMode();
    });
  }

  /** Allows the user to configure the touch controls by dragging buttons around the screen. */
  public enableConfigurationMode(): void {
    if (this.inConfigurationMode) {
      return;
    }
    this.inConfigurationMode = true;
    this.touchControls.disable();
    this.createOverlay();
    this.createToolbar();
    // Create event listeners with a delay to prevent the pointerup event from being triggered immediately.
    setTimeout(() => {
      // Remember the event listeners so they can be removed later.
      this.configurationEventListeners = this.createConfigurationEventListeners(this.controlGroupElements);
    }, 500);
  }

  public disableConfigurationMode(): void {
    this.inConfigurationMode = false;
    this.draggingElement = null;

    // Remove event listeners
    const { pointerup, pointermove, pointerdown } = this.configurationEventListeners;
    this.controlGroupElements.forEach((element, index) => element.removeEventListener("pointerup", pointerup[index]));
    pointermove.forEach(listener => window.removeEventListener("pointermove", listener));
    pointerdown.forEach(listener => window.removeEventListener("pointerdown", listener));

    // Remove configuration toolbar
    this.configToolbarElement?.remove();

    // Remove overlay
    this.overlay?.destroy();
    if (this.touchControlsElements) {
      delete this.touchControlsElements.dataset.configuring;
    }
    this.touchControls.enable();
  }

  /** Updates the positions of the touch controls based on the current screen orientation. */
  private updateOrientation(): void {
    if (this.inConfigurationMode && this.orientationElement) {
      this.orientationElement.textContent = i18next.t(`settings:${this.isLandscapeMode ? "landscape" : "portrait"}`);
    }
    const positions = this.getSavedPositionsOfCurrentOrientation() ?? [];
    this.setPositions(positions);
  }

  /**
   * Creates the toolbar element for the configuration mode.
   * @returns A new div element that contains the toolbar for the configuration mode.
   */
  private createToolbarElement(): HTMLDivElement {
    const toolbar = document.createElement("div");
    toolbar.id = "configToolbar";
    toolbar.innerHTML = `
    <div class="column">
      <div class="button-row">
        <div id="resetButton" class="button">${i18next.t("settings:touchReset")}</div>
        <div id="saveButton" class="button">${i18next.t("settings:touchSaveClose")}</div>
        <div id="cancelButton" class="button">${i18next.t("settings:touchCancel")}</div>
      </div>
      <div class="info-row">
        <div class="orientation-label">
          ${i18next.t("settings:orientation")}
          <span id="orientation">
            ${this.isLandscapeMode ? i18next.t("settings:landscape") : i18next.t("settings:portrait")}
          </span>
        </div>
      </div>
    </div>
  `;
    return toolbar;
  }

  /**
   * Initializes the toolbar of the configuration mode.
   *
   * Places its elements at the top of the touch controls and adds event listeners to them.
   */
  private createToolbar(): void {
    this.touchControlsElements?.prepend(this.createToolbarElement());

    if (!this.configToolbarElement) {
      return;
    }

    this.saveButton.addEventListener("click", () => {
      this.saveCurrentPositions();
      this.disableConfigurationMode();
      eventBus.emit("touchControls/move/save");
      eventBus.emit("touchControls/move/end");
    });
    this.resetButton.addEventListener("click", () => {
      this.resetPositions();
      eventBus.emit("touchControls/move/reset");
    });
    this.cancelButton.addEventListener("click", () => {
      const positions = this.getSavedPositionsOfCurrentOrientation();
      this.setPositions(positions);
      this.disableConfigurationMode();
      eventBus.emit("touchControls/move/cancel");
      eventBus.emit("touchControls/move/end");
    });
  }

  /**
   * Elements that are inside the left div are anchored to the left boundary of the screen.
   *
   * The x value of the positions are considered offsets to their respective boundaries.
   * @param element - Either an element in the left div or the right div.
   * @returns Whether the given element is inside the left div.
   */
  private isLeft(element: HTMLElement): boolean | undefined {
    return this.leftTouchControlsElement?.contains(element);
  }

  /**
   * Start dragging the given button.
   * @param controlGroup - The button that is being dragged.
   */
  private startDrag(controlGroup: HTMLElement): void {
    this.draggingElement = controlGroup;
  }

  /**
   * Drags the currently dragged element to the given pointer position.
   * @param event - The pointer event that is currently happening.
   */
  private drag(event: PointerEvent): void {
    if (!this.draggingElement) {
      return;
    }
    const rect = this.draggingElement.getBoundingClientRect();
    // Map the pointer position to the center of the dragged element.
    const xOffset = this.isLeft(this.draggingElement)
      ? event.clientX - rect.width / 2
      : window.innerWidth - event.clientX - rect.width / 2;
    const yOffset = window.innerHeight - event.clientY - rect.height / 2;
    this.setPosition(this.draggingElement, xOffset, yOffset);
  }

  /** Stops dragging the currently dragged element */
  private stopDrag(): void {
    this.draggingElement = null;
  }

  /**
   * @returns The current positions of all touch controls that have moved from their default positions of this orientation
   */
  private getModifiedCurrentPositions(): ControlPosition[] {
    return this.controlGroupElements
      .filter(controlGroupEl => controlGroupEl.style.right || controlGroupEl.style.left)
      .map(controlGroupEl => {
        return {
          id: controlGroupEl.id,
          x: Number.parseFloat(this.isLeft(controlGroupEl) ? controlGroupEl.style.left : controlGroupEl.style.right),
          y: Number.parseFloat(controlGroupEl.style.bottom),
        };
      });
  }

  /**
   * Returns the saved positions of the touch controls. \
   * Filters result by the given orientation.
   * @returns The saved positions of the touch controls of this orientation
   */
  private getSavedPositionsOfCurrentOrientation(): ControlPosition[] {
    const positions = localStorage.getItem(this.localStorageKey);
    if (!positions) {
      return [];
    }
    return JSON.parse(positions) as ControlPosition[];
  }

  /** Saves the current positions of the touch controls to the local storage. */
  private saveCurrentPositions(): void {
    const pos = this.getModifiedCurrentPositions();
    localStorage.setItem(this.localStorageKey, JSON.stringify(pos));
  }

  /**
   * Updates the positions of the touch controls.
   * @param positions - The new positions of the touch controls.
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
   *
   * The x values are either offsets to the left or right boundary of the screen, depending on the side of the element. \
   * E.g. For left elements, `(0, 0)` is the bottom left corner of the screen and
   * for right elements, `(0, 0)` is the bottom right corner of the screen.
   * @param controlElement - The control element being positioned
   * @param x - Either an offset to the left or right boundary of the screen.
   * @param y - An offset to the bottom boundary of the screen.
   */
  private setPosition(controlElement: HTMLElement, x: number, y: number) {
    const rect = controlElement.getBoundingClientRect();
    const checkBound = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    const { height, width } = this.screenSize;
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
   *
   * Does not save the changes.
   */
  private resetPositions(): void {
    this.controlGroupElements.forEach(controlGroup => {
      controlGroup.style.removeProperty("left");
      controlGroup.style.removeProperty("right");
      controlGroup.style.removeProperty("bottom");
    });
  }

  /**
   * Creates the event listeners for the configuration mode.
   * @param controlGroups - The elements that can be dragged around the screen.
   * @returns The event listeners for the configuration mode.
   */
  private createConfigurationEventListeners(controlGroups: HTMLElement[]): ConfigurationEventListeners {
    return {
      pointerdown: controlGroups.map(element => {
        const startDrag = () => this.startDrag(element);
        element.addEventListener("pointerdown", startDrag, { passive: true });
        return startDrag;
      }),
      pointermove: controlGroups.map(() => {
        const drag = (event: Event) => this.drag(event as PointerEvent);
        window.addEventListener("pointermove", drag, { passive: true });
        return drag;
      }),
      pointerup: controlGroups.map(() => {
        const stopDrag = () => this.stopDrag();
        window.addEventListener("pointerup", stopDrag, { passive: true });
        return stopDrag;
      }),
    };
  }

  /**
   * Creates an overlay that covers the screen and allows the user to drag the touch controls around.
   *
   * Also enables the toolbar for saving, resetting, and canceling the changes.
   */
  private createOverlay(): void {
    const container = new Phaser.GameObjects.Container(globalScene, 0, 0);
    const { height, width } = globalScene.game.canvas;
    const overlay = new Phaser.GameObjects.Rectangle(globalScene, 0, 0, width, height, 0x000000, 0.5) //
      .setInteractive();
    container.add(overlay);
    globalScene.ui.add(container);
    this.overlay = container;

    // Display toolbar
    if (this.touchControlsElements) {
      this.touchControlsElements.dataset.configuring = "configuring";
    }
  }
}
