import { getSplashMessages } from "#app/data/splash-messages";
import { afterEach } from "node:test";
import { describe, expect, it, vi } from "vitest";

const Jan = 1;
const Sep = 8;
const Oct = 9;
const Dec = 11;

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
      testSeason(new Date(2023, Sep, 15), new Date(2023, Oct, 31), "halloween");
    });

    it("should contain xmas messages from Dec 1 to Dec 26", () => {
      testSeason(new Date(2023, Dec, 1), new Date(2023, Dec, 26), "xmas");
    });

    it("should contain new years messages frm Jan 1 to Jan 31", () => {
      testSeason(new Date(2024, Jan, 1), new Date(2024, Jan, 31), "newYears");
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
    return getSplashMessages().filter(filterFn).length;
  });

  expect(before).toBe(0);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(0);
  expect(after).toBe(0);
}
