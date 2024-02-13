import BattleScene from "./battle-scene";

export enum Tutorial {
  Intro = "INTRO",
  Menu = "MENU",
  Starter_Select = "STARTER_SELECT",
  Select_Item = "SELECT_ITEM",
  Gacha = "GACHA",
  Egg_List = "EGG_LIST"
}

const tutorialHandlers = {
  [Tutorial.Intro]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(`Welcome to PokéRogue! This is a battle-focused Pokémon fangame with roguelite elements.
                        $This game is not monetized and we claim no ownership of Pokémon nor of the copyrighted assets used.
                        $The game is a work in progress, but fully playable.\nFor bug reports, please use the Discord community.`, null, () => resolve(), null, true);
    });
  },
  [Tutorial.Menu]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      if (scene.enableTouchControls)
        return resolve();
      scene.ui.showText(`To access the menu, press M or Escape. The menu contains settings and various features.`, null, () => resolve(), null, true);
    });
  },
  [Tutorial.Starter_Select]: (scene: BattleScene) => {
    return new Promise<void>(resolve => {
      scene.ui.showText(`From this screen, you can select the starters for your party.
                        $Each starter has a value. Your party can have up to 6 members as long as the total does not exceed 10.
                        $You can also select gender, ability, and form depending on the variants you've caught or hatched.
                        $The IVs for a species are also the best of every one you've caught, so try to get lots of the same species!`, null, () => resolve(), null, true);
    });
  },
};

export function handleTutorial(scene: BattleScene, tutorial: Tutorial): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (!scene.enableTutorials)
      return resolve(false);

    if (scene.gameData.getTutorialFlags()[tutorial])
      return resolve(false);

    tutorialHandlers[tutorial](scene).then(() => {
      scene.gameData.saveTutorialFlag(tutorial, true);
      resolve(true);
    });
  });
}