import { expect, describe, it } from "vitest";
import { randomString } from "./utils";

import Phaser from "phaser";

describe("utils", () => {
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
});
