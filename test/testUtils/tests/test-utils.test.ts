import { waitUntil } from "#test/testUtils/testUtils";
import { describe, expect, it, vi } from "vitest";

describe("waitUntil", () => {
  it("should resolve once the given condition has been met", async () => {
    let a = 1;
    setTimeout(() => {
      a = 0;
    }, 500);
    const spy = vi.fn();
    await waitUntil(() => a === 0).then(() => {
      spy(); // Call the spy function
    });
    expect(spy).toHaveBeenCalled();
  });
});
