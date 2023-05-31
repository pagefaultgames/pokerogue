export enum Unlockables {
  ENDLESS_MODE,
  MINI_BLACK_HOLE
}

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
    case Unlockables.ENDLESS_MODE:
      return 'Endless Mode';
    case Unlockables.MINI_BLACK_HOLE:
      return 'MINI BLACK HOLE';
  }
}