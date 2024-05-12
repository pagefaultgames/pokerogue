import UiHandler from "#app/ui/ui-handler";
import BattleScene from "#app/battle-scene";
import {Mode} from "#app/ui/ui";
import {GamepadConfig} from "#app/inputs-controller";

export interface InputsIcons {
    [key: string]: Phaser.GameObjects.Sprite;
}

export interface LayoutConfig {
    optionsContainer: Phaser.GameObjects.Container;
    inputsIcons: InputsIcons;
    settingLabels: Phaser.GameObjects.Text[];
    optionValueLabels: Phaser.GameObjects.Text[][];
    optionCursors: integer[];
    keys: string[];
    bindingSettings: Array<String>;
}

export default abstract class AbstractSettingsUiUiHandler extends UiHandler {
    protected settingsContainer: Phaser.GameObjects.Container;
    protected optionsContainer: Phaser.GameObjects.Container;

    protected scrollCursor: integer;
    protected optionCursors: integer[];
    protected cursorObj: Phaser.GameObjects.NineSlice;

    protected optionsBg: Phaser.GameObjects.NineSlice;

    protected settingLabels: Phaser.GameObjects.Text[];
    protected optionValueLabels: Phaser.GameObjects.Text[][];

    // layout will contain the 3 Gamepad tab for each config - dualshock, xbox, snes
    protected layout: Map<string, LayoutConfig> = new Map<string, LayoutConfig>();
    // Will contain the input icons from the selected layout
    protected inputsIcons: InputsIcons;
    // list all the setting keys used in the selected layout (because dualshock has more buttons than xbox)
    protected keys: Array<String>;

    // Store the specific settings related to key bindings for the current gamepad configuration.
    protected bindingSettings: Array<String>;

    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);
    }

    show(args: any[]): boolean {
        super.show(args);

        // Update the bindings for the current active gamepad configuration.
        this.updateBindings();

        // Make the settings container visible to the user.
        this.settingsContainer.setVisible(true);
        // Reset the scroll cursor to the top of the settings container.
        this.setScrollCursor(0);

        // Move the settings container to the end of the UI stack to ensure it is displayed on top.
        this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

        // Hide any tooltips that might be visible before showing the settings container.
        this.getUi().hideTooltip();

        // Return true to indicate the UI was successfully shown.
        return true;
    }

    setLayout(activeConfig: GamepadConfig): boolean {
        // Check if there is no active configuration (e.g., no gamepad connected).
        if (!activeConfig) {
            // Retrieve the layout for when no gamepads are connected.
            const layout = this.layout['noGamepads'];
            // Make the options container visible to show message.
            layout.optionsContainer.setVisible(true);
            // Return false indicating the layout application was not successful due to lack of gamepad.
            return false;
        }
        // Extract the type of the gamepad from the active configuration.
        const configType = activeConfig.padType;

        // If a cursor object exists, destroy it to clean up previous UI states.
        this.cursorObj?.destroy();
        // Reset the cursor object and scroll cursor to ensure they are re-initialized correctly.
        this.cursorObj = null;
        this.scrollCursor = null;

        // Retrieve the layout settings based on the type of the gamepad.
        const layout = this.layout[configType];
        // Update the main controller with configuration details from the selected layout.
        this.keys = layout.keys;
        this.optionsContainer = layout.optionsContainer;
        this.optionsContainer.setVisible(true);
        this.settingLabels = layout.settingLabels;
        this.optionValueLabels = layout.optionValueLabels;
        this.optionCursors = layout.optionCursors;
        this.inputsIcons = layout.inputsIcons;
        this.bindingSettings = layout.bindingSettings;

        // Return true indicating the layout was successfully applied.
        return true;
    }

    setCursor(cursor: integer): boolean {
        const ret = super.setCursor(cursor);
        // If the optionsContainer is not initialized, return the result from the parent class directly.
        if (!this.optionsContainer) return ret;

        // Check if the cursor object exists, if not, create it.
        if (!this.cursorObj) {
            this.cursorObj = this.scene.add.nineslice(0, 0, 'summary_moves_cursor', null, (this.scene.game.canvas.width / 6) - 10, 16, 1, 1, 1, 1);
            this.cursorObj.setOrigin(0, 0); // Set the origin to the top-left corner.
            this.optionsContainer.add(this.cursorObj); // Add the cursor to the options container.
        }

        // Update the position of the cursor object relative to the options background based on the current cursor and scroll positions.
        this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

        return ret; // Return the result from the parent class's setCursor method.
    }

    setScrollCursor(scrollCursor: integer): boolean {
        // Check if the new scroll position is the same as the current one; if so, do not update.
        if (scrollCursor === this.scrollCursor)
            return false;

        // Update the internal scroll cursor state
        this.scrollCursor = scrollCursor;

        // Apply the new scroll position to the settings UI.
        this.updateSettingsScroll();

        // Reset the cursor to its current position to adjust its visibility after scrolling.
        this.setCursor(this.cursor);

        return true; // Return true to indicate the scroll cursor was successfully updated.
    }

    updateSettingsScroll(): void {
        // Return immediately if the options container is not initialized.
        if (!this.optionsContainer) return;

        // Set the vertical position of the options container based on the current scroll cursor, multiplying by the item height.
        this.optionsContainer.setY(-16 * this.scrollCursor);

        // Iterate over all setting labels to update their visibility.
        for (let s = 0; s < this.settingLabels.length; s++) {
            // Determine if the current setting should be visible based on the scroll position.
            const visible = s >= this.scrollCursor && s < this.scrollCursor + 9;

            // Set the visibility of the setting label and its corresponding options.
            this.settingLabels[s].setVisible(visible);
            for (let option of this.optionValueLabels[s])
                option.setVisible(visible);
        }
    }


    clear(): void {
        super.clear();

        // Hide the settings container to remove it from the view.
        this.settingsContainer.setVisible(false);

        // Remove the cursor from the UI.
        this.eraseCursor();
    }

    eraseCursor(): void {
        // Check if a cursor object exists.
        if (this.cursorObj)
            this.cursorObj.destroy(); // Destroy the cursor object to clean up resources.

        // Set the cursor object reference to null to fully dereference it.
        this.cursorObj = null;
    }

}