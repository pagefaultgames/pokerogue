import { GameMode, GameModes } from "../game-mode";

export enum Unlockables {
  ENDLESS_MODE,
  MINI_BLACK_HOLE,
  SPLICED_ENDLESS_MODE
}

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
  case Unlockables.ENDLESS_MODE:
    return `${GameMode.getModeName(GameModes.ENDLESS)} Mode`;
  case Unlockables.MINI_BLACK_HOLE:
    return "Mini Black Hole";
  case Unlockables.SPLICED_ENDLESS_MODE:
    return `${GameMode.getModeName(GameModes.SPLICED_ENDLESS)} Mode`;
  }
}
