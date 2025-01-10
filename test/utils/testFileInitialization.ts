import { initLoggedInUser } from "#app/account";
import { SESSION_ID_COOKIE } from "#app/constants";
import { initAbilities } from "#app/data/all-abilities";
import { allMoves, initMoves } from "#app/data/all-moves";
import { initBiomes } from "#app/data/balance/biomes";
import { initEggMoves } from "#app/data/balance/egg-moves";
import { initPokemonPrevolutions } from "#app/data/balance/pokemon-evolutions";
import { initMysteryEncounters } from "#app/data/mystery-encounters/mystery-encounters";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initAchievements } from "#app/system/achv";
import { initVouchers } from "#app/system/voucher";
import { initStatsKeys } from "#app/ui/game-stats-ui-handler";
import { setCookie } from "#app/utils";
import { blobToString } from "#test/testUtils/gameManagerUtils";
import { MockConsoleLog } from "#test/testUtils/mocks/mockConsoleLog";
import { mockLocalStorage } from "#test/testUtils/mocks/mockLocalStorage";
import { MockImage } from "#test/testUtils/mocks/mocksContainer/mockImage";
import Phaser from "phaser";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import { vi } from "vitest";
import { MockFetch } from "./mocks/mockFetch";

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
  global.fetch = vi.fn(MockFetch) as any;
  setCookie(SESSION_ID_COOKIE, "fake_token");

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

  // Initialize all of these things if and only if they have not been initialized yet
  if (allMoves.length === 0) {
    initMoves();
    initVouchers();
    initAchievements();
    initStatsKeys();
    initPokemonPrevolutions();
    initBiomes();
    initEggMoves();
    initPokemonForms();
    initSpecies();
    initAbilities();
    initLoggedInUser();
    initMysteryEncounters();
  }
}
