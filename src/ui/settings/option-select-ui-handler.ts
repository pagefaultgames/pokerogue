import AbstractOptionSelectUiHandler from "../abstact-option-select-ui-handler";
import { UiMode } from "#enums/ui-mode";

export default class OptionSelectUiHandler extends AbstractOptionSelectUiHandler {
  constructor(mode: UiMode = UiMode.OPTION_SELECT) {
    super(mode);
  }

  getWindowWidth(): number {
    return 64;
  }
}
