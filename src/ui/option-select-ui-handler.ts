import BattleScene from "../battle-scene";
import AbstractOptionSelectUiHandler from "./abstact-option-select-ui-handler";
import { Mode } from "./ui";

export default class OptionSelectUiHandler extends AbstractOptionSelectUiHandler {
  private options: string[] = [];

  constructor(scene: BattleScene) {
    super(scene, Mode.OPTION_SELECT);
  }

  getWindowWidth(): integer {
    return 64;
  }

  getWindowHeight(): integer {
    return (this.getOptions().length + 1) * 16;
  }

  getOptions(): string[] {
    return this.options;
  }

  show(args: any[]) {
    if (args.length < 2 || args.length % 2 === 1)
      return;

    const optionNames: string[] = [];
    const optionFuncs: Function[] = [];

    args.map((arg, i) => (i % 2 ? optionFuncs : optionNames).push(arg));

    this.options = optionNames;

    this.setupOptions();

    super.show(optionFuncs);
  }
}