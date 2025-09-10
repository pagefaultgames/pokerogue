import type { enumValueToKey, getEnumKeys, getEnumValues } from "#app/utils/enums";
import type { EnumOrObject, NormalEnum, TSNumericEnum } from "#types/enum-types";
import type { ObjectValues } from "#types/type-helpers";
import { describe, expectTypeOf, it } from "vitest";

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

interface testObject {
  key_1: "1";
  key_2: "2";
  key_3: "3";
}

describe("Enum Type Helpers", () => {
  describe("ObjectValues", () => {
    it("should produce a union of an object's values", () => {
      expectTypeOf<ObjectValues<testObject>>().toEqualTypeOf<"1" | "2" | "3">();
    });

    it("should go from enum object type to value type", () => {
      expectTypeOf<ObjectValues<typeof testEnumNum>>().toEqualTypeOf<testEnumNum>();
      expectTypeOf<ObjectValues<typeof testEnumNum>>().branded.toEqualTypeOf<1 | 2>();

      expectTypeOf<ObjectValues<typeof testEnumString>>().toEqualTypeOf<testEnumString>();
      expectTypeOf<ObjectValues<typeof testEnumString>>().toEqualTypeOf<
        testEnumString.testS1 | testEnumString.testS2
      >();

      expectTypeOf<ObjectValues<typeof testEnumString>>().toExtend<"apple" | "banana">();
    });

    it("should produce union of const object values as type", () => {
      expectTypeOf<ObjectValues<typeof testObjNum>>().toEqualTypeOf<1 | 2>();
      expectTypeOf<ObjectValues<typeof testObjString>>().toEqualTypeOf<"apple" | "banana">();
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
      expectTypeOf<typeof testEnumNum>().toExtend<EnumOrObject>();
      expectTypeOf<typeof testEnumString>().toExtend<EnumOrObject>();
      expectTypeOf<typeof testObjNum>().toExtend<EnumOrObject>();
      expectTypeOf<typeof testObjString>().toExtend<EnumOrObject>();
    });

    it("should not match an enum value union w/o typeof", () => {
      expectTypeOf<testEnumNum>().not.toExtend<EnumOrObject>();
      expectTypeOf<testEnumString>().not.toExtend<EnumOrObject>();
    });

    it("should be equivalent to `TSNumericEnum | NormalEnum`", () => {
      expectTypeOf<EnumOrObject>().toEqualTypeOf<TSNumericEnum<EnumOrObject> | NormalEnum<EnumOrObject>>();
    });
  });
});

describe("Enum Functions", () => {
  describe("getEnumKeys", () => {
    it("should retrieve keys of numeric enum", () => {
      expectTypeOf<typeof getEnumKeys<typeof testEnumNum>>().returns.toEqualTypeOf<("testN1" | "testN2")[]>();
      expectTypeOf<typeof getEnumKeys<typeof testObjNum>>().returns.toEqualTypeOf<("testON1" | "testON2")[]>();
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
