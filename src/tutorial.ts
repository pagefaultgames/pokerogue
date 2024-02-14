import BattleScene from "./battle-scene";
import AwaitableUiHandler from "./ui/awaitable-ui-handler";
import { Mode } from "./ui/ui";

export enum Tutorial {
  Intro = "INTRO",
  Access_Menu = "ACCESS_MENU",
  Menu = "MENU",
  Starter_Select = "STARTER_SELECT",
  Select_Item = "SELECT_ITEM",
  Egg_Gacha = "EGG_GACHA"
}

const tutorialHandlers = {
  [Tutorial.Intro]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(`Welcome to PokéRogue! This is a battle-focused Pokémon fangame with roguelite elements.
                        $This game is not monetized and we claim no ownership of Pokémon nor of the copyrighted assets used.
                        $The game is a work in progress, but fully playable.\nFor bug reports, please use the Discord community.`, null, () => resolve(), null, true);
    });
  },
  [Tutorial.Access_Menu]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      if (scene.enableTouchControls)
        return resolve();
      scene.showFieldOverlay(1000).then(() => scene.ui.showText(`To access the menu, press M or Escape while awaiting input.\nThe menu contains settings and various features.`, null, () => scene.hideFieldOverlay(1000).then(() => resolve()), null, true));
    });
  },
  [Tutorial.Menu]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.gameData.saveTutorialFlag(Tutorial.Access_Menu, true);
      scene.ui.showText(`From this menu you can access the settings.
                        $From the settings you can change game speed, window style, and other options.
                        $There are also various other features here, so be sure to check them all!`, null, () => scene.ui.showText('', null, () => resolve()), null, true);
    });
  },
  [Tutorial.Starter_Select]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(`From this screen, you can select your starters.\nThese are your initial party members.
                        $Each starter has a value. Your party can have up to\n6 members as long as the total does not exceed 10.
                        $You can also select gender, ability, and form depending on\nthe variants you've caught or hatched.
                        $The IVs for a species are also the best of every one you've\ncaught or hatched, so try to get lots of the same species!`, null, () => scene.ui.showText('', null, () => resolve()), null, true);
    });
  },
  [Tutorial.Select_Item]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.setModeWithoutClear(Mode.MESSAGE).then(() => {
        scene.ui.showText(`After every battle, you are given a choice of 3 random items.\nYou may only pick one.
                          $These range from consumables, to Pokémon held items, to passive permanent items.
                          $Most non-consumable item effects will stack in various ways.
                          $Some items will only show up if they can be used, such as evolution items.
                          $You may also choose to transfer a held item (and any duplicates) between Pokémon instead of choosing an item.
                          $The transfer option will appear in the bottom right once you have obtained a held item.
                          $You may purchase consumable items with money, and a larger variety will be available the further you get.
                          $Be sure to buy these before you pick your random item, as it will progress to the next battle once you do.`, null, () => scene.ui.showText('', null, () => scene.ui.setModeWithoutClear(Mode.MODIFIER_SELECT).then(() => resolve())), null, true);
      });
    });
  },
  [Tutorial.Egg_Gacha]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(`From this screen, you can redeem your vouchers for\nPokémon eggs.
                        $Eggs have to be hatched and get closer to hatching after\nevery battle. Rarer eggs take longer to hatch.
                        $Hatched Pokémon also won't be added to your party, they will\nbe added to your starters.
                        $Pokémon hatched from eggs generally have better IVs than\nwild Pokémon.
                        $Some Pokémon can only even be obtained from eggs.
                        $There are 3 different machines to pull from with different\nbonuses, so pick the one that suits you best!`, null, () => scene.ui.showText('', null, () => resolve()), null, true);
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