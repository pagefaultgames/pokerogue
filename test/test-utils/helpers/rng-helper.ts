import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { vi } from "vitest";

export class RngHelper extends GameManagerHelper {
  /**
   * Performs the RNG experiment dictated by `fn` while sampling uniformly n times from
   * the full range of possible RNG values, where n is the number of trials to perform.
   *
   * Specifically, this function divides the interval of possible RNG values into n equal slices,
   * then samples exactly once from the midpoint of each interval,
   * and rounds down as necessary for integer-based RNG functions.
   *
   * @param numTrials - The number of trials to perform
   * @param fn - The function to be called during each trial
   * @example
   * ```
   * let zeroCounter = 0;
   *
   * await game.rng.equalSample(1000, () => {
   *   if (randSeedInt(1000) === 0) {
   *     zeroCounter++;
   *   }
   * });
   *
   * expect(zeroCounter).toBe(1);
   * ```
   */
  public async equalSample(numTrials: number, fn: () => Promise<void> | void): Promise<void> {
    let sampleProgress = 0; // This will simulate range of RNG calls by slowly increasing from 0 to 1

    // Mock both the global RNG and the battle-specific RNG
    vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
      return min + (max - min) * sampleProgress;
    });
    vi.spyOn(this.game.scene, "randBattleSeedInt").mockImplementation((range: number, min = 0) => {
      return Math.floor(min + range * sampleProgress);
    });

    for (let i = 0; i < numTrials; i++) {
      sampleProgress = (2 * i + 1) / (2 * numTrials); // The midpoint of the i^th interval
      await fn();
    }

    vi.spyOn(Phaser.Math.RND, "realInRange").mockRestore();
    vi.spyOn(this.game.scene, "randBattleSeedInt").mockRestore();
  }
}
