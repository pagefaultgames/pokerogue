import { GameModes, gameModes } from "../game-mode";

export enum Unlockables {
  ENDLESS_MODE = 0,
  MINI_BLACK_HOLE = 1,
  SPLICED_ENDLESS_MODE = 2,
}

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
    case Unlockables.ENDLESS_MODE:
      return `${gameModes[GameModes.ENDLESS].getName()} Mode`;
    case Unlockables.MINI_BLACK_HOLE:
      return "Mini Black Hole";
    case Unlockables.SPLICED_ENDLESS_MODE:
      return `${gameModes[GameModes.SPLICED_ENDLESS].getName()} Mode`;
  }
}
