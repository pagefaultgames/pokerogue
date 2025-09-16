import { GameMode } from "#app/game-mode";
import { GameModes } from "#enums/game-modes";
import { Unlockables } from "#enums/unlockables";
import i18next from "i18next";

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
