import type { BattleScene } from "#app/battle-scene";
import type { InputsController } from "#app/inputs-controller";
import { TouchControl } from "#app/touch-controls";
import pad_xbox360 from "#inputs/pad-xbox360";
import { holdOn } from "#test/test-utils/game-manager-utils";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import Phaser from "phaser";

interface LogEntry {
  type: string;
  button: any;
}

export class InputsHandler {
  private scene: BattleScene;
  private events: Phaser.Events.EventEmitter;
  private inputController: InputsController;
  public log: LogEntry[] = [];
  public logUp: LogEntry[] = [];
  private fakePad: Fakepad;
  private fakeMobile: FakeMobile;

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.inputController = this.scene.inputController;
    this.fakePad = new Fakepad(pad_xbox360);
    this.fakeMobile = new FakeMobile();
    this.scene.input.gamepad?.gamepads.push(this.fakePad);
    this.init();
  }

  pressTouch(button: string, duration: number): Promise<void> {
    return new Promise(async resolve => {
      this.fakeMobile.touchDown(button);
      await holdOn(duration);
      this.fakeMobile.touchUp(button);
      resolve();
    });
  }

  pressGamepadButton(button: number, duration: number): Promise<void> {
    return new Promise(async resolve => {
      this.scene.input.gamepad?.emit("down", this.fakePad, { index: button });
      await holdOn(duration);
      this.scene.input.gamepad?.emit("up", this.fakePad, { index: button });
      resolve();
    });
  }

  pressKeyboardKey(key: number, duration: number): Promise<void> {
    return new Promise(async resolve => {
      this.scene.input.keyboard?.emit("keydown", { keyCode: key });
      await holdOn(duration);
      this.scene.input.keyboard?.emit("keyup", { keyCode: key });
      resolve();
    });
  }

  init(): void {
    const touchControl = new TouchControl();
    touchControl.deactivatePressedKey(); //test purpose
    this.events = this.inputController.events;
    this.scene.input.gamepad?.emit("connected", this.fakePad);
    this.listenInputs();
  }

  listenInputs(): void {
    this.events.on(
      "input_down",
      event => {
        this.log.push({ type: "input_down", button: event.button });
      },
      this,
    );

    this.events.on(
      "input_up",
      event => {
        this.logUp.push({ type: "input_up", button: event.button });
      },
      this,
    );
  }
}

class Fakepad extends Phaser.Input.Gamepad.Gamepad {
  public id: string;
  public index: number;

  constructor(pad) {
    //@ts-expect-error
    super(undefined, { ...pad, buttons: pad.deviceMapping, axes: [] }); //TODO: resolve ts-ignore
    this.id = "xbox_360_fakepad";
    this.index = 0;
  }
}

class FakeMobile {
  constructor() {
    const fakeMobilePage = fs.readFileSync("././test/test-utils/fakeMobile.html", { encoding: "utf8", flag: "r" });
    const dom = new JSDOM(fakeMobilePage);
    Object.defineProperty(window, "document", {
      value: dom.window.document,
      configurable: true,
    });
  }

  touchDown(button: string) {
    const node = document.querySelector(`[data-key][id='${button}']`);
    if (!node) {
      return;
    }
    const event = new Event("pointerdown");
    node.dispatchEvent(event);
  }

  touchUp(button: string) {
    const node = document.querySelector(`[data-key][id='${button}']`);
    if (!node) {
      return;
    }
    const event = new Event("pointerup");
    node.dispatchEvent(event);
  }
}
