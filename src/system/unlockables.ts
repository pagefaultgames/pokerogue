import i18next from "i18next";
import { GameMode, GameModes } from "../game-mode";
import Overrides from "#app/overrides";
import { GameData } from "./game-data";

export enum Unlockables {
  ENDLESS_MODE,
  MINI_BLACK_HOLE,
  SPLICED_ENDLESS_MODE,
  EVIOLITE
}

export function isUnlocked(unlockable: Unlockables, gameData: GameData): boolean {
  if (Overrides.UNLOCK_OVERRIDE.includes(unlockable)) {
    return true;
  }
  if (Overrides.DISABLE_UNLOCK_OVERRIDE.includes(unlockable)) {
    return false;
  }
  return gameData.unlocks[unlockable];
}

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
  case Unlockables.ENDLESS_MODE:
    return `${GameMode.getModeName(GameModes.ENDLESS)} Mode`;
  case Unlockables.MINI_BLACK_HOLE:
    return i18next.t("modifierType:ModifierType.MINI_BLACK_HOLE.name");
  case Unlockables.SPLICED_ENDLESS_MODE:
    return `${GameMode.getModeName(GameModes.SPLICED_ENDLESS)} Mode`;
  case Unlockables.EVIOLITE:
    return i18next.t("modifierType:ModifierType.EVIOLITE.name");
  }
}
