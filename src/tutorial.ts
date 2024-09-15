import BattleScene from "./battle-scene";
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
  [Tutorial.Intro]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:intro"), null, () => resolve(), null, true);
    });
  },
  [Tutorial.Access_Menu]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      if (scene.enableTouchControls) {
        return resolve();
      }
      scene.showFieldOverlay(1000).then(() => scene.ui.showText(i18next.t("tutorial:accessMenu"), null, () => scene.hideFieldOverlay(1000).then(() => resolve()), null, true));
    });
  },
  [Tutorial.Menu]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.gameData.saveTutorialFlag(Tutorial.Access_Menu, true);
      scene.ui.showText(i18next.t("tutorial:menu"), null, () => scene.ui.showText("", null, () => resolve()), null, true);
    });
  },
  [Tutorial.Starter_Select]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:starterSelect"), null, () => scene.ui.showText("", null, () => resolve()), null, true);
    });
  },
  [Tutorial.Pokerus]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:pokerus"), null, () => scene.ui.showText("", null, () => resolve()), null, true);
    });
  },
  [Tutorial.Stat_Change]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.showFieldOverlay(1000).then(() => scene.ui.showText(i18next.t("tutorial:statChange"), null, () => scene.ui.showText("", null, () => scene.hideFieldOverlay(1000).then(() => resolve())), null, true));
    });
  },
  [Tutorial.Select_Item]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.setModeWithoutClear(Mode.MESSAGE).then(() => {
        scene.ui.showText(i18next.t("tutorial:selectItem"), null, () => scene.ui.showText("", null, () => scene.ui.setModeWithoutClear(Mode.MODIFIER_SELECT).then(() => resolve())), null, true);
      });
    });
  },
  [Tutorial.Egg_Gacha]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:eggGacha"), null, () => scene.ui.showText("", null, () => resolve()), null, true);
    });
  },
};

export async function handleTutorial(scene: BattleScene, tutorial: Tutorial): Promise<boolean> {
  if (!scene.enableTutorials && !Overrides.BYPASS_TUTORIAL_SKIP) {
    return false;
  }

  if (scene.gameData.getTutorialFlags()[tutorial] && !Overrides.BYPASS_TUTORIAL_SKIP) {
    return false;
  }

  const handler = scene.ui.getHandler();
  const isMenuDisabled = scene.disableMenu;

  // starting tutorial, disable menu
  scene.disableMenu = true;
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = true;
  }

  await showTutorialOverlay(scene, handler);
  await tutorialHandlers[tutorial](scene);
  await hideTutorialOverlay(scene, handler);

  // tutorial finished and overlay gone, re-enable menu, save tutorial as seen
  scene.disableMenu = isMenuDisabled;
  scene.gameData.saveTutorialFlag(tutorial, true);
  if (handler instanceof AwaitableUiHandler) {
    handler.tutorialActive = false;
  }

  return true;
}

/**
 * Show the tutorial overlay if there is one
 * @param scene the current BattleScene
 * @param handler the current UiHandler
 * @returns true once the overlay has finished appearing, or if there is no overlay
 */
async function showTutorialOverlay(scene: BattleScene, handler: UiHandler) {
  if (handler instanceof AwaitableUiHandler && handler.tutorialOverlay) {
    scene.tweens.add({
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
 * @returns true once the overlay has finished disappearing, or if there is no overlay
 */
async function hideTutorialOverlay(scene: BattleScene, handler: UiHandler) {
  if (handler instanceof AwaitableUiHandler && handler.tutorialOverlay) {
    scene.tweens.add({
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

