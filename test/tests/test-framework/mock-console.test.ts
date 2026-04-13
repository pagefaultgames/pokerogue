import { inferColorFormat } from "#test/mocks/mock-console/infer-color";
import { hslToHex } from "#utils/common";
import chalk, { type ChalkInstance } from "chalk";
import { describe, expect, it } from "vitest";
import colorMap from "../../mocks/mock-console/color-map.json";

describe("Mock Console tests", () => {
  describe("inferColorFormat", () => {
    function expectFormatEqual(actualFormat: ChalkInstance, expectedFormat: ChalkInstance): void {
      // We can't compare chalk instances directly, but we can check that they produce the same output for a given input
      const testString = "test";
      expect(actualFormat(testString)).toBe(expectedFormat(testString));
    }

    it.each([
      { format: "Chalk styles", colorName: "red", instance: chalk.red },
      { format: "RGB", colorName: "rgb(25.5, 5, 10)", instance: chalk.rgb(25.5, 5, 10) },
      {
        format: "RGB with spaces",
        colorName: "rgb(25.5 5 10)",
        args: ["%cHello, world!"],
        instance: chalk.rgb(25.5, 5, 10),
      },
      {
        format: "HSL",
        colorName: "hsl(0, 100%, 50%)",
        args: ["%cHello, world!"],
        instance: chalk.hex(hslToHex(0, 1, 0.5)),
      },
      { format: "3-digit hex codes", colorName: "#fad", instance: chalk.hex("#ffaadd") },
      { format: "4-digit hex codes", colorName: "#fadf", instance: chalk.hex("#ffaadd") },
      { format: "6-digit hex codes", colorName: "#ffaadd", instance: chalk.hex("#ffaadd") },
      { format: "8-digit hex codes", colorName: "#ffaaddff", instance: chalk.hex("#ffaadd") },
      {
        format: "CSS color names",
        colorName: "rEbEccaPUrPlE", // case insensitivity test
        instance: chalk.hex(colorMap["RebeccaPurple"]),
      },
    ])("should parse correctly when passed $format", ({ colorName, instance }) => {
      const args: [string, ...unknown[]] = ["%cHello, world!", `color: ${colorName}`];
      const formatter = inferColorFormat(args);
      expectFormatEqual(formatter, instance);
    });

    it("should remove the color specifier after determining the format", () => {
      const args = ["%cHello, world!", "color: red"] as [string, ...unknown[]];
      const formatter = inferColorFormat(args);
      expect(args).toEqual(["Hello, world!"]);
      expectFormatEqual(formatter, chalk.red);
    });

    it("should not strip extra args from the message other than the color", () => {
      const args = ["%cCe message est %s", "très rouge", "color: red"] as [string, ...unknown[]];
      const formatter = inferColorFormat(args);
      expect(args).toEqual(["Ce message est %s", "très rouge"]);
      expectFormatEqual(formatter, chalk.red);
    });
  });
});
