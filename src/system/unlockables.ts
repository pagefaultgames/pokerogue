import { GameMode } from "#app/game-mode";
import { GameModes } from "#enums/game-modes";
import { Unlockables } from "#enums/unlockables";
import i18next from "i18next";

export function getUnlockableName(unlockable: Unlockables) {
  switch (unlockable) {
    case Unlockables.ENDLESS_MODE:
      return i18next.t("gameMode:mode", { mode: GameMode.getModeName(GameModes.ENDLESS) });
    case Unlockables.MINI_BLACK_HOLE:
      return i18next.t("modifierType:ModifierType.MINI_BLACK_HOLE.name");
    case Unlockables.SPLICED_ENDLESS_MODE:
      return i18next.t("gameMode:mode", { mode: GameMode.getModeName(GameModes.SPLICED_ENDLESS) });
    case Unlockables.EVIOLITE:
      return i18next.t("modifierType:ModifierType.EVIOLITE.name");
  }
}
