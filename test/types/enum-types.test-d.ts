import type { EnumOrObject, EnumValues, TSNumericEnum, NormalEnum } from "#app/@types/enum-types";

import type { getEnumKeys, getEnumValues } from "#app/utils/enums";
import type { enumValueToKey } from "#app/utils/enums";

import { expectTypeOf, describe, it } from "vitest";

enum testEnumNum {
  testN1 = 1,
  testN2 = 2,
}

enum testEnumString {
  testS1 = "apple",
  testS2 = "banana",
}

const testObjNum = { testON1: 1, testON2: 2 } as const;

const testObjString = { testOS1: "apple", testOS2: "banana" } as const;

describe("Enum Type Helpers", () => {
  describe("EnumValues", () => {
    it("should go from enum object type to value type", () => {
      expectTypeOf<EnumValues<typeof testEnumNum>>().toEqualTypeOf<testEnumNum>();
      expectTypeOf<EnumValues<typeof testEnumNum>>().branded.toEqualTypeOf<1 | 2>();

      expectTypeOf<EnumValues<typeof testEnumString>>().toEqualTypeOf<testEnumString>();
      expectTypeOf<EnumValues<typeof testEnumString>>().toEqualTypeOf<testEnumString.testS1 | testEnumString.testS2>();
      expectTypeOf<EnumValues<typeof testEnumString>>().toMatchTypeOf<"apple" | "banana">();
    });

    it("should produce union of const object values as type", () => {
      expectTypeOf<EnumValues<typeof testObjNum>>().toEqualTypeOf<1 | 2>();

      expectTypeOf<EnumValues<typeof testObjString>>().toEqualTypeOf<"apple" | "banana">();
    });
  });

  describe("TSNumericEnum", () => {
    it("should match numeric enums", () => {
      expectTypeOf<TSNumericEnum<typeof testEnumNum>>().toEqualTypeOf<typeof testEnumNum>();
    });

    it("should not match string enums or const objects", () => {
      expectTypeOf<TSNumericEnum<typeof testEnumString>>().toBeNever();
      expectTypeOf<TSNumericEnum<typeof testObjNum>>().toBeNever();
      expectTypeOf<TSNumericEnum<typeof testObjString>>().toBeNever();
    });
  });

  describe("NormalEnum", () => {
    it("should match string enums or const objects", () => {
      expectTypeOf<NormalEnum<typeof testEnumString>>().toEqualTypeOf<typeof testEnumString>();
      expectTypeOf<NormalEnum<typeof testObjNum>>().toEqualTypeOf<typeof testObjNum>();
      expectTypeOf<NormalEnum<typeof testObjString>>().toEqualTypeOf<typeof testObjString>();
    });
    it("should not match numeric enums", () => {
      expectTypeOf<NormalEnum<typeof testEnumNum>>().toBeNever();
    });
  });

  describe("EnumOrObject", () => {
    it("should match any enum or const object", () => {
      expectTypeOf<typeof testEnumNum>().toMatchTypeOf<EnumOrObject>();
      expectTypeOf<typeof testEnumString>().toMatchTypeOf<EnumOrObject>();
      expectTypeOf<typeof testObjNum>().toMatchTypeOf<EnumOrObject>();
      expectTypeOf<typeof testObjString>().toMatchTypeOf<EnumOrObject>();
    });

    it("should not match an enum value union w/o typeof", () => {
      expectTypeOf<testEnumNum>().not.toMatchTypeOf<EnumOrObject>();
      expectTypeOf<testEnumString>().not.toMatchTypeOf<EnumOrObject>();
    });

    it("should be equivalent to `TSNumericEnum | NormalEnum`", () => {
      expectTypeOf<EnumOrObject>().branded.toEqualTypeOf<TSNumericEnum<EnumOrObject> | NormalEnum<EnumOrObject>>();
    });
  });
});

describe("Enum Functions", () => {
  describe("getEnumKeys", () => {
    it("should retrieve keys of numeric enum", () => {
      expectTypeOf<typeof getEnumKeys<typeof testEnumNum>>().returns.toEqualTypeOf<("testN1" | "testN2")[]>();
    });
  });

  describe("getEnumValues", () => {
    it("should retrieve values of numeric enum", () => {
      expectTypeOf<typeof getEnumValues<typeof testEnumNum>>().returns.branded.toEqualTypeOf<(1 | 2)[]>();
    });
  });

  describe("enumValueToKey", () => {
    it("should retrieve values for a given key", () => {
      expectTypeOf<
        typeof enumValueToKey<typeof testEnumString, testEnumString.testS1>
      >().returns.toEqualTypeOf<"testS1">();
      expectTypeOf<typeof enumValueToKey<typeof testEnumString, testEnumString>>().returns.toEqualTypeOf<
        "testS1" | "testS2"
      >();
      expectTypeOf<typeof enumValueToKey<typeof testObjNum, 1>>().returns.toEqualTypeOf<"testON1">();
      expectTypeOf<typeof enumValueToKey<typeof testObjNum, 1 | 2>>().returns.toEqualTypeOf<"testON1" | "testON2">();
    });
  });
});
