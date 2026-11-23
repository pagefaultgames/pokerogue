import { activeOverrides } from "#app/overrides";
import type { RewardOption } from "#items/reward";
import { playerRewardPool, type RewardPool } from "#items/reward-pool";
import { generateRewardOptionFromId } from "#items/reward-utils";
import type { RewardConfiguration, RewardGenerationOptions } from "#types/rewards";

export type { CustomRewardSettings } from "#types/rewards";

/** Options for {@linkcode generatePlayerRewardOptions}. */
export interface PlayerRewardGenerationOptions extends RewardGenerationOptions {
  /**
   * The pool to draw from.
   * @defaultValue {@linkcode playerRewardPool}
   */
  pool?: RewardPool;
}

/**
 * Generate the reward options presented to the player after a battle.
 *
 * This is the single entry point for player reward generation: it draws from the pool
 * (see {@linkcode RewardPool.generateOptions}) and then applies any active `REWARD_OVERRIDE`s.
 * @param count - The number of options to generate
 * @param options - See {@linkcode PlayerRewardGenerationOptions}
 */
export function generatePlayerRewardOptions(
  count: number,
  options: PlayerRewardGenerationOptions = {},
): RewardOption[] {
  const { pool = playerRewardPool, ...generationOptions } = options;
  const rewardOptions = pool.generateOptions(count, generationOptions);
  applyRewardOverrides(rewardOptions);
  return rewardOptions;
}

/**
 * Replace the leading entries of `options` with the rewards in `REWARD_OVERRIDE`,
 * up to the shorter of the two lists.
 * @param options - Array of naturally rolled {@linkcode RewardOption}s; modified in place
 */
export function applyRewardOverrides(options: RewardOption[]): void {
  const minLength = Math.min(options.length, activeOverrides.REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const specs: RewardConfiguration = activeOverrides.REWARD_OVERRIDE[i];
    const rewardOption = generateRewardOptionFromId(specs);
    if (rewardOption) {
      options[i] = rewardOption;
    }
  }
}
