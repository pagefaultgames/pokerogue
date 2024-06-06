import BattleScene from "#app/battle-scene";
import Phaser from "phaser";
import {InputsController} from "#app/inputs-controller";
import pad_xbox360 from "#app/configs/inputs/pad_xbox360";
import {holdOn} from "#app/test/utils/gameManagerUtils";



export default class InputsHandler {
  private scene: BattleScene;
  private events: Phaser.Events.EventEmitter;
  private inputController: InputsController;
  public log = [];
  private fakePad: Phakepad;

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.inputController = this.scene.inputController;
    this.fakePad = new Phakepad(pad_xbox360);
    this.scene.input.gamepad.gamepads.push(this.fakePad);
    this.init();
  }

  pressGamepadButton(button: integer, duration: integer): Promise<void> {
    return new Promise(async (resolve) => {
      this.scene.input.gamepad.emit("down", this.fakePad, {index: button});
      await holdOn(duration);
      this.scene.input.gamepad.emit("up", this.fakePad, {index: button});
      resolve();
    });
  }

  pressKeyboardKey(key: integer, duration: integer): Promise<void> {
    return new Promise(async (resolve) => {
      this.scene.input.keyboard.emit("keydown", {keyCode: key});
      await holdOn(duration);
      this.scene.input.keyboard.emit("keyup", {keyCode: key});
      resolve();
    });
  }

  init(): void {
    setInterval(() => {
      this.inputController.update();
    });
    this.events = this.inputController.events;
    this.scene.input.gamepad.emit("connected", this.fakePad);
    this.listenInputs();
  }

  listenInputs(): void {
    this.events.on("input_down", (event) => {
      this.log.push({type: "input_down", button: event.button});
    }, this);

    // this.events.on("input_up", (event) => {
    //   this.log.push({type: "input_up", button: event.button});
    // }, this);
  }
}

class Phakepad extends Phaser.Input.Gamepad.Gamepad {
  public id: string;
  public index: number;

  constructor(pad) {
    super(undefined, {...pad, buttons: pad.deviceMapping, axes: []});
    this.id = "xbox_360_fakepad";
    this.index = 0;
  }
}
