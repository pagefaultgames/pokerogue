interface ButtonKey {
  onDown: (opt: object) => void;
  onUp: (opt: object) => void;
}

type ButtonMap = Map<string, ButtonKey>;

export const keys = new Map();
export const keysDown = new Map();
let lastTouchedId: string;

/**
 * Initializes all touch controls
 *
 * @param buttonMap Map of buttons to key objects
 */
export function initTouchControls(buttonMap: ButtonMap) {
  preventElementZoom(document.querySelector("#dpad"));
  preventElementZoom(document.querySelector("#apad"));

  for (const button of document.querySelectorAll<HTMLElement>("[data-key]")) {
    bindKey(button, button.dataset.key, buttonMap);
  }
}

/**
 * Check if the device has a touchscreen
 */
export function hasTouchscreen() {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/**
 * Check if it's a mobile device through the user-agent
 */
export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window["opera"];
  return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4)));
}

/**
 * Simulate a keyboard event on the canvas
 *
 * @param eventType Type of the keyboard event
 * @param button Button to simulate
 * @param buttonMap Map of buttons to key objects
 */
function simulateKeyboardEvent(eventType: string, button: string, buttonMap: ButtonMap) {
  const key = buttonMap[button];

  switch (eventType) {
  case "keydown":
    key.onDown({});
    break;
  case "keyup":
    key.onUp({});
    break;
  }
}

/**
 * Simulate a keyboard input from 'keydown' to 'keyup'
 *
 * @param {string} key Key to simulate
 * @param {object} buttonMap Map of buttons to key objects
 */
// function simulateKeyboardInput(key, buttonMap) {
//   simulateKeyboardEvent('keydown', key, buttonMap);
//   window.setTimeout(() => {
//     simulateKeyboardEvent('keyup', key, buttonMap);
//   }, 100);
// }

/**
 * Bind a node by a specific key to simulate on touch
 *
 * @param node The node to bind a key to
 * @param key Key to simulate
 * @param buttonMap Map of buttons to key objects
 */
function bindKey(node: Element, key: string, buttonMap: ButtonMap) {
  keys.set(node.id, key);

  node.addEventListener("touchstart", (event: TouchEvent) => {
    event.preventDefault();
    simulateKeyboardEvent("keydown", key, buttonMap);
    if (!(event.target instanceof Element)) {
      return;
    }
    keysDown.set(event.target.id, node.id);
    node.classList.add("active");
  });

  node.addEventListener("touchend", (event: TouchEvent) => {
    event.preventDefault();

    if (!(event.target instanceof Element)) {
      return;
    }
    const pressedKey = keysDown.get(event.target.id);
    if (pressedKey && keys.has(pressedKey)) {
      const key = keys.get(pressedKey);
      simulateKeyboardEvent("keyup", key, buttonMap);
    }

    keysDown.delete(event.target.id);
    node.classList.remove("active");

    if (lastTouchedId) {
      document.getElementById(lastTouchedId).classList.remove("active");
    }
  });

  // Inspired by https://github.com/pulsejet/mkxp-web/blob/262a2254b684567311c9f0e135ee29f6e8c3613e/extra/js/dpad.js
  node.addEventListener("touchmove", (event : TouchEvent) => {
    if (!(event.changedTouches[0].target instanceof Element)) {
      return;
    }
    const { target, clientX, clientY } = event.changedTouches[0];
    const origTargetId = keysDown.get(target.id);
    const nextTargetId = document.elementFromPoint(clientX, clientY).id;
    if (origTargetId === nextTargetId) {
      return;
    }

    if (origTargetId) {
      const key = keys.get(origTargetId);
      simulateKeyboardEvent("keyup", key, buttonMap);
      keysDown.delete(target.id);
      document.getElementById(origTargetId).classList.remove("active");
    }

    if (keys.has(nextTargetId)) {
      const key = keys.get(nextTargetId);
      simulateKeyboardEvent("keydown", key, buttonMap);
      keysDown.set(target.id, nextTargetId);
      lastTouchedId = nextTargetId;
      document.getElementById(nextTargetId).classList.add("active");
    }
  });
}

/**
 * Prevent zoom on specified element
 *
 * {@link https://stackoverflow.com/a/39778831/4622620|Source}
 *
 * @param element The element to prevent zoom on
 */
function preventElementZoom(element: HTMLElement) {
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
