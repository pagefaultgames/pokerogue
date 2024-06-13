import UiHandler from "../ui-handler";
import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import {addWindow} from "../ui-theme";
import {addTextObject, TextStyle} from "../text";
import {Button} from "../../enums/buttons";
import {NavigationManager} from "#app/ui/settings/navigationMenu";

/**
 * Abstract class for handling UI elements related to button bindings.
 */
export default abstract class AbstractBindingUiHandler extends UiHandler {
  // Containers for different segments of the UI.
  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected actionsContainer: Phaser.GameObjects.Container;

  // Background elements for titles and action areas.
  protected titleBg: Phaser.GameObjects.NineSlice;
  protected actionBg: Phaser.GameObjects.NineSlice;
  protected optionSelectBg: Phaser.GameObjects.NineSlice;

  // Text elements for displaying instructions and actions.
  protected unlockText: Phaser.GameObjects.Text;
  protected timerText: Phaser.GameObjects.Text;
  protected swapText: Phaser.GameObjects.Text;
  protected actionLabel: Phaser.GameObjects.Text;
  protected cancelLabel: Phaser.GameObjects.Text;

  protected listening: boolean = false;
  protected buttonPressed: number | null = null;

  // Icons for displaying current and new button assignments.
  protected newButtonIcon: Phaser.GameObjects.Sprite;
  protected targetButtonIcon: Phaser.GameObjects.Sprite;

  // Function to call on cancel or completion of binding.
  protected cancelFn: (boolean?) => boolean;
  abstract swapAction(): boolean;

  protected timeLeftAutoClose: number = 5;
  protected countdownTimer;

  // The specific setting being modified.
  protected target;

  /**
     * Constructor for the AbstractBindingUiHandler.
     *
     * @param scene - The BattleScene instance.
     * @param mode - The UI mode.
     */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  /**
     * Setup UI elements.
     */
  setup() {
    const ui = this.getUi();
    this.optionSelectContainer = this.scene.add.container(0, 0);
    this.actionsContainer = this.scene.add.container(0, 0);
    // Initially, containers are not visible.
    this.optionSelectContainer.setVisible(false);
    this.actionsContainer.setVisible(false);

    // Add containers to the UI.
    ui.add(this.optionSelectContainer);
    ui.add(this.actionsContainer);

    // Setup backgrounds and text objects for UI.
    this.titleBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + 28 + 21, this.getWindowWidth(), 24);
    this.titleBg.setOrigin(0.5);
    this.optionSelectContainer.add(this.titleBg);

    this.actionBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28 + 21 + 21, this.getWindowWidth(), 24);
    this.actionBg.setOrigin(0.5);
    this.actionsContainer.add(this.actionBg);

    // Text prompts and instructions for the user.
    this.unlockText = addTextObject(this.scene, 0, 0, "Press a button...", TextStyle.WINDOW);
    this.unlockText.setOrigin(0, 0);
    this.unlockText.setPositionRelative(this.titleBg, 36, 4);
    this.optionSelectContainer.add(this.unlockText);

    this.timerText = addTextObject(this.scene, 0, 0, "(5)", TextStyle.WINDOW);
    this.timerText.setOrigin(0, 0);
    this.timerText.setPositionRelative(this.unlockText, (this.unlockText.width/6) + 5, 0);
    this.optionSelectContainer.add(this.timerText);

    this.optionSelectBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - this.getWindowWidth(), -(this.scene.game.canvas.height / 6) + this.getWindowHeight() + 28, this.getWindowWidth(), this.getWindowHeight());
    this.optionSelectBg.setOrigin(0.5);
    this.optionSelectContainer.add(this.optionSelectBg);

    this.cancelLabel = addTextObject(this.scene, 0, 0, "Cancel", TextStyle.SETTINGS_LABEL);
    this.cancelLabel.setOrigin(0, 0.5);
    this.cancelLabel.setPositionRelative(this.actionBg, 10, this.actionBg.height / 2);
    this.actionsContainer.add(this.cancelLabel);
  }

  manageAutoCloseTimer() {
    clearTimeout(this.countdownTimer);
    this.countdownTimer = setTimeout(() => {
      this.timeLeftAutoClose -= 1;
      this.timerText.setText(`(${this.timeLeftAutoClose})`);
      if (this.timeLeftAutoClose >= 0) {
        this.manageAutoCloseTimer();
      } else {
        this.cancelFn();
      }
    }, 1000);
  }

  /**
     * Show the UI with the provided arguments.
     *
     * @param args - Arguments to be passed to the show method.
     * @returns `true` if successful.
     */
  show(args: any[]): boolean {
    super.show(args);
    this.buttonPressed = null;
    this.timeLeftAutoClose = 5;
    this.cancelFn = args[0].cancelHandler;
    this.target = args[0].target;

    // Bring the option and action containers to the front of the UI.
    this.getUi().bringToTop(this.optionSelectContainer);
    this.getUi().bringToTop(this.actionsContainer);

    this.optionSelectContainer.setVisible(true);
    setTimeout(() => {
      this.listening = true;
      this.manageAutoCloseTimer();
    }, 100);
    return true;
  }

  /**
     * Get the width of the window.
     *
     * @returns The window width.
     */
  getWindowWidth(): number {
    return 160;
  }

  /**
     * Get the height of the window.
     *
     * @returns The window height.
     */
  getWindowHeight(): number {
    return 64;
  }

  /**
     * Process the input for the given button.
     *
     * @param button - The button to process.
     * @returns `true` if the input was processed successfully.
     */
  processInput(button: Button): boolean {
    if (this.buttonPressed === null) {
      return;
    }
    const ui = this.getUi();
    let success = false;
    switch (button) {
    case Button.LEFT:
    case Button.RIGHT:
      // Toggle between action and cancel options.
      const cursor = this.cursor ? 0 : 1;
      success = this.setCursor(cursor);
      break;
    case Button.ACTION:
      // Process actions based on current cursor position.
      if (this.cursor === 0) {
        this.cancelFn();
      } else {
        success = this.swapAction();
        NavigationManager.getInstance().updateIcons();
        this.cancelFn(success);
      }
      break;
    }

    // Plays a select sound effect if an action was successfully processed.
    if (success) {
      ui.playSelect();
    } else {
      ui.playError();
    }

    return success;
  }

  /**
     * Set the cursor to the specified position.
     *
     * @param cursor - The cursor position to set.
     * @returns `true` if the cursor was set successfully.
     */
  setCursor(cursor: integer): boolean {
    this.cursor = cursor;
    if (cursor === 1) {
      this.actionLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
      this.actionLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
      this.cancelLabel.setColor(this.getTextColor(TextStyle.WINDOW));
      this.cancelLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));
      return true;
    }
    this.actionLabel.setColor(this.getTextColor(TextStyle.WINDOW));
    this.actionLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));
    this.cancelLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
    this.cancelLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
    return true;
  }

  /**
     * Clear the UI elements and state.
     */
  clear() {
    super.clear();
    clearTimeout(this.countdownTimer);
    this.timerText.setText("(5)");
    this.timeLeftAutoClose = 5;
    this.listening = false;
    this.target = null;
    this.cancelFn = null;
    this.optionSelectContainer.setVisible(false);
    this.actionsContainer.setVisible(false);
    this.newButtonIcon.setVisible(false);
    this.buttonPressed = null;
  }

  /**
     * Handle input down events.
     *
     * @param buttonIcon - The icon of the button that was pressed.
     * @param assignedButtonIcon - The icon of the button that is assigned.
     * @param type - The type of button press.
     */
  onInputDown(buttonIcon: string, assignedButtonIcon: string, type: string): void {
    clearTimeout(this.countdownTimer);
    this.timerText.setText("");
    this.newButtonIcon.setTexture(type);
    this.newButtonIcon.setFrame(buttonIcon);
    if (assignedButtonIcon) {
      this.targetButtonIcon.setTexture(type);
      this.targetButtonIcon.setFrame(assignedButtonIcon);
      this.targetButtonIcon.setVisible(true);
      this.swapText.setVisible(true);
    }
    this.newButtonIcon.setVisible(true);
    this.setCursor(0);
    this.actionsContainer.setVisible(true);
  }
}
