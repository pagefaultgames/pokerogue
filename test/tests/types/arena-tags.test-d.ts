import type { ArenaTagTypeMap } from "#data/arena-tag";
import { describe, expectTypeOf, it } from "vitest";

describe("ArenaTags", () => {
  it("should contain tagTypes compatible with the key given in ArenaTagTypeMap", () => {
    type IncompatibleArenaTagTypeMapKeys = {
      [K in keyof ArenaTagTypeMap]: K extends ArenaTagTypeMap[K]["tagType"] ? never : K;
    }[keyof ArenaTagTypeMap];

    expectTypeOf<IncompatibleArenaTagTypeMapKeys>().toBeNever();
  });
});
