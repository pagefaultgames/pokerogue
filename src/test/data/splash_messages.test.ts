import { getSplashMessages } from "#app/data/splash-messages";
import { describe, expect, it, vi, afterEach } from "vitest";

describe("Data - Splash Messages", () => {
  it("should contain at least 15 splash messages", () => {
    expect(getSplashMessages().length).toBeGreaterThanOrEqual(15);
  });

  // make sure to adjust this test if the weight it changed!
  it("should add contain 10 `battlesWon` splash messages", () => {
    const battlesWonMessages = getSplashMessages().filter((message) => message === "splashMessages:battlesWon");
    expect(battlesWonMessages).toHaveLength(10);
  });

  describe("Seasonal", () => {
    afterEach(() => {
      vi.useRealTimers(); // reset system time
    });

    it("should contain halloween messages from Sep 15 to Oct 31", () => {
      testSeason(new Date("2024-09-15"), new Date("2024-10-31"), "halloween");
    });

    it("should contain xmas messages from Dec 1 to Dec 26", () => {
      testSeason(new Date("2024-12-01"), new Date("2024-12-26"), "xmas");
    });

    it("should contain new years messages frm Jan 1 to Jan 31", () => {
      testSeason(new Date("2024-01-01"), new Date("2024-01-31"), "newYears");
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
  const [before, start, end, after] = dates.map((date) => {
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
