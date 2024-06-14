import {Button} from "#enums/buttons";
import EventEmitter = Phaser.Events.EventEmitter;
import BattleScene from "./battle-scene";

const repeatInputDelayMillis = 250;

export default class TouchControl {
  events: EventEmitter;
  private buttonLock: string[] = new Array();
  private inputInterval: NodeJS.Timeout[] = new Array();

  constructor(scene: BattleScene) {
    this.events = scene.game.events;
    this.init();
  }

  /**
   * Initialize touch controls by binding keys to buttons.
   */
  init() {
    this.preventElementZoom(document.querySelector("#dpad"));
    this.preventElementZoom(document.querySelector("#apad"));
    // Select all elements with the 'data-key' attribute and bind keys to them
    for (const button of document.querySelectorAll("[data-key]")) {
      // @ts-ignore - Bind the key to the button using the dataset key
      this.bindKey(button, button.dataset.key);
    }
  }

  /**
   * Binds a node to a specific key to simulate keyboard events on touch.
   *
   * @param node - The DOM element to bind the key to.
   * @param key - The key to simulate.
   * @param events - The event emitter for handling input events.
   *
   * @remarks
   * This function binds touch events to a node to simulate 'keydown' and 'keyup' keyboard events.
   * It adds the key to the keys map and tracks the keydown state. When a touch starts, it simulates
   * a 'keydown' event and adds an 'active' class to the node. When the touch ends, it simulates a 'keyup'
   * event, removes the keydown state, and removes the 'active' class from the node and the last touched element.
   */
  bindKey(node: HTMLElement, key: string) {
    node.addEventListener("touchstart", event => {
      event.preventDefault();
      this.touchButtonDown(node, key);
    });

    node.addEventListener("touchend", event => {
      event.preventDefault();
      this.touchButtonUp(node, key, event.target["id"]);
    });
  }

  touchButtonDown(node: HTMLElement, key: string) {
    if (this.buttonLock.includes(key)) {
      return;
    }
    this.simulateKeyboardEvent("keydown", key);
    clearInterval(this.inputInterval[key]);
    this.inputInterval[key] = setInterval(() => {
      this.simulateKeyboardEvent("keydown", key);
    }, repeatInputDelayMillis);
    this.buttonLock.push(key);
    node.classList.add("active");

  }

  touchButtonUp(node: HTMLElement, key: string, id: string) {
    if (!this.buttonLock.includes(key)) {
      return;
    }
    this.simulateKeyboardEvent("keyup", key);

    node.classList.remove("active");

    document.getElementById(id)?.classList.remove("active");
    const index = this.buttonLock.indexOf(key);
    this.buttonLock.splice(index, 1);
    clearInterval(this.inputInterval[key]);
  }

  /**
   * Simulates a keyboard event on the canvas.
   *
   * @param eventType - The type of the keyboard event ('keydown' or 'keyup').
   * @param key - The key to simulate.
   *
   * @remarks
   * This function checks if the key exists in the Button enum. If it does, it retrieves the corresponding button
   * and emits the appropriate event ('input_down' or 'input_up') based on the event type.
   */
  simulateKeyboardEvent(eventType: string, key: string) {
    if (!Button.hasOwnProperty(key)) {
      return;
    }
    const button = Button[key];

    switch (eventType) {
    case "keydown":
      this.events.emit("input_down", {
        controller_type: "keyboard",
        button: button,
        isTouch: true
      });
      break;
    case "keyup":
      this.events.emit("input_up", {
        controller_type: "keyboard",
        button: button,
        isTouch: true
      });
      break;
    }
  }

  /**
   * {@link https://stackoverflow.com/a/39778831/4622620|Source}
   *
   * Prevent zoom on specified element
   * @param {HTMLElement} element
   */
  preventElementZoom(element: HTMLElement): void {
    if (!element) {
      return;
    }
    element.addEventListener("touchstart", (event: TouchEvent) => {

      if (!(event.currentTarget instanceof HTMLElement)) {
        return;
      }

      const currentTouchTimeStamp = event.timeStamp;
      const previousTouchTimeStamp = Number(event.currentTarget.dataset.lastTouchTimeStamp) || currentTouchTimeStamp;
      const timeStampDifference = currentTouchTimeStamp - previousTouchTimeStamp;
      const fingers = event.touches.length;
      event.currentTarget.dataset.lastTouchTimeStamp = String(currentTouchTimeStamp);

      if (!timeStampDifference || timeStampDifference > 500 || fingers > 1) {
        return;
      } // not double-tap

      event.preventDefault();

      if (event.target instanceof HTMLElement) {
        event.target.click();
      }
    });
  }

  /**
     * Deactivates all currently pressed keys.
     */
  deactivatePressedKey(): void {
    for (const key of Object.keys(this.inputInterval)) {
      clearInterval(this.inputInterval[key]);
    }
    for (const button of document.querySelectorAll("[data-key]")) {
      button.classList.remove("active");
    }
    this.buttonLock = [];
  }
}

/**
 * Check if the device has a touchscreen.
 *
 * @returns `true` if the device has a touchscreen, otherwise `false`.
 */
export function hasTouchscreen(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/**
 * Check if the device is a mobile device.
 *
 * @returns `true` if the device is a mobile device, otherwise `false`.
 */
export function isMobile(): boolean {
  let ret = false;
  (function (a) {
    // Check the user agent string against a regex for mobile devices
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
      ret = true;
    }
  })(navigator.userAgent || navigator.vendor || window["opera"]);
  return ret;
}
