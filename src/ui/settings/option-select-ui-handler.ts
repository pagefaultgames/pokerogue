import { UiMode } from "#enums/ui-mode";
import { BaseOptionSelectUiHandler } from "#ui/base-option-select-ui-handler";

export class OptionSelectUiHandler extends BaseOptionSelectUiHandler {
  constructor(mode: UiMode = UiMode.OPTION_SELECT) {
    super(mode);
  }

  getWindowWidth(): number {
    return 64;
  }
}
