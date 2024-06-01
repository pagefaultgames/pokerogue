import {beforeAll, describe, it, expect, beforeEach} from "vitest";
import mockConsoleLog from "#app/test/essentials/mocks/mockConsoleLog";

describe("Test Console log mock", () => {
  beforeAll(() => {
    Object.defineProperty(window, "console", {
      value: mockConsoleLog(false),
    });
  });

  beforeEach(() => {
    console.clearLogs();
  });

  it("classic console.log, 1 params", () => {
    console.log("Hello World");
    expect(console.getLogs()).toEqual(["Hello World"]);
  });

  it("classic console.log, 2 params", () => {
    console.log("Hello World", "Hello World 2");
    expect(console.getLogs()).toEqual(["Hello World;Hello World 2"]);
  });

  it("console with var", () => {
    console.log("Hello World", 123);
    expect(console.getLogs()).toEqual(["Hello World;123"]);
  });

  it("console with dict", () => {
    console.log("Hello World", {name: "coucou"});
    expect(console.getLogs()).toEqual(["Hello World;{\"name\":\"coucou\"}"]);
  });
});
