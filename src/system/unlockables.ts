export enum Unlockables {
  MINI_BLACK_HOLE
}

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
    case Unlockables.MINI_BLACK_HOLE:
      return 'MINI BLACK HOLE';
  }
}