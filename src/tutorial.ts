import { globalScene } from "#app/global-scene";
import { activeOverrides } from "#app/overrides";
import { UiMode } from "#enums/ui-mode";
import { AwaitableUiHandler } from "#ui/awaitable-ui-handler";
import type { EggGachaUiHandler } from "#ui/handlers/egg-gacha-ui-handler";
import type { MenuUiHandler } from "#ui/handlers/menu-ui-handler";
import type { UiHandler } from "#ui/ui-handler";
import i18next from "i18next";

function isMenuHandler(handler: any): handler is MenuUiHandler {
  return handler && "showDialogue" in handler && globalScene.ui.getMode() === UiMode.MENU;
}

function isGachaHandler(handler: any): handler is EggGachaUiHandler {
  return handler && "showDialogue" in handler && globalScene.ui.getMode() === UiMode.EGG_GACHA;
}

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
 * Handlers for each {@linkcode Tutorial} step.
 *
 * @remarks
 * These handlers are responsible for showing the tutorial dialogue texts and labels.
 * Field-based tutorials use the global UI directly, whereas overlay menus (like Egg Gacha or Main Menu)
 * fetch their own custom UI handler to safely render the dialogue box without soft-locking the game.
 */
const tutorialHandlers = {
  [Tutorial.INTRO]: () => {
    return new Promise<void>(resolve => {
      // The INTRO acts as general info text and should not display a speaker label.
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
          globalScene.ui.showDialogue(i18next.t("tutorial:accessMenu"), i18next.t("tutorial:name"), null, () =>
            globalScene.hideFieldOverlay(1000).then(() => resolve()),
          ),
        );
    });
  },

  [Tutorial.MENU]: () => {
    return new Promise<void>(resolve => {
      globalScene.gameData.saveTutorialFlag(Tutorial.ACCESS_MENU, true);
      const handler = globalScene.ui.getHandler();

      if (isMenuHandler(handler)) {
        handler.showDialogue(i18next.t("tutorial:menu"), i18next.t("tutorial:name"), undefined, () =>
          handler.showText("", 0, () => resolve()),
        );
      } else {
        globalScene.ui.showDialogue(i18next.t("tutorial:menu"), i18next.t("tutorial:name"), undefined, () => resolve());
      }
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
      globalScene.ui.showDialogue(i18next.t("tutorial:pokerus"), i18next.t("tutorial:name"), null, () =>
        globalScene.ui.showText("", null, () => resolve()),
      );
    });
  },

  [Tutorial.STAT_CHANGE]: () => {
    return new Promise<void>(resolve => {
      globalScene
        .showFieldOverlay(1000)
        .then(() =>
          globalScene.ui.showDialogue(i18next.t("tutorial:statChange"), i18next.t("tutorial:name"), null, () =>
            globalScene.ui.showText("", null, () => globalScene.hideFieldOverlay(1000).then(() => resolve())),
          ),
        );
    });
  },

  [Tutorial.SELECT_ITEM]: () => {
    return new Promise<void>(resolve => {
      // Revert the game to MESSAGE mode temporarily to render the name box safely over the shop items,
      // preventing input soft-locks in the modifier select interface.
      globalScene.ui.setModeWithoutClear(UiMode.MESSAGE).then(() => {
        globalScene.ui.showDialogue(i18next.t("tutorial:selectItem"), i18next.t("tutorial:name"), 0, () => {
          globalScene.ui.showText("", 0, () => {
            // Restore the MODIFIER_SELECT mode so the player can interact with the shop again.
            globalScene.ui.setModeWithoutClear(UiMode.MODIFIER_SELECT).then(() => resolve());
          });
        });
      });
    });
  },

  [Tutorial.EGG_GACHA]: () => {
    return new Promise<void>(resolve => {
      const handler = globalScene.ui.getHandler();

      if (isGachaHandler(handler)) {
        handler.showDialogue(i18next.t("tutorial:eggGacha"), i18next.t("tutorial:name"), undefined, () =>
          handler.showText("", 0, () => resolve()),
        );
      } else {
        globalScene.ui.showDialogue(i18next.t("tutorial:eggGacha"), i18next.t("tutorial:name"), undefined, () =>
          resolve(),
        );
      }
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
  if (!globalScene.enableTutorials && !activeOverrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    return false;
  }

  if (globalScene.gameData.getTutorialFlags()[tutorial] && !activeOverrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    return false;
  }

  const handler = globalScene.ui.getHandler();
  const isMenuDisabled = globalScene.disableMenu;

  globalScene.disableMenu = true;
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = true;
  }

  await showTutorialOverlay(handler);
  await tutorialHandlers[tutorial]();
  await hideTutorialOverlay(handler);

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
