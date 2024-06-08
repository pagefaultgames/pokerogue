import {afterEach, beforeAll, beforeEach, describe, it} from "vitest";
import {generateStarter} from "#app/test/utils/gameManagerUtils";
import {Mode} from "#app/ui/ui";
import {GameModes} from "#app/game-mode";
import {
  EncounterPhase,
  LoginPhase,
  SelectGenderPhase,
  SelectStarterPhase, SummonPhase,
  TitlePhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import {PlayerGender} from "#app/data/enums/player-gender";
import { getGameMode } from "#app/game-mode.js";

describe("Test Battle Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  it("wrong phase", async() => {
    await game.phaseInterceptor.run(LoginPhase);
    await game.phaseInterceptor.run(LoginPhase);
  }, 20000);

  it("wrong phase but skip", async() => {
    await game.phaseInterceptor.run(LoginPhase);
    await game.phaseInterceptor.run(LoginPhase, () => game.isCurrentPhase(SelectGenderPhase));
  }, 20000);

  it("good run", async() => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    }, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.run(SelectGenderPhase, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.run(TitlePhase);
  }, 20000);

  it("good run from select gender to title", async() => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    }, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(TitlePhase);
  }, 20000);

  it("good run to SummonPhase phase", async() => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    }, () => game.isCurrentPhase(TitlePhase));
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(game.scene);
      const selectStarterPhase = new SelectStarterPhase(game.scene);
      game.scene.pushPhase(new EncounterPhase(game.scene, false));
      selectStarterPhase.initBattle(starters);
    });
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(SummonPhase);
  }, 20000);
});

