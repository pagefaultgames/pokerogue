import UiHandler from "#app/ui/ui-handler";
import BattleScene from "#app/battle-scene";
import {Mode} from "#app/ui/ui";
import {Button} from "#app/enums/buttons";


export default class KeyboardBindingUiHandler extends UiHandler {
    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);
    }

    setup() {
        const ui = this.getUi();
    }

    updateBindings(): void {

    }

    show(args: any[]): boolean {
        super.show(args);

        // Move the settings container to the end of the UI stack to ensure it is displayed on top.
        // this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

        // Hide any tooltips that might be visible before showing the settings container.
        this.getUi().hideTooltip();

        // Return true to indicate the UI was successfully shown.
        return true;
    }

    processInput(button: Button): boolean {
        const ui = this.getUi();
        return false;
    }

    setCursor(cursor: integer): boolean {
        const ret = super.setCursor(cursor);
        return ret;
    }

    setOptionCursor(settingIndex: integer, cursor: integer, save?: boolean): boolean {
        return true;
    }

    setScrollCursor(scrollCursor: integer): boolean {
        return true;
    }

    // updateSettingsScroll(): void {
    //     // Return immediately if the options container is not initialized.
    //     if (!this.optionsContainer) return;
    //
    //     // Set the vertical position of the options container based on the current scroll cursor, multiplying by the item height.
    //     this.optionsContainer.setY(-16 * this.scrollCursor);
    //
    //     // Iterate over all setting labels to update their visibility.
    //     for (let s = 0; s < this.settingLabels.length; s++) {
    //         // Determine if the current setting should be visible based on the scroll position.
    //         const visible = s >= this.scrollCursor && s < this.scrollCursor + 9;
    //
    //         // Set the visibility of the setting label and its corresponding options.
    //         this.settingLabels[s].setVisible(visible);
    //         for (let option of this.optionValueLabels[s])
    //             option.setVisible(visible);
    //     }
    // }

    clear(): void {
        super.clear();

        // Hide the settings container to remove it from the view.
        // this.settingsContainer.setVisible(false);

        // Remove the cursor from the UI.
        this.eraseCursor();
    }

    eraseCursor(): void {
        // Check if a cursor object exists.
        // if (this.cursorObj)
        //     this.cursorObj.destroy(); // Destroy the cursor object to clean up resources.
        //
        // // Set the cursor object reference to null to fully dereference it.
        // this.cursorObj = null;
    }

}