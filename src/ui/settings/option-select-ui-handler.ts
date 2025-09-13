import { UiMode } from "#enums/ui-mode";
import { AbstractOptionSelectUiHandler } from "#ui/handlers/abstract-option-select-ui-handler";

export class OptionSelectUiHandler extends AbstractOptionSelectUiHandler {
  constructor(mode: UiMode = UiMode.OPTION_SELECT) {
    super(mode);
  }

  getWindowWidth(): number {
    return 64;
  }
}
