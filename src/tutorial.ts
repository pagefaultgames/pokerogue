import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { UiMode } from "#enums/ui-mode";
import { AwaitableUiHandler } from "#ui/awaitable-ui-handler";
import type { UiHandler } from "#ui/ui-handler";
import i18next from "i18next";

export enum Tutorial {
  INTRO = "INTRO",
  ACCESS_MENU = "ACCESS_MENU",
  MENU = "MENU",
  STARTER_SELECT = "STARTER_SELECT",
  POKEDEX = "POKEDEX",
  POKERUS = "POKERUS",
  STAT_CHANGE = "STAT_CHANGE",
  SELECT_ITEM = "SELECT_ITEM",
  EGG_GACHA = "EGG_GACHA",
}

const tutorialHandlers = {
  [Tutorial.INTRO]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.showText(i18next.t("tutorial:intro"), null, () => resolve(), null, true);
    });
  },
  [Tutorial.ACCESS_MENU]: () => {
    return new Promise<void>(resolve => {
      if (globalScene.enableTouchControls) {
        return resolve();
      }
      globalScene
        .showFieldOverlay(1000)
        .then(() =>
          globalScene.ui.showText(
            i18next.t("tutorial:accessMenu"),
            null,
            () => globalScene.hideFieldOverlay(1000).then(() => resolve()),
            null,
            true,
          ),
        );
    });
  },
  [Tutorial.MENU]: () => {
    return new Promise<void>(resolve => {
      globalScene.gameData.saveTutorialFlag(Tutorial.ACCESS_MENU, true);
      globalScene.ui.showText(
        i18next.t("tutorial:menu"),
        null,
        () => globalScene.ui.showText("", null, () => resolve()),
        null,
        true,
      );
    });
  },
  [Tutorial.STARTER_SELECT]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.showText(
        i18next.t("tutorial:starterSelect"),
        null,
        () => globalScene.ui.showText("", null, () => resolve()),
        null,
        true,
      );
    });
  },
  [Tutorial.POKERUS]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.showText(
        i18next.t("tutorial:pokerus"),
        null,
        () => globalScene.ui.showText("", null, () => resolve()),
        null,
        true,
      );
    });
  },
  [Tutorial.STAT_CHANGE]: () => {
    return new Promise<void>(resolve => {
      globalScene
        .showFieldOverlay(1000)
        .then(() =>
          globalScene.ui.showText(
            i18next.t("tutorial:statChange"),
            null,
            () => globalScene.ui.showText("", null, () => globalScene.hideFieldOverlay(1000).then(() => resolve())),
            null,
            true,
          ),
        );
    });
  },
  [Tutorial.SELECT_ITEM]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.setModeWithoutClear(UiMode.MESSAGE).then(() => {
        globalScene.ui.showText(
          i18next.t("tutorial:selectItem"),
          null,
          () =>
            globalScene.ui.showText("", null, () =>
              globalScene.ui.setModeWithoutClear(UiMode.MODIFIER_SELECT, {}).then(() => resolve()),
            ),
          null,
          true,
        );
      });
    });
  },
  [Tutorial.EGG_GACHA]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.showText(
        i18next.t("tutorial:eggGacha"),
        null,
        () => globalScene.ui.showText("", null, () => resolve()),
        null,
        true,
      );
    });
  },
};

/**
 * Run through the specified tutorial if it hasn't been seen before and mark it as seen once done
 * This will show a tutorial overlay if defined in the current {@linkcode AwaitableUiHandler}
 * The main menu will also get disabled while the tutorial is running
 * @param tutorial the {@linkcode Tutorial} to play
 * @returns a promise with result `true` if the tutorial was run and finished, `false` otherwise
 */
export async function handleTutorial(tutorial: Tutorial): Promise<boolean> {
  if (!globalScene.enableTutorials && !Overrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    return false;
  }

  if (globalScene.gameData.getTutorialFlags()[tutorial] && !Overrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    return false;
  }

  const handler = globalScene.ui.getHandler();
  const isMenuDisabled = globalScene.disableMenu;

  // starting tutorial, disable menu
  globalScene.disableMenu = true;
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = true;
  }

  await showTutorialOverlay(handler);
  await tutorialHandlers[tutorial]();
  await hideTutorialOverlay(handler);

  // tutorial finished and overlay gone, re-enable menu, save tutorial as seen
  globalScene.disableMenu = isMenuDisabled;
  globalScene.gameData.saveTutorialFlag(tutorial, true);
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = false;
  }

  return true;
}

/**
 * Show the tutorial overlay if there is one
 * @param handler the current UiHandler
 * @returns `true` once the overlay has finished appearing, or if there is no overlay
 */
async function showTutorialOverlay(handler: UiHandler) {
  if (handler instanceof AwaitableUiHandler && handler.tutorialOverlay) {
    globalScene.tweens.add({
      targets: handler.tutorialOverlay,
      alpha: 0.5,
      duration: 750,
      ease: "Sine.easeOut",
      onComplete: () => {
        return true;
      },
    });
  } else {
    return true;
  }
}

/**
 * Hide the tutorial overlay if there is one
 * @param handler the current UiHandler
 * @returns `true` once the overlay has finished disappearing, or if there is no overlay
 */
async function hideTutorialOverlay(handler: UiHandler) {
  if (handler instanceof AwaitableUiHandler && handler.tutorialOverlay) {
    globalScene.tweens.add({
      targets: handler.tutorialOverlay,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        return true;
      },
    });
  } else {
    return true;
  }
}
