import { Type } from "../data/type";

interface GameModeModifiersConfig {
  isPermaDeath?: boolean;
  isMonotype?: boolean;
  monoTypeType?: Type;
}

export default class GameModeModifiers {
  public isPermaDeath: boolean;
  public isMonotype: boolean;
  public monoTypeType: Type;

  constructor(config: GameModeModifiersConfig) {
    Object.assign(this, config);
  }
}