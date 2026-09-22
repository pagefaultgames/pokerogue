import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { allHeldItems } from "#data/data-lists";
import type { HeldItemId } from "#enums/held-item-id";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectItem, OptionSelectModeConfig } from "#types/ui-types";

/**
 * Lets the user select one of the Pokémon's held items from a list
 */
export class ItemSelectPhase extends Phase {
  public readonly phaseName = "ItemSelectPhase";
  private items: HeldItemId[];
  private callback: (item: HeldItemId) => void;
  private onCancel: () => void;

  constructor(items: HeldItemId[], callback: (item: HeldItemId) => void, onCancel: () => void) {
    super();
    this.items = items;
    this.callback = callback;
    this.onCancel = onCancel;
  }

  public override async start(): Promise<void> {
    super.start();

    if (this.items.length === 0) {
      this.end();
    }

    const itemOptions: OptionSelectItem[] = [];

    for (const itemId of this.items) {
      itemOptions.push({
        label: allHeldItems[itemId].name,
        handler: () => {
          // TODO: Can we use revertMode instead?
          globalScene.ui.setMode(UiMode.MESSAGE);
          this.callback(itemId);
          this.end();
          return true;
        },
      });
    }
    itemOptions.push({
      label: "Cancel", //TODO: use localized key here
      handler: () => {
        globalScene.ui.setMode(UiMode.MESSAGE);
        this.onCancel();
        this.end();
        return true;
      },
    });

    const chooseItemConfig: OptionSelectModeConfig = {
      options: itemOptions,
      yOffset: 48,
      maxOptions: 8,
    };

    globalScene.ui.setMode(UiMode.OPTION_SELECT, chooseItemConfig);
  }

  //  public override end(): void {
  //  }
}
