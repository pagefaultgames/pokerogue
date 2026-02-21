import { deepCopy, isBareObject } from "#utils/data";
import { describe, expect, it } from "vitest";

describe("Utils - Data", () => {
  describe("deepCopy", () => {
    it("should create a deep copy of an object", () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = deepCopy(original);
      // ensure the references are different
      expect(copy === original, "copied object should not compare equal").not;
      expect(copy).toEqual(original);
      // update copy's `a` to a different value and ensure original is unaffected
      copy.a = 42;
      expect(original.a, "adjusting property of copy should not affect original").toBe(1);
      // update copy's nested `b.c` to a different value and ensure original is unaffected
      copy.b.c = 99;
      expect(original.b.c, "adjusting nested property of copy should not affect original").toBe(2);
    });
  });

  describe("isBareObject", () => {
    it("should properly identify bare objects", () => {
      expect(isBareObject({}), "{} should be considered bare");
      expect(isBareObject(new Object()), "new Object() should be considered bare");
      expect(isBareObject(Object.create(null)));
      expect(isBareObject([]), "an empty array should be considered bare");
    });

    it("should properly reject non-objects", () => {
      expect(isBareObject(new Date())).not;
      expect(isBareObject(null)).not;
      expect(isBareObject(42)).not;
      expect(isBareObject("")).not;
      expect(isBareObject(undefined)).not;
      expect(isBareObject(() => {})).not;
      expect(isBareObject(new (class A {})())).not;
    });
  });
});
