import { GameModes, gameModes } from "../game-mode";

export enum Unlockables {
  ENDLESS_MODE,
  MINI_BLACK_HOLE,
  SPLICED_ENDLESS_MODE
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
