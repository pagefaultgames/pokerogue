import BattleScene from "./battle-scene";
import AwaitableUiHandler from "./ui/awaitable-ui-handler";
import { Mode } from "./ui/ui";
import i18next from './plugins/i18n';

export enum Tutorial {
  Intro = "INTRO",
  Access_Menu = "ACCESS_MENU",
  Menu = "MENU",
  Starter_Select = "STARTER_SELECT",
  Pokerus = "POKERUS",
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
      if (scene.enableTouchControls)
        return resolve();
      scene.showFieldOverlay(1000).then(() => scene.ui.showText(i18next.t("tutorial:accessMenu"), null, () => scene.hideFieldOverlay(1000).then(() => resolve()), null, true));
    });
  },
  [Tutorial.Menu]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.gameData.saveTutorialFlag(Tutorial.Access_Menu, true);
      scene.ui.showText(i18next.t("tutorial:menu"), null, () => scene.ui.showText('', null, () => resolve()), null, true);
    });
  },
  [Tutorial.Starter_Select]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:starterSelect"), null, () => scene.ui.showText('', null, () => resolve()), null, true);
    });
  },
  [Tutorial.Pokerus]:  (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:pokerus"), null, () => scene.ui.showText('', null, () => resolve()), null, true);
    });
  },
  [Tutorial.Select_Item]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.setModeWithoutClear(Mode.MESSAGE).then(() => {
        scene.ui.showText(i18next.t("tutorial:selectItem"), null, () => scene.ui.showText('', null, () => scene.ui.setModeWithoutClear(Mode.MODIFIER_SELECT).then(() => resolve())), null, true);
      });
    });
  },
  [Tutorial.Egg_Gacha]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(i18next.t("tutorial:eggGacha"), null, () => scene.ui.showText('', null, () => resolve()), null, true);
    });
  },
};

export function handleTutorial(scene: BattleScene, tutorial: Tutorial): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (!scene.enableTutorials)
      return resolve(false);

    if (scene.gameData.getTutorialFlags()[tutorial])
      return resolve(false);

    const handler = scene.ui.getHandler();
    if (handler instanceof AwaitableUiHandler)
      handler.tutorialActive = true;
    tutorialHandlers[tutorial](scene).then(() => {
      scene.gameData.saveTutorialFlag(tutorial, true);
      if (handler instanceof AwaitableUiHandler)
        handler.tutorialActive = false;
      resolve(true);
    });
  });
}
