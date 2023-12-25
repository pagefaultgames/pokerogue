const keys = new Map();
const keysDown = new Map();
let lastTouchedId;

function initTouchControls(buttonMap) {
  for (const button of document.querySelectorAll('[data-key]')) {
    // @ts-ignore
    bindKey(button, button.dataset.key, buttonMap);
  }
}

function hasTouchscreen() {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

/**
 * Simulate a keyboard event on the canvas
 *
 * @param {string} eventType Type of the keyboard event
 * @param {string} button Button to simulate
 * @param {object} buttonMap Map of buttons to key objects
 */
function simulateKeyboardEvent(eventType, button, buttonMap) {
  const key = buttonMap[button];
  
  switch (eventType) {
    case 'keydown':
      key.onDown({});
      break;
    case 'keyup':
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
function simulateKeyboardInput(key, buttonMap) {
  simulateKeyboardEvent('keydown', key, buttonMap);
  window.setTimeout(() => {
    simulateKeyboardEvent('keyup', key, buttonMap);
  }, 100);
}

/**
 * Bind a node by a specific key to simulate on touch
 *
 * @param {*} node The node to bind a key to
 * @param {string} key Key to simulate
 * @param {object} buttonMap Map of buttons to key objects
 */
function bindKey(node, key, buttonMap) {
  keys.set(node.id, key);

  node.addEventListener('touchstart', event => {
    event.preventDefault();
    simulateKeyboardEvent('keydown', key, buttonMap);
    keysDown.set(event.target.id, node.id);
    node.classList.add('active');
  });

  node.addEventListener('touchend', event => {
    event.preventDefault();

    const pressedKey = keysDown.get(event.target.id);
    if (pressedKey && keys.has(pressedKey)) {
      const key = keys.get(pressedKey);
      simulateKeyboardEvent('keyup', key, buttonMap);
    }

    keysDown.delete(event.target.id);
    node.classList.remove('active');

    if (lastTouchedId) {
      document.getElementById(lastTouchedId).classList.remove('active');
    }
  });

  // Inspired by https://github.com/pulsejet/mkxp-web/blob/262a2254b684567311c9f0e135ee29f6e8c3613e/extra/js/dpad.js
  node.addEventListener('touchmove', event => {
    const { target, clientX, clientY } = event.changedTouches[0];
    const origTargetId = keysDown.get(target.id);
    const nextTargetId = document.elementFromPoint(clientX, clientY).id;
    if (origTargetId === nextTargetId)
      return;

    if (origTargetId) {
      const key = keys.get(origTargetId);
      simulateKeyboardEvent('keyup', key, buttonMap);
      keysDown.delete(target.id);
      document.getElementById(origTargetId).classList.remove('active');
    }

    if (keys.has(nextTargetId)) {
      const key = keys.get(nextTargetId);
      simulateKeyboardEvent('keydown', key, buttonMap);
      keysDown.set(target.id, nextTargetId);
      lastTouchedId = nextTargetId;
      document.getElementById(nextTargetId).classList.add('active');
    }
  });
}