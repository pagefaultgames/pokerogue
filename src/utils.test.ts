import {expect, describe, it, beforeAll} from "vitest";
import { randomString, padInt } from "./utils";

import Phaser from "phaser";

describe("utils", () => {

  beforeAll(() => {
    new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });
  describe("randomString", () => {
    it("should return a string of the specified length", () => {
      const str = randomString(10);
      expect(str.length).toBe(10);
    });

    it("should work with seed", () => {
      const state = Phaser.Math.RND.state();
      const str1 = randomString(10, true);
      Phaser.Math.RND.state(state);
      const str2 = randomString(10, true);

      expect(str1).toBe(str2);
    });
  });

  describe("padInt", () => {
    it("should return a string", () => {
      const result = padInt(1, 10);
      expect(typeof result).toBe("string");
    });

    it("should return a padded result with default padWith", () => {
      const result = padInt(1, 3);
      expect(result).toBe("001");
    });

    it("should return a padded result using a custom padWith", () => {
      const result = padInt(1, 10, "yes");
      expect(result).toBe("yesyesyes1");
    });

    it("should return inputted value when zero length is entered", () => {
      const result = padInt(1, 0);
      expect(result).toBe("1");
    });
  });
});
