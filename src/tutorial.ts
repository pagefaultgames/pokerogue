import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { activeOverrides } from "#app/overrides";
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

/**
 * Show a tutorial text with a speaker box.
 * @param key - The i18next key for the tutorial text
 * @param callback - Callback for when the tutorial dialogue is dismissed
 */
function showTutorialDialogue(key: string, callback: () => void): void {
  globalScene.ui.showDialogue(i18next.t(key), i18next.t("tutorial:name"), null, callback);
}

const tutorialHandlers = {
  [Tutorial.INTRO]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.showText(i18next.t("tutorial:intro"), null, () => resolve(), null, true);
    });
  },
  [Tutorial.ACCESS_MENU]: () => {
    return new Promise<void>(resolve => {
      if (settings.general.enableTouchControls) {
        return resolve();
      }
      globalScene
        .showFieldOverlay(1000)
        .then(() =>
          showTutorialDialogue("tutorial:accessMenu", () => globalScene.hideFieldOverlay(1000).then(() => resolve())),
        );
    });
  },
  [Tutorial.MENU]: () => {
    return new Promise<void>(resolve => {
      globalScene.gameData.saveTutorialFlag(Tutorial.ACCESS_MENU, true);
      showTutorialDialogue("tutorial:menu", () => globalScene.ui.showText("", null, () => resolve()));
    });
  },
  [Tutorial.STARTER_SELECT]: () => {
    return new Promise<void>(resolve => {
      showTutorialDialogue("tutorial:starterSelect", () => globalScene.ui.showText("", null, () => resolve()));
    });
  },
  [Tutorial.POKERUS]: () => {
    return new Promise<void>(resolve => {
      showTutorialDialogue("tutorial:pokerus", () => globalScene.ui.showText("", null, () => resolve()));
    });
  },
  [Tutorial.STAT_CHANGE]: () => {
    return new Promise<void>(resolve => {
      globalScene
        .showFieldOverlay(1000)
        .then(() =>
          showTutorialDialogue("tutorial:statChange", () =>
            globalScene.ui.showText("", null, () => globalScene.hideFieldOverlay(1000).then(() => resolve())),
          ),
        );
    });
  },
  [Tutorial.SELECT_ITEM]: () => {
    return new Promise<void>(resolve => {
      globalScene.ui.setModeWithoutClear(UiMode.MESSAGE).then(() => {
        showTutorialDialogue("tutorial:selectItem", () =>
          globalScene.ui.showText("", null, () =>
            globalScene.ui.setModeWithoutClear(UiMode.REWARD_SELECT).then(() => resolve()),
          ),
        );
      });
    });
  },
  [Tutorial.EGG_GACHA]: () => {
    return new Promise<void>(resolve => {
      showTutorialDialogue("tutorial:eggGacha", () => globalScene.ui.showText("", null, () => resolve()));
    });
  },
};

/**
 * Run through the specified tutorial if it hasn't been seen before and mark it as seen once done. \
 * This will show a tutorial overlay if defined in the current {@linkcode AwaitableUiHandler}. \
 * The main menu will also get disabled while the tutorial is running
 * @param tutorial - The {@linkcode Tutorial} to play
 * @returns a promise with result `true` if the tutorial was run and finished, `false` otherwise
 */
export async function handleTutorial(tutorial: Tutorial): Promise<boolean> {
  if (!activeOverrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    if (!settings.general.enableTutorials) {
      return false;
    }

    if (globalScene.gameData.getTutorialFlags()[tutorial]) {
      return false;
    }
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
      alpha: 0.6,
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
