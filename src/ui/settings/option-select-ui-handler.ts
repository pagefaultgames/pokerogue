import AbstractOptionSelectUiHandler from "../abstact-option-select-ui-handler";
import { Mode } from "../ui";

export default class OptionSelectUiHandler extends AbstractOptionSelectUiHandler {
  constructor(mode: Mode = Mode.OPTION_SELECT) {
    super(mode);
  }

  getWindowWidth(): integer {
    return 64;
  }
}
