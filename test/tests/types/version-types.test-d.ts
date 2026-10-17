import type {
  SessionMigratorVersions,
  SettingsMigratorVersions,
  SystemMigratorVersions,
} from "#system/version-migration/version-converter";
import type { AreVersionsSorted, CompareVersions, VersionString } from "#types/save-migrators";
import { describe, expectTypeOf, it } from "vitest";

describe("CompareVersions", () => {
  it("should correctly compare version strings", () => {
    // legacy version strings
    expectTypeOf<CompareVersions<"1.0.0", "1.0.1">>().toEqualTypeOf<-1>();
    expectTypeOf<CompareVersions<"1.0.1", "1.0.0">>().toEqualTypeOf<1>();
    expectTypeOf<CompareVersions<"1.0.0", "1.0.0">>().toEqualTypeOf<0>();
    expectTypeOf<CompareVersions<"1.2.3", "1.2.4">>().toEqualTypeOf<-1>();
    expectTypeOf<CompareVersions<"1.2.4", "1.2.3">>().toEqualTypeOf<1>();
    expectTypeOf<CompareVersions<"1.2.3", "1.2.3">>().toEqualTypeOf<0>();
    expectTypeOf<CompareVersions<"1.10.0", "1.9.9">>().toEqualTypeOf<1>();
    expectTypeOf<CompareVersions<"1.9.9", "1.10.0">>().toEqualTypeOf<-1>();
    expectTypeOf<CompareVersions<"1.10.0", "1.10.0">>().toEqualTypeOf<0>();
    // Modern version strings
    expectTypeOf<CompareVersions<"1.12.0.0", "1.12.0.1">>().toEqualTypeOf<-1>();
    expectTypeOf<CompareVersions<"1.12.0.1", "1.12.0.0">>().toEqualTypeOf<1>();
    expectTypeOf<CompareVersions<"1.12.0.0", "1.12.0.0">>().toEqualTypeOf<0>();
    // mixed legacy and modern version strings
    expectTypeOf<CompareVersions<"1.22.0.0", "1.11.0">>().toEqualTypeOf<1>();
    expectTypeOf<CompareVersions<"1.12.0.0", "1.12.0">>().toEqualTypeOf<0>();
    expectTypeOf<CompareVersions<"1.11.1", "1.12.0.1">>().toEqualTypeOf<-1>();
  });
});

describe("Version Sorting", () => {
  it("should correctly determine if a list of version strings is sorted in ascending order", () => {
    expectTypeOf<AreVersionsSorted<[]>>().toEqualTypeOf<true>();
    expectTypeOf<AreVersionsSorted<["1.0.0", VersionString]>>().toEqualTypeOf<boolean>();
    expectTypeOf<AreVersionsSorted<["1.1.1"]>>().toEqualTypeOf<true>();
    expectTypeOf<AreVersionsSorted<["1.1.1", "1.2.3"]>>().toEqualTypeOf<true>();
    expectTypeOf<AreVersionsSorted<["1.0.2", "1.0.1", "1.0.0"]>>().toEqualTypeOf<false>();
    expectTypeOf<AreVersionsSorted<["1.0.2", "1.0.2", "1.0.2"]>>().toEqualTypeOf<true>();
    expectTypeOf<AreVersionsSorted<["1.0.2", "1.0.3", "1.0.2"]>>().toEqualTypeOf<false>();
    expectTypeOf<AreVersionsSorted<["1.0.0", "1.0.1", "1.11.2", "1.12.0", "1.12.0.1"]>>().toEqualTypeOf<true>();
  });

  it("should have all migrator versions sorted in ascending order", () => {
    expectTypeOf<AreVersionsSorted<SystemMigratorVersions>>().toEqualTypeOf<true>();
    expectTypeOf<AreVersionsSorted<SessionMigratorVersions>>().toEqualTypeOf<true>();
    expectTypeOf<AreVersionsSorted<SettingsMigratorVersions>>().toEqualTypeOf<true>();
  });
});
