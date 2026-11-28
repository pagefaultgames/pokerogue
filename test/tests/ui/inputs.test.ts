import { CFG_KEYBOARD_QWERTY } from "#inputs/cfg-keyboard-qwerty";
import { PAD_XBOX360 } from "#inputs/pad-xbox360";
import { GameManager } from "#test/framework/game-manager";
import { InputsHandler } from "#test/framework/inputs-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    game.scene.inputController.deactivatePressedKey();
    vi.useRealTimers();
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

  it("keyboard - test input holding for 200ms - 1 input", async () => {
    await game.inputsHandler.pressKeyboardKey(CFG_KEYBOARD_QWERTY.deviceMapping.KEY_ARROW_UP, 200);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it.each(["KEY_ESC", "KEY_M", "KEY_C", "KEY_SHIFT"] as const)(
    "keyboard - %s toggles only once even if keyup is lost",
    key => {
      vi.useFakeTimers();
      const keyboard = game.scene.input.keyboard!;
      const keyCode = CFG_KEYBOARD_QWERTY.deviceMapping[key];

      keyboard.emit("keydown", { keyCode, repeat: false });
      keyboard.emit("keydown", { keyCode, repeat: true });
      vi.advanceTimersByTime(2000);
      expect(game.inputsHandler.log).toHaveLength(1);

      // The next physical press works even though the previous release was lost.
      keyboard.emit("keydown", { keyCode, repeat: false });
      vi.advanceTimersByTime(1000);
      expect(game.inputsHandler.log).toHaveLength(2);
      keyboard.emit("keyup", { keyCode });
      keyboard.emit("keydown", { keyCode, repeat: false });
      expect(game.inputsHandler.log).toHaveLength(3);
    },
  );

  it("keyboard - releasing Escape does not unlock another held key", () => {
    vi.useFakeTimers();
    const keyboard = game.scene.input.keyboard!;
    const up = CFG_KEYBOARD_QWERTY.deviceMapping.KEY_ARROW_UP;
    const escapeKey = CFG_KEYBOARD_QWERTY.deviceMapping.KEY_ESC;

    keyboard.emit("keydown", { keyCode: up, repeat: false });
    keyboard.emit("keydown", { keyCode: escapeKey, repeat: false });
    keyboard.emit("keyup", { keyCode: escapeKey });
    keyboard.emit("keydown", { keyCode: up, repeat: true });
    expect(game.inputsHandler.log).toHaveLength(2);
    vi.advanceTimersByTime(250);
    expect(game.inputsHandler.log).toHaveLength(3);
    keyboard.emit("keyup", { keyCode: up });
    vi.advanceTimersByTime(1000);
    expect(game.inputsHandler.log).toHaveLength(3);
  });

  it("keyboard - test input holding for 300ms - 2 input", async () => {
    await game.inputsHandler.pressKeyboardKey(CFG_KEYBOARD_QWERTY.deviceMapping.KEY_ARROW_UP, 300);
    expect(game.inputsHandler.log.length).toBe(2);
  });

  it("keyboard - test input holding for 1000ms - 4 input", async () => {
    await game.inputsHandler.pressKeyboardKey(CFG_KEYBOARD_QWERTY.deviceMapping.KEY_ARROW_UP, 1050);
    expect(game.inputsHandler.log.length).toBe(5);
  });

  it("gamepad - test input holding for 1ms - 1 input", async () => {
    await game.inputsHandler.pressGamepadButton(PAD_XBOX360.deviceMapping.RC_S, 1);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("gamepad - test input holding for 200ms - 1 input", async () => {
    await game.inputsHandler.pressGamepadButton(PAD_XBOX360.deviceMapping.RC_S, 200);
    expect(game.inputsHandler.log.length).toBe(1);
  });

  it("gamepad - test input holding for 300ms - 2 input", async () => {
    await game.inputsHandler.pressGamepadButton(PAD_XBOX360.deviceMapping.RC_S, 300);
    expect(game.inputsHandler.log.length).toBe(2);
  });

  it("gamepad - test input holding for 1000ms - 4 input", async () => {
    await game.inputsHandler.pressGamepadButton(PAD_XBOX360.deviceMapping.RC_S, 1050);
    expect(game.inputsHandler.log.length).toBe(5);
  });
});
