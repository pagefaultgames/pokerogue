import * as Constants from "#app/constants";
import { getSplashMessages } from "#data/splash-messages";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Data - Splash Messages", () => {
  it("should contain at least 15 splash messages", () => {
    expect(getSplashMessages().length).toBeGreaterThanOrEqual(15);
  });

  // Make sure to adjust this test if the weight is changed!
  it("should add contain 15 `battlesWon` splash messages", () => {
    const battlesWonMessages = getSplashMessages().filter(message => message === "splashMessages:battlesWon");
    expect(battlesWonMessages).toHaveLength(15);
  });

  describe("Seasonal", () => {
    beforeEach(() => {
      vi.spyOn(Constants, "USE_SEASONAL_SPLASH_MESSAGES", "get").mockReturnValue(true);
    });

    afterEach(() => {
      vi.useRealTimers(); // reset system time
    });

    it("should contain new years messages from Jan 1 to Jan 15", () => {
      testSeason(new Date("2025-01-01"), new Date("2025-01-15"), "newYears");
    });

    it("should contain valentines messages from Feb 7 to Feb 21", () => {
      testSeason(new Date("2025-02-07"), new Date("2025-02-21"), "valentines");
    });

    it("should contain april fools messages from April 1 to April 3", () => {
      testSeason(new Date("2025-04-01"), new Date("2025-04-03"), "aprilFools");
    });

    it("should contain halloween messages from Oct 15 to Oct 31", () => {
      testSeason(new Date("2025-10-15"), new Date("2025-10-31"), "halloween");
    });

    it("should contain winter holiday messages from Dec 1 to Dec 31", () => {
      testSeason(new Date("2025-12-01"), new Date("2025-12-31"), "winterHoliday");
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

  const dates: Date[] = [beforeDate, startDate, endDate, afterDate];
  const [before, start, end, after] = dates.map(date => {
    vi.setSystemTime(date);
    console.log("System time set to", date);
    const count = getSplashMessages().filter(filterFn).length;
    return count;
  });

  expect(before).toBe(0);
  expect(start).toBeGreaterThanOrEqual(10); // make sure to adjust if weight is changed!
  expect(end).toBeGreaterThanOrEqual(10); // make sure to adjust if weight is changed!
  expect(after).toBe(0);
}
