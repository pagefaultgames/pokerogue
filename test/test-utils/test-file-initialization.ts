import { initAbilities } from "#abilities/ability";
import { initLoggedInUser } from "#app/account";
import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import { initBiomes } from "#balance/biomes";
import { initEggMoves } from "#balance/egg-moves";
import { initPokemonPrevolutions, initPokemonStarters } from "#balance/pokemon-evolutions";
import { initPokemonForms } from "#data/pokemon-forms";
import { initSpecies } from "#data/pokemon-species";
import { initHeldItems } from "#items/all-held-items";
import { initTrainerItems } from "#items/all-trainer-items";
import { initHeldItemPools } from "#items/init-held-item-pools";
import { initTrainerItemPools } from "#items/init-trainer-item-pools";
import { initModifierPools } from "#modifiers/init-modifier-pools";
import { initModifierTypes } from "#modifiers/modifier-type";
import { initMoves } from "#moves/move";
import { initMysteryEncounters } from "#mystery-encounters/mystery-encounters";
import { initI18n } from "#plugins/i18n";
import { initAchievements } from "#system/achv";
import { initVouchers } from "#system/voucher";
import { blobToString } from "#test/test-utils/game-manager-utils";
import { manageListeners } from "#test/test-utils/listeners-manager";
import { MockConsoleLog } from "#test/test-utils/mocks/mock-console-log";
import { mockContext } from "#test/test-utils/mocks/mock-context-canvas";
import { mockLocalStorage } from "#test/test-utils/mocks/mock-local-storage";
import { MockImage } from "#test/test-utils/mocks/mocks-container/mock-image";
import { initStatsKeys } from "#ui/game-stats-ui-handler";
import { setCookie } from "#utils/cookies";
import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import InputText from "phaser3-rex-plugins/plugins/inputtext";

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
  const setPositionRelative = function (guideObject: any, x: number, y: number): any {
    const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
    const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
    return this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
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
    initHeldItems();
    initHeldItemPools();
    initTrainerItems();
    initTrainerItemPools();
    initModifierTypes();
    initModifierPools();
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
