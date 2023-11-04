import { GameMode, gameModeNames } from "../game-mode";

export enum Unlockables {
  ENDLESS_MODE,
  MINI_BLACK_HOLE,
  SPLICED_ENDLESS_MODE
}

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
    case Unlockables.ENDLESS_MODE:
      return gameModeNames[GameMode.ENDLESS];
    case Unlockables.MINI_BLACK_HOLE:
      return 'Mini Black Hole';
    case Unlockables.SPLICED_ENDLESS_MODE:
      return gameModeNames[GameMode.SPLICED_ENDLESS];
  }
}