import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import { initLoggedInUser } from "#app/account";
import { initAbilities } from "#app/data/abilities/ability";
import { initBiomes } from "#app/data/balance/biomes";
import { initEggMoves } from "#app/data/balance/egg-moves";
import { initPokemonPrevolutions, initPokemonStarters } from "#app/data/balance/pokemon-evolutions";
import { initMoves } from "#app/data/moves/move";
import { initMysteryEncounters } from "#app/data/mystery-encounters/mystery-encounters";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initAchievements } from "#app/system/achv";
import { initVouchers } from "#app/system/voucher";
import { initStatsKeys } from "#app/ui/game-stats-ui-handler";
import { setCookie } from "#app/utils/cookies";
import { blobToString } from "#test/testUtils/gameManagerUtils";
import { MockConsoleLog } from "#test/testUtils/mocks/mockConsoleLog";
import { mockContext } from "#test/testUtils/mocks/mockContextCanvas";
import { mockLocalStorage } from "#test/testUtils/mocks/mockLocalStorage";
import { MockImage } from "#test/testUtils/mocks/mocksContainer/mockImage";
import Phaser from "phaser";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { manageListeners } from "./listenersManager";
import { initI18n } from "#app/plugins/i18n";

let wasInitialized = false;
/**
 * An initialization function that is run at the beginning of every test file (via `beforeAll()`).
 */
export function initTestFile() {
  // Set the timezone to UTC for tests.
  process.env.TZ = "UTC";

  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage(),
  });
  Object.defineProperty(window, "console", {
    value: new MockConsoleLog(false),
  });
  Object.defineProperty(document, "fonts", {
    writable: true,
    value: {
      add: () => {},
    },
  });

  BBCodeText.prototype.destroy = () => null;
  // @ts-ignore
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

  window.matchMedia = () =>
    ({
      matches: false,
    }) as any;

  /**
   * Sets this object's position relative to another object with a given offset
   * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
   * @param x The relative x position
   * @param y The relative y position
   */
  const setPositionRelative = function (guideObject: any, x: number, y: number) {
    const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
    const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
    this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
  };

  Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
  Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
  Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
  Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
  Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
  Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;
  HTMLCanvasElement.prototype.getContext = () => mockContext;

  // Initialize all of these things if and only if they have not been initialized yet
  if (!wasInitialized) {
    wasInitialized = true;
    initI18n();
    initVouchers();
    initAchievements();
    initStatsKeys();
    initPokemonPrevolutions();
    initBiomes();
    initEggMoves();
    initPokemonForms();
    initSpecies();
    initMoves();
    initAbilities();
    initLoggedInUser();
    initMysteryEncounters();
    // init the pokemon starters for the pokedex
    initPokemonStarters();
  }

  manageListeners();
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
