import cfg_keyboard_qwerty from "#app/configs/inputs/cfg_keyboard_qwerty";
import pad_xbox360 from "#app/configs/inputs/pad_xbox360";
import GameManager from "#test/utils/gameManager";
import InputsHandler from "#test/utils/inputsHandler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Inputs", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let originalDocument: Document;

  beforeAll(() => {
    originalDocument = window.document;
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    Object.defineProperty(window, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.inputsHandler = new InputsHandler(game.scene);
  });

  it("Mobile - test touch holding for 1ms - 1 input", async () => {
    await game.inputsHandler.pressTouch("dpadUp", 1);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("Mobile - test touch holding for 200ms - 1 input", async () => {
    await game.inputsHandler.pressTouch("dpadUp", 200);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("Mobile - test touch holding for 300ms - 2 input", async () => {
    await game.inputsHandler.pressTouch("dpadUp", 300);
    expect(game.inputsHandler.log.length).toBe(2);
  });

  it("Mobile - test touch holding for 1000ms - 4 input", async () => {
    await game.inputsHandler.pressTouch("dpadUp", 1050);
    expect(game.inputsHandler.log.length).toBe(5);
  });

  it("keyboard - test input holding meta key - 0 input", async() => {
    await game.inputsHandler.pressKeyboardKey(cfg_keyboard_qwerty.deviceMapping.KEY_ARROW_UP, 1, true);
    expect(game.inputsHandler.log.length).toBe(0);
  });

  it("keyboard - test input holding for 200ms - 1 input", async() => {
    await game.inputsHandler.pressKeyboardKey(cfg_keyboard_qwerty.deviceMapping.KEY_ARROW_UP, 200);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("keyboard - test input holding for 300ms - 2 input", async() => {
    await game.inputsHandler.pressKeyboardKey(cfg_keyboard_qwerty.deviceMapping.KEY_ARROW_UP, 300);
    expect(game.inputsHandler.log.length).toBe(2);
  });

  it("keyboard - test input holding for 1000ms - 4 input", async() => {
    await game.inputsHandler.pressKeyboardKey(cfg_keyboard_qwerty.deviceMapping.KEY_ARROW_UP, 1050);
    expect(game.inputsHandler.log.length).toBe(5);
  });

  it("gamepad - test input holding for 1ms - 1 input", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 1);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("gamepad - test input holding for 200ms - 1 input", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 200);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("gamepad - test input holding for 300ms - 2 input", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 300);
    expect(game.inputsHandler.log.length).toBe(2);
  });

  it("gamepad - test input holding for 1000ms - 4 input", async() => {
    await game.inputsHandler.pressGamepadButton(pad_xbox360.deviceMapping.RC_S, 1050);
    expect(game.inputsHandler.log.length).toBe(5);
  });
});

