import { padInt, randomString } from "#utils/common";
import { deepMergeSpriteData } from "#utils/data";
import Phaser from "phaser";
import { beforeAll, describe, expect, it } from "vitest";

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
  describe("deepMergeSpriteData", () => {
    it("should merge two objects' common properties", () => {
      const dest = { a: 1, b: 2 };
      const source = { a: 3, b: 3, e: 4 };
      deepMergeSpriteData(dest, source);
      expect(dest).toEqual({ a: 3, b: 3 });
    });

    it("does nothing for identical objects", () => {
      const dest = { a: 1, b: 2 };
      const source = { a: 1, b: 2 };
      deepMergeSpriteData(dest, source);
      expect(dest).toEqual({ a: 1, b: 2 });
    });

    it("should preserve missing and mistyped properties", () => {
      const dest = { a: 1, c: 56, d: "test" };
      const source = { a: "apple", b: 3, d: "no hablo español" };
      deepMergeSpriteData(dest, source);
      expect(dest).toEqual({ a: 1, c: 56, d: "no hablo español" });
    });

    it("should copy arrays verbatim even with mismatches", () => {
      const dest = { a: 1, b: [{ d: 1 }, { d: 2 }, { d: 3 }] };
      const source = { a: 3, b: [{ c: [4, 5] }, { p: [7, 8] }], e: 4 };
      deepMergeSpriteData(dest, source);
      expect(dest).toEqual({ a: 3, b: [{ c: [4, 5] }, { p: [7, 8] }] });
    });
  });
});
