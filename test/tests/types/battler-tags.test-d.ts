import type { BattlerTagTypeMap } from "#data/battler-tags";
import { describe, expectTypeOf, it } from "vitest";

describe("BattlerTags", () => {
  it("should contain tagTypes compatible with the key given in BattlerTagTypeMap", () => {
    type IncompatibleBattlerTagTypeMapKeys = {
      [K in keyof BattlerTagTypeMap]: K extends BattlerTagTypeMap[K]["tagType"] ? never : K;
    }[keyof BattlerTagTypeMap];

    expectTypeOf<IncompatibleBattlerTagTypeMapKeys>().toBeNever();
  });
});
