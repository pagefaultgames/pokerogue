import { setTimeout } from "timers/promises";
import { describe, expect, it, vi } from "vitest";

describe("Timeout resets", () => {
  let counter = 1;

  it.sequential("should not reset intervals during test", async () => {
    vi.spyOn(global, "clearInterval");
    setInterval(() => {
      console.log("interval called");
      counter++;
      expect(counter).toBeLessThan(200);
    }, 50);
    await vi.waitUntil(() => counter > 2);
    expect(clearInterval).not.toHaveBeenCalled();
  });

  it.sequential("should reset intervals after test end", async () => {
    const initCounter = counter;
    await setTimeout(500);
    // Were the interval active, the counter would have increased by now
    expect(counter).toBe(initCounter);
  });
});
