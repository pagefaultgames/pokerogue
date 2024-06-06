import {afterEach, beforeAll, beforeEach, describe, expect, it} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import pad_xbox360 from "#app/configs/inputs/pad_xbox360";


describe("Inputs", () => {
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

  it("test input holding for 1ms", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 1);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("test input holding for 200ms", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 200);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("test input holding for 300ms", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 300);
    expect(game.inputsHandler.log.length).toBe(2);
  });

  it("test input holding for 1000ms", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 1000);
    expect(game.inputsHandler.log.length).toBe(4);
  });

  it("test input holding for 2000ms", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 2000);
    expect(game.inputsHandler.log.length).toBe(8);
  });
});

