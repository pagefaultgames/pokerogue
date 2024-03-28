import { expect, describe, it } from "vitest";
import { randomString } from "./utils";

describe("utils", () => {
  describe("randomString", () => {
    it("should return a string of the specified length", () => {
      const str = randomString(10);
      expect(str.length).toBe(10);
    });
  });
});
