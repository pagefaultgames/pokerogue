import type { enumValueToKey, getEnumKeys, getEnumValues } from "#app/utils/enums";
import type { EnumOrObject, NormalEnum, TSNumericEnum } from "#types/enum-types";
import type { ObjectValues } from "#types/type-helpers";
import { describe, expectTypeOf, it } from "vitest";

enum TestEnumNum {
  testN1 = 1,
  testN2 = 2,
}

enum TestEnumString {
  testS1 = "apple",
  testS2 = "banana",
}

const testObjNum = { testON1: 1, testON2: 2 } as const;

const testObjString = { testOS1: "apple", testOS2: "banana" } as const;

interface TestObject {
  key_1: "1";
  key_2: "2";
  key_3: "3";
}

describe("Enum Type Helpers", () => {
  describe("ObjectValues", () => {
    it("should produce a union of an object's values", () => {
      expectTypeOf<ObjectValues<TestObject>>().toEqualTypeOf<"1" | "2" | "3">();
    });

    it("should go from enum object type to value type", () => {
      expectTypeOf<ObjectValues<typeof TestEnumNum>>().toEqualTypeOf<TestEnumNum>();
      expectTypeOf<ObjectValues<typeof TestEnumNum>>().branded.toEqualTypeOf<1 | 2>();

      expectTypeOf<ObjectValues<typeof TestEnumString>>().toEqualTypeOf<TestEnumString>();
      expectTypeOf<ObjectValues<typeof TestEnumString>>().toEqualTypeOf<
        TestEnumString.testS1 | TestEnumString.testS2
      >();

      expectTypeOf<ObjectValues<typeof TestEnumString>>().toExtend<"apple" | "banana">();
    });

    it("should produce union of const object values as type", () => {
      expectTypeOf<ObjectValues<typeof testObjNum>>().toEqualTypeOf<1 | 2>();
      expectTypeOf<ObjectValues<typeof testObjString>>().toEqualTypeOf<"apple" | "banana">();
    });
  });

  describe("TSNumericEnum", () => {
    it("should match numeric enums", () => {
      expectTypeOf<TSNumericEnum<typeof TestEnumNum>>().toEqualTypeOf<typeof TestEnumNum>();
    });
    it("should not match string enums or const objects", () => {
      expectTypeOf<TSNumericEnum<typeof TestEnumString>>().toBeNever();
      expectTypeOf<TSNumericEnum<typeof testObjNum>>().toBeNever();
      expectTypeOf<TSNumericEnum<typeof testObjString>>().toBeNever();
    });
  });

  describe("NormalEnum", () => {
    it("should match string enums or const objects", () => {
      expectTypeOf<NormalEnum<typeof TestEnumString>>().toEqualTypeOf<typeof TestEnumString>();
      expectTypeOf<NormalEnum<typeof testObjNum>>().toEqualTypeOf<typeof testObjNum>();
      expectTypeOf<NormalEnum<typeof testObjString>>().toEqualTypeOf<typeof testObjString>();
    });
    it("should not match numeric enums", () => {
      expectTypeOf<NormalEnum<typeof TestEnumNum>>().toBeNever();
    });
  });

  describe("EnumOrObject", () => {
    it("should match any enum or const object", () => {
      expectTypeOf<typeof TestEnumNum>().toExtend<EnumOrObject>();
      expectTypeOf<typeof TestEnumString>().toExtend<EnumOrObject>();
      expectTypeOf<typeof testObjNum>().toExtend<EnumOrObject>();
      expectTypeOf<typeof testObjString>().toExtend<EnumOrObject>();
    });

    it("should not match an enum value union w/o typeof", () => {
      expectTypeOf<TestEnumNum>().not.toExtend<EnumOrObject>();
      expectTypeOf<TestEnumString>().not.toExtend<EnumOrObject>();
    });

    it("should be equivalent to `TSNumericEnum | NormalEnum`", () => {
      expectTypeOf<EnumOrObject>().toEqualTypeOf<TSNumericEnum<EnumOrObject> | NormalEnum<EnumOrObject>>();
    });
  });
});

describe("Enum Functions", () => {
  describe("getEnumKeys", () => {
    it("should retrieve keys of numeric enum", () => {
      expectTypeOf<typeof getEnumKeys<typeof TestEnumNum>>().returns.toEqualTypeOf<("testN1" | "testN2")[]>();
    });
  });

  describe("getEnumValues", () => {
    it("should retrieve values of numeric enum", () => {
      expectTypeOf<typeof getEnumValues<typeof TestEnumNum>>().returns.branded.toEqualTypeOf<(1 | 2)[]>();
    });
  });

  describe("enumValueToKey", () => {
    it("should retrieve values for a given key", () => {
      expectTypeOf<
        typeof enumValueToKey<typeof TestEnumString, TestEnumString.testS1>
      >().returns.toEqualTypeOf<"testS1">();
      expectTypeOf<typeof enumValueToKey<typeof TestEnumString, TestEnumString>>().returns.toEqualTypeOf<
        "testS1" | "testS2"
      >();
      expectTypeOf<typeof enumValueToKey<typeof testObjNum, 1>>().returns.toEqualTypeOf<"testON1">();
      expectTypeOf<typeof enumValueToKey<typeof testObjNum, 1 | 2>>().returns.toEqualTypeOf<"testON1" | "testON2">();
    });
  });
});
