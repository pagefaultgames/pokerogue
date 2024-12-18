import { getSplashMessages } from "#app/data/splash-messages";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import * as Constants from "#app/constants";

describe("Data - Splash Messages", () => {
  it("should contain at least 15 splash messages", () => {
    expect(getSplashMessages().length).toBeGreaterThanOrEqual(15);
  });

  // make sure to adjust this test if the weight it changed!
  it("should add contain 10 `battlesWon` splash messages", () => {
    const battlesWonMessages = getSplashMessages().filter((message) => message === "splashMessages:common.battlesWon");
    expect(battlesWonMessages).toHaveLength(10);
  });

  describe("Seasonal", () => {
    beforeEach(() => {
      vi.spyOn(Constants, "USE_SEASONAL_SPLASH_MESSAGES", "get").mockReturnValue(true);
    });

    afterEach(() => {
      vi.useRealTimers(); // reset system time
    });

    it("should contain halloween messages from Oct 15 to Oct 31", () => {
      testSeason(new Date("2024-10-15"), new Date("2024-10-31"), "halloween");
    });

    it("should contain xmas messages from Dec 16 to Dec 31", () => {
      testSeason(new Date("2024-12-16"), new Date("2024-12-31"), "xmas");
    });

    it("should contain new years messages from Dec 31 '24 to Jan 14 '25", () => {
      testSeason(new Date("2024-12-31"), new Date("2025-01-14"), "newYears");
    });
  });
});

/**
 * Helpoer method to test seasonal messages
 * @param startDate The seasons start date
 * @param endDate The seasons end date
 * @param prefix the splash message prefix (e.g. `newYears` or `xmas`)
 */
function testSeason(startDate: Date, endDate: Date, prefix: string) {
  const filterFn = (message: string) => message.startsWith(`splashMessages:${prefix}.`);

  const beforeDate = new Date(startDate);
  beforeDate.setDate(startDate.getDate() - 1);

  const afterDate = new Date(endDate);
  afterDate.setDate(endDate.getDate() + 1);

  const dates: Date[] = [ beforeDate, startDate, endDate, afterDate ];
  const [ before, start, end, after ] = dates.map((date) => {
    vi.setSystemTime(date);
    console.log("System time set to", date);
    const count = getSplashMessages().filter(filterFn).length;
    return count;
  });

  expect(before).toBe(0);
  expect(start).toBeGreaterThanOrEqual(20); // make sure to adjust if weight is changed!
  expect(end).toBeGreaterThanOrEqual(20); // make sure to adjust if weight is changed!
  expect(after).toBe(0);
}
