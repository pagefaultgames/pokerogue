import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import { initializeGame } from "#app/init/init";
import { blobToString } from "#test/test-utils/game-manager-utils";
import { manageListeners } from "#test/test-utils/listeners-manager";
import { MockConsole } from "#test/test-utils/mocks/mock-console/mock-console";
import { mockContext } from "#test/test-utils/mocks/mock-context-canvas";
import { mockLocalStorage } from "#test/test-utils/mocks/mock-local-storage";
import { MockImage } from "#test/test-utils/mocks/mocks-container/mock-image";
import { setCookie } from "#utils/cookies";
import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import InputText from "phaser3-rex-plugins/plugins/inputtext";

let wasInitialized = false;

/**
 * Run initialization code upon starting a new file, both per-suite and per-instance ones.
 */
export function initTests(): void {
  setupStubs();
  if (!wasInitialized) {
    initializeGame();
    wasInitialized = true;
  }

  manageListeners();
}

/**
 * Setup various stubs for testing.
 * @todo Move this into a dedicated stub file instead of running it once per test instance
 * @todo review these to see which are actually necessary
 * @todo Investigate why this resets on new test suite start
 */
function setupStubs(): void {
  // TODO: Make this type safe
  Object.defineProperties(globalThis, {
    localStorage: {
      value: mockLocalStorage(),
    },
    console: {
      value: new MockConsole(),
    },
    matchMedia: {
      value: () => ({
        matches: false,
      }),
    },
  });
  Object.defineProperty(document, "fonts", {
    writable: true,
    value: {
      add: () => {},
    },
  });

  BBCodeText.prototype.destroy = () => null;
  // @ts-expect-error
  BBCodeText.prototype.resize = () => null;
  InputText.prototype.setElement = () => null as any;
  InputText.prototype.resize = () => null as any;
  Phaser.GameObjects.Image = MockImage as any;
  window.URL.createObjectURL = (blob: Blob) => {
    blobToString(blob).then((data: string) => {
      localStorage.setItem("toExport", data);
    });
    return null as any;
  };
  navigator.getGamepads = () => [];
  setCookie(SESSION_ID_COOKIE_NAME, "fake_token");
  HTMLCanvasElement.prototype.getContext = () => mockContext;
}

/**
 * Closes the current mock server and initializes a new mock server.
 * This is run at the beginning of every API test file.
 */
export async function initServerForApiTests() {
  global.server?.close();
  const { setupServer } = await import("msw/node");
  global.server = setupServer();
  global.server.listen({ onUnhandledRequest: "error" });
  return global.server;
}
