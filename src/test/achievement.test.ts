import {describe, expect, it} from "vitest";
import {MoneyAchv} from "#app/system/achv";

describe("check some Achievement related stuff", () => {
  it ("should check Achievement creation", () => {
    const ach = new MoneyAchv("Achievement", 1000, null, 100);
    expect(ach.name).toBe("Achievement");
  });
});
