import { gScene } from "./battle-scene"; // ?
import AwaitableUiHandler from "./ui/awaitable-ui-handler";
import UiHandler from "./ui/ui-handler";
import { Mode } from "./ui/ui";
import i18next from "i18next";
import Overrides from "#app/overrides";

export enum Tutorial {
  Intro = "INTRO",
  Access_Menu = "ACCESS_MENU",
  Menu = "MENU",
  Starter_Select = "STARTER_SELECT",
  Pokerus = "POKERUS",
  Stat_Change = "STAT_CHANGE",
  Select_Item = "SELECT_ITEM",
  Egg_Gacha = "EGG_GACHA"
}

const tutorialHandlers = {
  [Tutorial.Intro]: () => {
    return new Promise<void>(resolve => {
      gScene.ui.showText(i18next.t("tutorial:intro"), null, () => resolve(), null, true);
    });
  },
  [Tutorial.Access_Menu]: () => {
    return new Promise<void>(resolve => {
      if (gScene.enableTouchControls) {
        return resolve();
      }
      gScene.showFieldOverlay(1000).then(() => gScene.ui.showText(i18next.t("tutorial:accessMenu"), null, () => gScene.hideFieldOverlay(1000).then(() => resolve()), null, true));
    });
  },
  [Tutorial.Menu]: () => {
    return new Promise<void>(resolve => {
      gScene.gameData.saveTutorialFlag(Tutorial.Access_Menu, true);
      gScene.ui.showText(i18next.t("tutorial:menu"), null, () => gScene.ui.showText("", null, () => resolve()), null, true);
    });
  },
  [Tutorial.Starter_Select]: () => {
    return new Promise<void>(resolve => {
      gScene.ui.showText(i18next.t("tutorial:starterSelect"), null, () => gScene.ui.showText("", null, () => resolve()), null, true);
    });
  },
  [Tutorial.Pokerus]: () => {
    return new Promise<void>(resolve => {
      gScene.ui.showText(i18next.t("tutorial:pokerus"), null, () => gScene.ui.showText("", null, () => resolve()), null, true);
    });
  },
  [Tutorial.Stat_Change]: () => {
    return new Promise<void>(resolve => {
      gScene.showFieldOverlay(1000).then(() => gScene.ui.showText(i18next.t("tutorial:statChange"), null, () => gScene.ui.showText("", null, () => gScene.hideFieldOverlay(1000).then(() => resolve())), null, true));
    });
  },
  [Tutorial.Select_Item]: () => {
    return new Promise<void>(resolve => {
      gScene.ui.setModeWithoutClear(Mode.MESSAGE).then(() => {
        gScene.ui.showText(i18next.t("tutorial:selectItem"), null, () => gScene.ui.showText("", null, () => gScene.ui.setModeWithoutClear(Mode.MODIFIER_SELECT).then(() => resolve())), null, true);
      });
    });
  },
  [Tutorial.Egg_Gacha]: () => {
    return new Promise<void>(resolve => {
      gScene.ui.showText(i18next.t("tutorial:eggGacha"), null, () => gScene.ui.showText("", null, () => resolve()), null, true);
    });
  },
};

/**
 * Run through the specified tutorial if it hasn't been seen before and mark it as seen once done
 * This will show a tutorial overlay if defined in the current {@linkcode AwaitableUiHandler}
 * The main menu will also get disabled while the tutorial is running
 * @param scene the current {@linkcode BattleScene}
 * @param tutorial the {@linkcode Tutorial} to play
 * @returns a promise with result `true` if the tutorial was run and finished, `false` otherwise
 */
export async function handleTutorial(tutorial: Tutorial): Promise<boolean> {
  if (!gScene.enableTutorials && !Overrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    return false;
  }

  if (gScene.gameData.getTutorialFlags()[tutorial] && !Overrides.BYPASS_TUTORIAL_SKIP_OVERRIDE) {
    return false;
  }

  const handler = gScene.ui.getHandler();
  const isMenuDisabled = gScene.disableMenu;

  // starting tutorial, disable menu
  gScene.disableMenu = true;
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = true;
  }

  await showTutorialOverlay(handler);
  await tutorialHandlers[tutorial]();
  await hideTutorialOverlay(handler);

  // tutorial finished and overlay gone, re-enable menu, save tutorial as seen
  gScene.disableMenu = isMenuDisabled;
  gScene.gameData.saveTutorialFlag(tutorial, true);
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = false;
  }

  return true;
}

/**
 * Show the tutorial overlay if there is one
 * @param scene the current BattleScene
 * @param handler the current UiHandler
 * @returns `true` once the overlay has finished appearing, or if there is no overlay
 */
async function showTutorialOverlay(handler: UiHandler) {
  if (handler instanceof AwaitableUiHandler && handler.tutorialOverlay) {
    gScene.tweens.add({
      targets: handler.tutorialOverlay,
      alpha: 0.5,
      duration: 750,
      ease: "Sine.easeOut",
      onComplete: () => {
        return true;
      }
    });
  } else {
    return true;
  }
}

/**
 * Hide the tutorial overlay if there is one
 * @param scene the current BattleScene
 * @param handler the current UiHandler
 * @returns `true` once the overlay has finished disappearing, or if there is no overlay
 */
async function hideTutorialOverlay(handler: UiHandler) {
  if (handler instanceof AwaitableUiHandler && handler.tutorialOverlay) {
    gScene.tweens.add({
      targets: handler.tutorialOverlay,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        return true;
      }
    });
  } else {
    return true;
  }
}

